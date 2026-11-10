import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

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

    await act(() => result.current(POINT));

    expect(selectZone).toHaveBeenCalledWith({ position: POINT, zoneType: '비행금지구역' });
  });

  it('구역이 없는 곳을 클릭하면 열려 있던 안내를 닫는다', async () => {
    server.use(http.get(WFS_URL, miss));
    const { result, selectZone, clearZone } = setup();

    await act(() => result.current(POINT));

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

    await act(() => result.current(POINT));

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

    await act(() => result.current(POINT));

    expect(requests).toBe(0);
    expect(clearZone).toHaveBeenCalled();
  });

  it('조회가 실패하면 토스트로 알리고 안내를 열지도 닫지도 않는다', async () => {
    server.use(http.get(WFS_URL, () => HttpResponse.error()));
    const { result, selectZone, clearZone } = setup();

    await act(() => result.current(POINT));

    expect(await screen.findByText('구역 정보를 불러오지 못했습니다.')).toBeDefined();
    expect(selectZone).not.toHaveBeenCalled();
    expect(clearZone).not.toHaveBeenCalled();
  });

  it('연속 클릭하면 늦게 도착한 이전 클릭의 응답은 무시한다', async () => {
    let call = 0;
    server.use(
      http.get(WFS_URL, async () => {
        call += 1;
        if (call === 1) {
          // 첫 번째 클릭의 응답을 일부러 늦춘다.
          await new Promise((resolve) => setTimeout(resolve, 80));
          return hit();
        }
        return miss();
      }),
    );
    const { result, selectZone, clearZone } = setup();

    await act(async () => {
      const first = result.current({ lat: 1, lng: 1 });
      const second = result.current({ lat: 2, lng: 2 });
      await Promise.all([first, second]);
    });

    await waitFor(() => expect(clearZone).toHaveBeenCalled());
    expect(selectZone).not.toHaveBeenCalled();
  });
});
