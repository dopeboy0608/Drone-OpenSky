import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { findZoneTypeAtPoint } from '@/features/airspace/api/findZoneTypeAtPoint';
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

describe('findZoneTypeAtPoint', () => {
  it('클릭 지점 주변 작은 BBOX(경도,위도 순)로 typename마다 요청한다', async () => {
    const seen: URLSearchParams[] = [];
    server.use(
      http.get(WFS_URL, ({ request }) => {
        seen.push(new URL(request.url).searchParams);
        return collection();
      }),
    );

    await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc']);

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

    expect(await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).toBe('관제권');
  });

  it('BBOX에 걸렸어도 지점을 포함하지 않으면 제외한다', async () => {
    respondBy({ lt_c_aisprhc: () => collection(nearbyOnly) });

    expect(await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc'])).toBeNull();
  });

  it('홀 안의 지점은 해당 구역이 아니다', async () => {
    respondBy({
      lt_c_wgisnpgug: () => collection(featureOf(ring(0, 0, 10, 10), ring(4, 4, 6, 6))),
    });

    expect(await findZoneTypeAtPoint(POINT, ['lt_c_wgisnpgug'])).toBeNull();
  });

  it('여러 구역에 겹치면 typename 순서상 먼저인(위험도 높은) 구역을 반환한다', async () => {
    respondBy({
      lt_c_aisprhc: () => collection(containing),
      lt_c_aisctrc: () => collection(containing),
    });

    // 입력 순서와 응답 도착 순서에 상관없이 앞선 typename이 이긴다.
    expect(await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).toBe('비행금지구역');
  });

  it('typename이 비어 있으면 요청 없이 null을 반환한다', async () => {
    expect(await findZoneTypeAtPoint(POINT, [])).toBeNull();
  });

  it('일부 요청이 실패해도 다른 요청에서 구역이 찾아지면 그것을 반환한다', async () => {
    respondBy({
      lt_c_aisprhc: () => HttpResponse.error(),
      lt_c_aisctrc: () => collection(containing),
    });

    expect(await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).toBe('관제권');
  });

  it('구역이 없고 일부가 실패했으면 빈 땅으로 오해하지 않도록 오류를 던진다', async () => {
    respondBy({ lt_c_aisprhc: () => HttpResponse.error() });

    await expect(findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).rejects.toThrow();
  });

  it('VWorld 오류 응답(HTTP 200 + 예외 XML)도 실패로 취급한다', async () => {
    respondBy({
      lt_c_aisprhc: () =>
        HttpResponse.text('<ServiceExceptionReport>INVALID_KEY</ServiceExceptionReport>'),
    });

    await expect(findZoneTypeAtPoint(POINT, ['lt_c_aisprhc'])).rejects.toThrow();
  });

  describe('응답 대기 방식 (체감 지연 개선)', () => {
    it('우선순위가 높은 구역이 적중하면 낮은 우선순위의 느린 응답을 기다리지 않는다', async () => {
      server.use(
        http.get(WFS_URL, async ({ request }) => {
          const typename = new URL(request.url).searchParams.get('TYPENAME');
          if (typename === 'lt_c_aisprhc') {
            return collection(containing);
          }
          await delay('infinite');
          return collection();
        }),
      );

      // 낮은 우선순위 응답이 영영 오지 않아도 확정된다(기다렸다면 테스트가 시간 초과된다).
      expect(await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).toBe(
        '비행금지구역',
      );
    });

    it('낮은 우선순위가 먼저 적중해도 높은 우선순위 응답이 끝나기 전에는 확정하지 않는다', async () => {
      respondBy({
        lt_c_aisprhc: () => collection(containing),
        lt_c_aisctrc: () => collection(containing),
      });
      server.use(
        http.get(WFS_URL, async ({ request }) => {
          const typename = new URL(request.url).searchParams.get('TYPENAME');
          if (typename === 'lt_c_aisprhc') {
            await delay(60);
          }
          return collection(containing);
        }),
      );

      // 관제권이 먼저 도착해도 느린 비행금지구역이 같은 지점을 포함하면 그쪽이 이긴다.
      expect(await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).toBe(
        '비행금지구역',
      );
    });

    it('높은 우선순위가 느리게 "없음"으로 끝나면 낮은 우선순위의 적중을 반환한다', async () => {
      server.use(
        http.get(WFS_URL, async ({ request }) => {
          const typename = new URL(request.url).searchParams.get('TYPENAME');
          if (typename === 'lt_c_aisprhc') {
            await delay(60);
            return collection();
          }
          return collection(containing);
        }),
      );

      expect(await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).toBe('관제권');
    });

    it('바깥에서 취소(AbortSignal)하면 진행 중인 요청을 끊고 오류로 끝난다', async () => {
      server.use(
        http.get(WFS_URL, async () => {
          await delay('infinite');
          return collection();
        }),
      );
      const controller = new AbortController();

      const pending = findZoneTypeAtPoint(POINT, ['lt_c_aisprhc'], controller.signal);
      controller.abort();

      await expect(pending).rejects.toThrow();
    });
  });
});
