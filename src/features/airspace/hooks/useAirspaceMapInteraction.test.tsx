import { act, renderHook } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { useAirspaceMapInteraction } from '@/features/airspace/hooks/useAirspaceMapInteraction';
import { server } from '@/test/mocks/server';

import { createInitialVisibility } from '@/features/airspace/store/airspaceFilterStore';
import type { AirspaceRenderMode } from '@/features/airspace/store/airspaceRenderModeStore';

const WFS_URL = 'https://server-eosin-five-92.vercel.app/api/vworld-api/wfs';

const wrapper = ({ children }: { children: ReactNode }) => <AntdApp>{children}</AntdApp>;
const setup = (renderMode: AirspaceRenderMode, visibility = createInitialVisibility()) =>
  renderHook(
    (props: { renderMode: AirspaceRenderMode; visibility: Record<string, boolean> }) =>
      useAirspaceMapInteraction(props),
    { initialProps: { renderMode, visibility }, wrapper },
  );

describe('useAirspaceMapInteraction', () => {
  it('폴리곤 모드에서는 범례에서 켜진 구역 종류(한글 라벨)를 보여 준다', () => {
    const visibility = { ...createInitialVisibility() };
    for (const typename of Object.keys(visibility)) {
      visibility[typename] = typename === 'lt_c_aisprhc' || typename === 'lt_c_aisctrc';
    }

    const { result } = setup('polygon', visibility);

    expect(result.current.visibleZoneTypes).toEqual(new Set(['비행금지구역', '관제권']));
  });

  // 폴리곤을 언마운트하지 않고 가시성 전환으로 숨겨 복귀 비용을 피한다(#47).
  it('WMS 모드에서는 보이는 폴리곤이 없고, 렌더가 바뀌어도 같은 빈 Set 참조를 돌려준다', () => {
    const { result, rerender } = setup('wms');
    const first = result.current.visibleZoneTypes;

    rerender({ renderMode: 'wms', visibility: createInitialVisibility() });

    expect(first.size).toBe(0);
    expect(result.current.visibleZoneTypes).toBe(first);
  });

  it('모드를 바꾸면 열려 있던 안내를 닫는다', () => {
    const { result, rerender } = setup('polygon');
    act(() =>
      result.current.selectZone({ position: { lat: 1, lng: 1 }, zoneType: '비행금지구역' }),
    );
    expect(result.current.selectedZone).not.toBeNull();

    rerender({ renderMode: 'wms', visibility: createInitialVisibility() });

    expect(result.current.selectedZone).toBeNull();
  });

  it('범례에서 해당 종류를 끄면 열려 있던 안내를 닫는다 (모드와 무관하게 범례 기준)', () => {
    const { result, rerender } = setup('wms');
    act(() =>
      result.current.selectZone({ position: { lat: 1, lng: 1 }, zoneType: '비행금지구역' }),
    );
    expect(result.current.selectedZone).not.toBeNull();

    rerender({
      renderMode: 'wms',
      visibility: { ...createInitialVisibility(), lt_c_aisprhc: false },
    });

    expect(result.current.selectedZone).toBeNull();
  });

  it('지도 클릭은 WMS 모드에서만 구역을 조회한다', async () => {
    let requests = 0;
    server.use(
      http.get(WFS_URL, () => {
        requests += 1;
        return HttpResponse.json({ type: 'FeatureCollection', features: [] });
      }),
    );
    const polygon = setup('polygon');
    const wms = setup('wms');

    await act(() => polygon.result.current.handleWmsMapClick({ lat: 5, lng: 5 }));
    expect(requests).toBe(0);

    await act(() => wms.result.current.handleWmsMapClick({ lat: 5, lng: 5 }));
    expect(requests).toBeGreaterThan(0);
  });
});
