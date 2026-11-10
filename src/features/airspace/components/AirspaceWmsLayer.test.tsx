import { act, cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AirspaceWmsLayer } from '@/features/airspace/components/AirspaceWmsLayer';

import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';
import {
  createInitialVisibility,
  useAirspaceFilterStore,
} from '@/features/airspace/store/airspaceFilterStore';
import {
  installKakaoMapsMock,
  kakaoTilesetMock,
  uninstallKakaoMapsMock,
} from '@/test/mocks/kakaoMaps';

const mockMap = { addOverlayMapTypeId: vi.fn(), removeOverlayMapTypeId: vi.fn() };

vi.mock('react-kakao-maps-sdk', () => ({ useMap: () => mockMap }));

describe('AirspaceWmsLayer', () => {
  beforeEach(() => {
    installKakaoMapsMock();
    useAirspaceFilterStore.setState({ visibility: createInitialVisibility() });
    mockMap.addOverlayMapTypeId.mockClear();
    mockMap.removeOverlayMapTypeId.mockClear();
  });

  afterEach(() => {
    cleanup();
    uninstallKakaoMapsMock();
  });

  it('마운트하면 타일셋을 등록하고 지도에 오버레이로 추가한다', () => {
    render(<AirspaceWmsLayer />);

    expect(kakaoTilesetMock.registered.has('AIRSPACE_WMS')).toBe(true);
    expect(mockMap.addOverlayMapTypeId).toHaveBeenCalledWith('AIRSPACE_WMS');
  });

  it('언마운트하면 오버레이를 제거한다', () => {
    const { unmount } = render(<AirspaceWmsLayer />);

    unmount();

    expect(mockMap.removeOverlayMapTypeId).toHaveBeenCalledWith('AIRSPACE_WMS');
  });

  it('StrictMode 재마운트에도 Tileset.add를 한 번만 호출한다', () => {
    expect(() =>
      render(
        <StrictMode>
          <AirspaceWmsLayer />
        </StrictMode>,
      ),
    ).not.toThrow();

    expect(kakaoTilesetMock.registered.size).toBe(1);
  });

  it('언마운트 후 다시 마운트해도 오류 없이 오버레이를 다시 켠다', () => {
    render(<AirspaceWmsLayer />).unmount();
    mockMap.addOverlayMapTypeId.mockClear();

    expect(() => render(<AirspaceWmsLayer />)).not.toThrow();
    expect(mockMap.addOverlayMapTypeId).toHaveBeenCalledWith('AIRSPACE_WMS');
  });

  it('타일 URL 함수는 12종 typename 전부를 LAYERS로 요청한다', () => {
    render(<AirspaceWmsLayer />);
    const tileset = kakaoTilesetMock.registered.get('AIRSPACE_WMS') as {
      options: { urlFunc: (x: number, y: number, z: number) => string; errorTileUrl: string };
    };

    const url = new URL(tileset.options.urlFunc(1, 1, 3));

    expect(url.searchParams.get('LAYERS')).toBe(Object.keys(TYPENAME_ZONE_LABELS).join(','));
    expect(tileset.options.errorTileUrl).toMatch(/^data:image\/gif/);
  });

  describe('범례 필터 반영 (이슈 #73)', () => {
    const getUrlFunc = () =>
      (
        kakaoTilesetMock.registered.get('AIRSPACE_WMS') as {
          options: { urlFunc: (x: number, y: number, z: number) => string; errorTileUrl: string };
        }
      ).options;

    it('꺼진 typename은 LAYERS와 STYLES에서 빠진다', () => {
      render(<AirspaceWmsLayer />);

      act(() => useAirspaceFilterStore.getState().toggleZone('lt_c_aisprhc'));
      const url = new URL(getUrlFunc().urlFunc(1, 1, 3));

      expect(url.searchParams.get('LAYERS')).not.toContain('lt_c_aisprhc');
      expect(url.searchParams.get('LAYERS')).toContain('lt_c_aisctrc');
      expect(url.searchParams.get('STYLES')).toBe(url.searchParams.get('LAYERS'));
    });

    it('필터가 바뀌면 오버레이를 뗐다 다시 붙여 타일을 새로 받는다', () => {
      render(<AirspaceWmsLayer />);
      mockMap.addOverlayMapTypeId.mockClear();
      mockMap.removeOverlayMapTypeId.mockClear();

      act(() => useAirspaceFilterStore.getState().toggleZone('lt_c_aisprhc'));

      expect(mockMap.removeOverlayMapTypeId).toHaveBeenCalledWith('AIRSPACE_WMS');
      expect(mockMap.addOverlayMapTypeId).toHaveBeenCalledWith('AIRSPACE_WMS');
    });

    it('모두 꺼지면 빈 LAYERS를 요청하지 않도록 오버레이를 붙이지 않는다', () => {
      render(<AirspaceWmsLayer />);
      mockMap.addOverlayMapTypeId.mockClear();

      act(() => useAirspaceFilterStore.getState().setAllZones(false));

      expect(mockMap.removeOverlayMapTypeId).toHaveBeenCalledWith('AIRSPACE_WMS');
      expect(mockMap.addOverlayMapTypeId).not.toHaveBeenCalled();
    });

    it('전부 꺼진 순간 이미 나간 타일 요청에는 투명 타일을 돌려준다', () => {
      render(<AirspaceWmsLayer />);
      act(() => useAirspaceFilterStore.getState().setAllZones(false));
      const { urlFunc, errorTileUrl } = getUrlFunc();

      expect(urlFunc(1, 1, 3)).toBe(errorTileUrl);
    });

    it('다시 하나라도 켜면 오버레이를 붙인다', () => {
      render(<AirspaceWmsLayer />);
      act(() => useAirspaceFilterStore.getState().setAllZones(false));
      mockMap.addOverlayMapTypeId.mockClear();

      act(() => useAirspaceFilterStore.getState().toggleZone('lt_c_aisuac'));

      expect(mockMap.addOverlayMapTypeId).toHaveBeenCalledWith('AIRSPACE_WMS');
    });
  });
});
