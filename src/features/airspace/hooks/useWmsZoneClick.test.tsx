import { act, cleanup, renderHook, screen, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import { delay, http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWmsZoneClick } from '@/features/airspace/hooks/useWmsZoneClick';
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
      useWmsZoneClick({
        enabled: options.enabled ?? true,
        typenames: options.typenames ?? ['lt_c_aisprhc'],
        selectZone,
        clearZone,
      }),
    { wrapper },
  );
  return { ...hook, selectZone, clearZone };
};

describe('useWmsZoneClick', () => {
  it('구역 위를 클릭하면 클릭 좌표와 구역 종류로 안내를 연다', async () => {
    server.use(http.get(WFS_URL, hit));
    const { result, selectZone } = setup();

    await act(() => result.current.onMapClick(POINT));

    expect(selectZone).toHaveBeenCalledWith({ position: POINT, zoneType: '비행금지구역' });
  });

  it('구역이 없는 곳을 클릭하면 열려 있던 안내를 닫는다', async () => {
    server.use(http.get(WFS_URL, miss));
    const { result, selectZone, clearZone } = setup();

    await act(() => result.current.onMapClick(POINT));

    expect(clearZone).toHaveBeenCalled();
    expect(selectZone).not.toHaveBeenCalled();
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

    await waitFor(() => expect(clearZone).toHaveBeenCalled());
    expect(selectZone).not.toHaveBeenCalled();
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
describe('useWmsZoneClick 조회 중 비활성화', () => {
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
        useWmsZoneClick({ enabled, typenames: ['lt_c_aisprhc'], selectZone, clearZone }),
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

    expect(selectZone).toHaveBeenCalledWith({ position: POINT, zoneType: '비행금지구역' });
  });
});
