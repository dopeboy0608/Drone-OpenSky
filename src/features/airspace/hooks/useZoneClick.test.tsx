import { act, cleanup, renderHook, screen, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import { delay, http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useZoneClick } from '@/features/airspace/hooks/useZoneClick';
import { server } from '@/test/mocks/server';

const WFS_URL = 'https://server-eosin-five-92.vercel.app/api/vworld-api/wfs';
const POINT = { lat: 5, lng: 5 };
const square = [
  [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
  ],
];
const hit = () =>
  HttpResponse.json({
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: square } },
    ],
  });
const miss = () => HttpResponse.json({ type: 'FeatureCollection', features: [] });

const setup = (options: { enabled?: boolean; typenames?: string[] } = {}) => {
  const selectZone = vi.fn();
  const clearZone = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => <AntdApp>{children}</AntdApp>;
  const hook = renderHook(
    () =>
      useZoneClick({
        enabled: options.enabled ?? true,
        typenames: options.typenames ?? ['lt_c_aisprhc'],
        selectZone,
        clearZone,
      }),
    { wrapper },
  );
  return { ...hook, selectZone, clearZone };
};

describe('useZoneClick', () => {
  it('구역 위를 클릭하면 클릭 좌표와 구역 종류로 안내를 연다', async () => {
    server.use(http.get(WFS_URL, hit));
    const { result, selectZone } = setup();

    await act(() => result.current.onMapClick(POINT));

    expect(selectZone).toHaveBeenLastCalledWith({
      position: POINT,
      zoneType: '비행금지구역',
      overlap: { zoneTypes: [], isComplete: true, hasFailure: false },
    });
  });

  it('구역이 없는 곳을 클릭하면 "구역 없음" 안내를 연다 (닫기만 하면 클릭이 무시된 것처럼 보인다, #27)', async () => {
    server.use(http.get(WFS_URL, miss));
    const { result, selectZone, clearZone } = setup();

    await act(() => result.current.onMapClick(POINT));

    expect(selectZone).toHaveBeenCalledWith({ position: POINT, zoneType: null });
    expect(clearZone).not.toHaveBeenCalled();
  });

  it('WMS 모드가 아니면(enabled=false) 아무것도 하지 않는다', async () => {
    let requests = 0;
    server.use(
      http.get(WFS_URL, () => {
        requests += 1;
        return miss();
      }),
    );
    const { result, selectZone, clearZone } = setup({ enabled: false });

    await act(() => result.current.onMapClick(POINT));

    expect(requests).toBe(0);
    expect(selectZone).not.toHaveBeenCalled();
    expect(clearZone).not.toHaveBeenCalled();
  });

  it('켜진 typename이 없으면 요청 없이 안내를 닫는다', async () => {
    let requests = 0;
    server.use(
      http.get(WFS_URL, () => {
        requests += 1;
        return miss();
      }),
    );
    const { result, clearZone } = setup({ typenames: [] });

    await act(() => result.current.onMapClick(POINT));

    expect(requests).toBe(0);
    expect(clearZone).toHaveBeenCalled();
  });

  it('조회가 실패하면 토스트로 알리고 안내를 열지도 닫지도 않는다', async () => {
    server.use(http.get(WFS_URL, () => HttpResponse.error()));
    const { result, selectZone, clearZone } = setup();

    await act(() => result.current.onMapClick(POINT));

    expect(await screen.findByText('구역 정보를 불러오지 못했습니다.')).toBeDefined();
    expect(selectZone).not.toHaveBeenCalled();
    expect(clearZone).not.toHaveBeenCalled();
  });

  it('연속 클릭하면 이전 클릭의 결과는 무시하고 마지막 클릭 결과만 반영한다', async () => {
    server.use(
      http.get(WFS_URL, async ({ request }) => {
        // 첫 번째 클릭(경도 1)은 느린 적중, 두 번째 클릭(경도 2)은 빠른 미적중으로 구분한다.
        const isFirstClick = new URL(request.url).searchParams.get('BBOX')?.startsWith('0.9999');
        if (isFirstClick) {
          await delay(80);
          return hit();
        }
        return miss();
      }),
    );
    const { result, selectZone, clearZone } = setup();

    await act(async () => {
      const first = result.current.onMapClick({ lat: 1, lng: 1 });
      const second = result.current.onMapClick({ lat: 2, lng: 2 });
      await Promise.all([first, second]);
    });

    await waitFor(() =>
      expect(selectZone).toHaveBeenCalledWith({ position: { lat: 2, lng: 2 }, zoneType: null }),
    );
    expect(selectZone).toHaveBeenCalledTimes(1);
    expect(clearZone).not.toHaveBeenCalled();
  });

  describe('조회 중 표시 (pendingPosition)', () => {
    it('처음에는 없고, 클릭하는 즉시 클릭 좌표가 잡힌다', async () => {
      server.use(
        http.get(WFS_URL, async () => {
          await delay(60);
          return hit();
        }),
      );
      const { result } = setup();
      expect(result.current.pendingPosition).toBeNull();

      let click: Promise<void> = Promise.resolve();
      act(() => {
        click = result.current.onMapClick(POINT);
      });

      expect(result.current.pendingPosition).toEqual(POINT);
      await act(() => click);
    });

    it('조회가 끝나면 사라진다 (적중·미적중·오류 모두)', async () => {
      const { result } = setup();

      server.use(http.get(WFS_URL, hit));
      await act(() => result.current.onMapClick(POINT));
      expect(result.current.pendingPosition).toBeNull();

      server.use(http.get(WFS_URL, miss));
      await act(() => result.current.onMapClick(POINT));
      expect(result.current.pendingPosition).toBeNull();

      server.use(http.get(WFS_URL, () => HttpResponse.error()));
      await act(() => result.current.onMapClick(POINT));
      expect(result.current.pendingPosition).toBeNull();
    });

    it('요청이 필요 없는 경우(비활성, 켜진 typename 없음)에는 표시하지 않는다', async () => {
      const disabled = setup({ enabled: false });
      await act(() => disabled.result.current.onMapClick(POINT));
      expect(disabled.result.current.pendingPosition).toBeNull();

      const empty = setup({ typenames: [] });
      await act(() => empty.result.current.onMapClick(POINT));
      expect(empty.result.current.pendingPosition).toBeNull();
    });

    it('연속 클릭하면 이전 클릭의 표시는 없어지고 마지막 클릭 좌표만 남는다', async () => {
      server.use(
        http.get(WFS_URL, async () => {
          await delay(60);
          return miss();
        }),
      );
      const { result } = setup();

      let first: Promise<void> = Promise.resolve();
      let second: Promise<void> = Promise.resolve();
      act(() => {
        first = result.current.onMapClick({ lat: 1, lng: 1 });
        second = result.current.onMapClick({ lat: 2, lng: 2 });
      });

      expect(result.current.pendingPosition).toEqual({ lat: 2, lng: 2 });
      await act(() => Promise.all([first, second]));
      expect(result.current.pendingPosition).toBeNull();
    });
  });
});

