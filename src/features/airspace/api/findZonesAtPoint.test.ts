import { waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { findZonesAtPoint } from '@/features/airspace/api/findZonesAtPoint';
import { server } from '@/test/mocks/server';

const WFS_URL = 'https://server-eosin-five-92.vercel.app/api/vworld-api/wfs';
const POINT = { lat: 5, lng: 5 };

const ring = (minX: number, minY: number, maxX: number, maxY: number) => [
  [minX, minY],
  [maxX, minY],
  [maxX, maxY],
  [minX, maxY],
  [minX, minY],
];
const featureOf = (...rings: number[][][]) => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'MultiPolygon', coordinates: [rings] },
});
const collection = (...features: unknown[]) =>
  HttpResponse.json({ type: 'FeatureCollection', features });
const containing = featureOf(ring(0, 0, 10, 10));
const nearbyOnly = featureOf(ring(6, 6, 10, 10));

// typename별로 응답을 달리 준다.
const respondBy = (byTypename: Record<string, () => Response>) =>
  server.use(
    http.get(WFS_URL, ({ request }) => {
      const typename = new URL(request.url).searchParams.get('TYPENAME') ?? '';
      return (byTypename[typename] ?? (() => collection()))();
    }),
  );

describe('findZonesAtPoint', () => {
  it('클릭 지점 주변 작은 BBOX(경도,위도 순)로 typename마다 요청한다', async () => {
    const seen: URLSearchParams[] = [];
    server.use(
      http.get(WFS_URL, ({ request }) => {
        seen.push(new URL(request.url).searchParams);
        return collection();
      }),
    );

    await findZonesAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc']);

    expect(seen.map((params) => params.get('TYPENAME')).sort()).toEqual([
      'lt_c_aisctrc',
      'lt_c_aisprhc',
    ]);
    expect(seen[0].get('BBOX')).toBe('4.9999,4.9999,5.0001,5.0001');
    expect(seen[0].get('SRSNAME')).toBe('EPSG:4326');
    expect(seen[0].get('OUTPUT')).toBe('application/json');
  });

  it('클릭 지점을 포함하는 구역의 한글 종류 라벨을 반환한다', async () => {
    respondBy({ lt_c_aisctrc: () => collection(containing) });

    expect(await findZonesAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).toEqual({
      zones: ['관제권'],
      hasFailure: false,
    });
  });

  it('BBOX에 걸렸어도 지점을 포함하지 않으면 제외한다', async () => {
    respondBy({ lt_c_aisprhc: () => collection(nearbyOnly) });

    expect((await findZonesAtPoint(POINT, ['lt_c_aisprhc'])).zones).toEqual([]);
  });

  it('홀 안의 지점은 해당 구역이 아니다', async () => {
    respondBy({
      lt_c_wgisnpgug: () => collection(featureOf(ring(0, 0, 10, 10), ring(4, 4, 6, 6))),
    });

    expect((await findZonesAtPoint(POINT, ['lt_c_wgisnpgug'])).zones).toEqual([]);
  });

  it('여러 구역에 겹치면 모두 반환하고, 입력 순서(우선순위)대로 정렬한다', async () => {
    respondBy({
      lt_c_aisprhc: () => collection(containing),
      lt_c_aisctrc: () => collection(containing),
    });

    // 응답 도착 순서에 상관없이 앞선 typename이 먼저다.
    expect((await findZonesAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).zones).toEqual([
      '비행금지구역',
      '관제권',
    ]);
  });

  it('typename이 비어 있으면 요청 없이 빈 목록을 반환한다', async () => {
    expect(await findZonesAtPoint(POINT, [])).toEqual({ zones: [], hasFailure: false });
  });

  it('일부 요청이 실패해도 찾은 구역은 반환하되 실패했음을 알린다 (겹친 구역이 빠졌을 수 있다)', async () => {
    respondBy({
      lt_c_aisprhc: () => HttpResponse.error(),
      lt_c_aisctrc: () => collection(containing),
    });

    expect(await findZonesAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).toEqual({
      zones: ['관제권'],
      hasFailure: true,
    });
  });

  it('구역이 없고 일부가 실패했으면 빈 땅으로 오해하지 않도록 오류를 던진다', async () => {
    respondBy({ lt_c_aisprhc: () => HttpResponse.error() });

    await expect(findZonesAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).rejects.toThrow();
  });

  it('VWorld 오류 응답(HTTP 200 + 예외 XML)도 실패로 취급한다', async () => {
    respondBy({
      lt_c_aisprhc: () =>
        HttpResponse.text('<ServiceExceptionReport>INVALID_KEY</ServiceExceptionReport>'),
    });

    await expect(findZonesAtPoint(POINT, ['lt_c_aisprhc'])).rejects.toThrow();
  });

  describe('진행 알림 (최상위 구역을 먼저 보여 주기)', () => {
    it('구역이 확정될 때마다 지금까지의 목록으로 알린다', async () => {
      respondBy({
        lt_c_aisprhc: () => collection(containing),
        lt_c_aisctrc: () => collection(containing),
      });
      const progress: string[][] = [];

      await findZonesAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'], {
        onProgress: (zones) => progress.push(zones),
      });

      expect(progress).toEqual([['비행금지구역'], ['비행금지구역', '관제권']]);
    });

    it('최상위 구역은 낮은 우선순위의 느린 응답을 기다리지 않고 먼저 알린다', async () => {
      let resolveSlow: () => void = () => {};
      const slowGate = new Promise<void>((resolve) => {
        resolveSlow = resolve;
      });
      server.use(
        http.get(WFS_URL, async ({ request }) => {
          const typename = new URL(request.url).searchParams.get('TYPENAME');
          if (typename === 'lt_c_aisprhc') {
            return collection(containing);
          }
          await slowGate;
          return collection(containing);
        }),
      );
      const progress: string[][] = [];
      const pending = findZonesAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'], {
        onProgress: (zones) => progress.push(zones),
      });

      await waitFor(() => expect(progress).toEqual([['비행금지구역']]));
      resolveSlow();

      expect((await pending).zones).toEqual(['비행금지구역', '관제권']);
    });

    it('낮은 우선순위가 먼저 도착해도 높은 우선순위 응답이 끝나기 전에는 알리지 않는다', async () => {
      server.use(
        http.get(WFS_URL, async ({ request }) => {
          const typename = new URL(request.url).searchParams.get('TYPENAME');
          if (typename === 'lt_c_aisprhc') {
            await delay(60);
          }
          return collection(containing);
        }),
      );
      const progress: string[][] = [];

      await findZonesAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'], {
        onProgress: (zones) => progress.push(zones),
      });

      // 첫 알림이 관제권 단독이면 우선순위가 뒤집힌 것이다.
      expect(progress[0]).toEqual(['비행금지구역']);
    });
  });

  describe('취소', () => {
    it('바깥에서 취소(AbortSignal)하면 진행 중인 요청을 끊고 오류로 끝난다', async () => {
      server.use(
        http.get(WFS_URL, async () => {
          await delay('infinite');
          return collection();
        }),
      );
      const controller = new AbortController();

      const pending = findZonesAtPoint(POINT, ['lt_c_aisprhc'], { signal: controller.signal });
      controller.abort();

      await expect(pending).rejects.toThrow();
    });
  });
});