// 이슈 #94: 클릭 조회 중에 모드를 바꾸면(enabled=false) 이미 나간 조회의 결과가 뒤늦게 반영되던 문제.
describe('useZoneClick 조회 중 비활성화', () => {
  // 이 파일은 테스트 사이에 DOM을 정리하지 않아 앞선 테스트의 토스트가 남는다. 토스트 부재를 검증하려면 격리가 필요하다.
  afterEach(cleanup);

  const slowHit = () =>
    server.use(
      http.get(WFS_URL, async () => {
        await delay(60);
        return hit();
      }),
    );
  const setupToggle = () => {
    const selectZone = vi.fn();
    const clearZone = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => <AntdApp>{children}</AntdApp>;
    const hook = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useZoneClick({ enabled, typenames: ['lt_c_aisprhc'], selectZone, clearZone }),
      { initialProps: { enabled: true }, wrapper },
    );
    return { ...hook, selectZone, clearZone };
  };

  it('조회 중에 비활성이 되면 뒤늦게 도착한 결과로 안내를 열지 않는다', async () => {
    slowHit();
    const { result, rerender, selectZone, clearZone } = setupToggle();
    let click: Promise<void> = Promise.resolve();
    act(() => {
      click = result.current.onMapClick(POINT);
    });

    rerender({ enabled: false });
    await act(() => click);

    expect(selectZone).not.toHaveBeenCalled();
    expect(clearZone).not.toHaveBeenCalled();
  });

  it('조회 중에 비활성이 되면 조회 중 표시를 바로 지운다', async () => {
    slowHit();
    const { result, rerender } = setupToggle();
    let click: Promise<void> = Promise.resolve();
    act(() => {
      click = result.current.onMapClick(POINT);
    });
    expect(result.current.pendingPosition).toEqual(POINT);

    rerender({ enabled: false });

    expect(result.current.pendingPosition).toBeNull();
    await act(() => click);
    expect(result.current.pendingPosition).toBeNull();
  });

  it('비활성이 되어 끊긴 조회는 오류 토스트를 띄우지 않는다', async () => {
    slowHit();
    const { result, rerender } = setupToggle();
    let click: Promise<void> = Promise.resolve();
    act(() => {
      click = result.current.onMapClick(POINT);
    });

    rerender({ enabled: false });
    await act(() => click);

    expect(screen.queryByText('구역 정보를 불러오지 못했습니다.')).toBeNull();
  });

  it('다시 활성화한 뒤의 새 클릭은 정상적으로 안내를 연다', async () => {
    server.use(http.get(WFS_URL, hit));
    const { result, rerender, selectZone } = setupToggle();
    rerender({ enabled: false });
    rerender({ enabled: true });

    await act(() => result.current.onMapClick(POINT));

    expect(selectZone).toHaveBeenLastCalledWith({
      position: POINT,
      zoneType: '비행금지구역',
      overlap: { zoneTypes: [], isComplete: true, hasFailure: false },
    });
  });
});

// #27: 두 표시 방식이 같은 조회를 쓰므로, enabled 대신 resetKey(표시 방식)가 바뀔 때 진행 중인 조회를 끊는다.
describe('useZoneClick resetKey', () => {
  afterEach(cleanup);

  it('resetKey가 바뀌면 진행 중이던 조회 결과로 안내를 열지 않고 조회 중 표시를 지운다', async () => {
    server.use(
      http.get(WFS_URL, async () => {
        await delay(60);
        return hit();
      }),
    );
    const selectZone = vi.fn();
    const clearZone = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => <AntdApp>{children}</AntdApp>;
    const { result, rerender } = renderHook(
      ({ mode }: { mode: string }) =>
        useZoneClick({
          enabled: true,
          resetKey: mode,
          typenames: ['lt_c_aisprhc'],
          selectZone,
          clearZone,
        }),
      { initialProps: { mode: 'wms' }, wrapper },
    );
    let click: Promise<void> = Promise.resolve();
    act(() => {
      click = result.current.onMapClick(POINT);
    });
    expect(result.current.pendingPosition).toEqual(POINT);

    rerender({ mode: 'polygon' });
    await act(() => click);

    expect(selectZone).not.toHaveBeenCalled();
    expect(result.current.pendingPosition).toBeNull();
  });
});

describe('useZoneClick 겹침과 중복 클릭 (#27)', () => {
  afterEach(cleanup);

  const setupTwoTypenames = () => {
    const selectZone = vi.fn();
    const clearZone = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => <AntdApp>{children}</AntdApp>;
    const hook = renderHook(
      () =>
        useZoneClick({
          enabled: true,
          typenames: ['lt_c_aisprhc', 'lt_c_aisctrc'],
          selectZone,
          clearZone,
        }),
      { wrapper },
    );
    return { ...hook, selectZone };
  };

  it('최상위 구역을 먼저 열고, 겹친 구역은 확인이 끝난 뒤 채운다', async () => {
    server.use(http.get(WFS_URL, hit));
    const { result, selectZone } = setupTwoTypenames();

    await act(() => result.current.onMapClick(POINT));

    expect(selectZone.mock.calls.map(([zone]) => zone)).toEqual([
      {
        position: POINT,
        zoneType: '비행금지구역',
        overlap: { zoneTypes: [], isComplete: false, hasFailure: false },
      },
      {
        position: POINT,
        zoneType: '비행금지구역',
        overlap: { zoneTypes: ['관제권'], isComplete: false, hasFailure: false },
      },
      {
        position: POINT,
        zoneType: '비행금지구역',
        overlap: { zoneTypes: ['관제권'], isComplete: true, hasFailure: false },
      },
    ]);
  });

  it('같은 지점의 연속 호출(폴리곤 클릭 + 지도 클릭)은 한 번만 조회한다', async () => {
    let requests = 0;
    server.use(
      http.get(WFS_URL, () => {
        requests += 1;
        return miss();
      }),
    );
    const { result } = setupTwoTypenames();

    await act(async () => {
      await Promise.all([
        result.current.onMapClick(POINT),
        result.current.onMapClick({ lat: POINT.lat + 1e-6, lng: POINT.lng }),
      ]);
    });

    expect(requests).toBe(2);
  });

  it('다른 지점의 연속 클릭은 합치지 않고 마지막 지점의 결과를 쓴다', async () => {
    server.use(http.get(WFS_URL, miss));
    const { result, selectZone } = setupTwoTypenames();
    const second = { lat: POINT.lat + 0.01, lng: POINT.lng };

    await act(async () => {
      await Promise.all([result.current.onMapClick(POINT), result.current.onMapClick(second)]);
    });

    expect(selectZone).toHaveBeenLastCalledWith({
      position: second,
      zoneType: null,
      overlap: undefined,
    });
  });
});
