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

// VWorld WMS는 LAYERS를 요청당 최대 4개까지만 받아(INVALID_RANGE) 12종을 3개 슬롯으로 나눠 겹친다.
const SLOT_NAMES = ['AIRSPACE_WMS_0', 'AIRSPACE_WMS_1', 'AIRSPACE_WMS_2'];
const ALL_TYPENAMES = Object.keys(TYPENAME_ZONE_LABELS);

type TilesetOptions = {
  urlFunc: (x: number, y: number, z: number) => string;
  errorTileUrl: string;
};

const getOptions = (name: string) =>
  (kakaoTilesetMock.registered.get(name) as { options: TilesetOptions }).options;
const getLayers = (name: string) =>
  new URL(getOptions(name).urlFunc(1, 1, 3)).searchParams.get('LAYERS')?.split(',') ?? [];
const addedNames = () => mockMap.addOverlayMapTypeId.mock.calls.map(([name]) => name);

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

  it('마운트하면 타일셋 3개를 등록하고 모두 오버레이로 추가한다', () => {
    render(<AirspaceWmsLayer />);

    expect([...kakaoTilesetMock.registered.keys()].sort()).toEqual(SLOT_NAMES);
    expect(addedNames().sort()).toEqual(SLOT_NAMES);
  });

  it('슬롯 0(비행금지 구역)이 가장 위에 오도록 마지막 슬롯부터 추가한다', () => {
    render(<AirspaceWmsLayer />);

    expect(addedNames()).toEqual([...SLOT_NAMES].reverse());
  });

  it('요청마다 LAYERS는 4개 이하이고, 슬롯을 합치면 12종 전부를 한 번씩 요청한다', () => {
    render(<AirspaceWmsLayer />);

    const perSlot = SLOT_NAMES.map(getLayers);

    expect(perSlot.every((layers) => layers.length > 0 && layers.length <= 4)).toBe(true);
    expect(perSlot.flat()).toEqual(ALL_TYPENAMES);
  });

  it('언마운트하면 추가했던 오버레이를 모두 제거한다', () => {
    const { unmount } = render(<AirspaceWmsLayer />);

    unmount();

    expect(mockMap.removeOverlayMapTypeId.mock.calls.map(([name]) => name).sort()).toEqual(
      SLOT_NAMES,
    );
  });

  it('StrictMode 재마운트에도 Tileset.add를 슬롯당 한 번만 호출한다', () => {
    expect(() =>
      render(
        <StrictMode>
          <AirspaceWmsLayer />
        </StrictMode>,
      ),
    ).not.toThrow();

    expect(kakaoTilesetMock.registered.size).toBe(3);
  });

  it('언마운트 후 다시 마운트해도 오류 없이 오버레이를 다시 켠다', () => {
    render(<AirspaceWmsLayer />).unmount();
    mockMap.addOverlayMapTypeId.mockClear();

    expect(() => render(<AirspaceWmsLayer />)).not.toThrow();
    expect(addedNames().sort()).toEqual(SLOT_NAMES);
  });

  it('에러 타일은 유효한 1px GIF data URL이다', () => {
    render(<AirspaceWmsLayer />);

    expect(getOptions('AIRSPACE_WMS_0').errorTileUrl).toMatch(/^data:image\/gif/);
  });

  describe('범례 필터 반영 (이슈 #73)', () => {
    it('꺼진 typename은 어느 슬롯의 LAYERS에도 들어가지 않고 STYLES와 같다', () => {
      render(<AirspaceWmsLayer />);

      act(() => useAirspaceFilterStore.getState().toggleZone('lt_c_aisprhc'));
      const layers = SLOT_NAMES.flatMap(getLayers);

      expect(layers).not.toContain('lt_c_aisprhc');
      expect(layers).toHaveLength(11);
      const url = new URL(getOptions('AIRSPACE_WMS_0').urlFunc(1, 1, 3));
      expect(url.searchParams.get('STYLES')).toBe(url.searchParams.get('LAYERS'));
    });

    it('켜진 typename이 줄면 남은 것을 앞 슬롯부터 4개씩 채우고 빈 슬롯은 붙이지 않는다', () => {
      render(<AirspaceWmsLayer />);
      mockMap.addOverlayMapTypeId.mockClear();

      act(() => {
        useAirspaceFilterStore.getState().setAllZones(false);
        for (const typename of ALL_TYPENAMES.slice(0, 5)) {
          useAirspaceFilterStore.getState().toggleZone(typename);
        }
      });

      expect(addedNames().sort()).toEqual(['AIRSPACE_WMS_0', 'AIRSPACE_WMS_1']);
      expect(getLayers('AIRSPACE_WMS_0')).toHaveLength(4);
      expect(getLayers('AIRSPACE_WMS_1')).toHaveLength(1);
    });

    it('필터가 바뀌면 오버레이를 뗐다 다시 붙여 타일을 새로 받는다', () => {
      render(<AirspaceWmsLayer />);
      mockMap.addOverlayMapTypeId.mockClear();
      mockMap.removeOverlayMapTypeId.mockClear();

      act(() => useAirspaceFilterStore.getState().toggleZone('lt_c_aisprhc'));

      expect(mockMap.removeOverlayMapTypeId).toHaveBeenCalledTimes(3);
      expect(mockMap.addOverlayMapTypeId).toHaveBeenCalledTimes(3);
    });

    it('모두 꺼지면 빈 LAYERS를 요청하지 않도록 오버레이를 붙이지 않는다', () => {
      render(<AirspaceWmsLayer />);
      mockMap.addOverlayMapTypeId.mockClear();

      act(() => useAirspaceFilterStore.getState().setAllZones(false));

      expect(mockMap.removeOverlayMapTypeId).toHaveBeenCalled();
      expect(mockMap.addOverlayMapTypeId).not.toHaveBeenCalled();
    });

    it('전부 꺼진 순간 이미 나간 타일 요청에는 투명 타일을 돌려준다', () => {
      render(<AirspaceWmsLayer />);
      act(() => useAirspaceFilterStore.getState().setAllZones(false));

      SLOT_NAMES.forEach((name) => {
        const { urlFunc, errorTileUrl } = getOptions(name);
        expect(urlFunc(1, 1, 3)).toBe(errorTileUrl);
      });
    });

    it('다시 하나라도 켜면 오버레이를 붙인다', () => {
      render(<AirspaceWmsLayer />);
      act(() => useAirspaceFilterStore.getState().setAllZones(false));
      mockMap.addOverlayMapTypeId.mockClear();

      act(() => useAirspaceFilterStore.getState().toggleZone('lt_c_aisuac'));

      expect(addedNames()).toEqual(['AIRSPACE_WMS_0']);
    });
  });
});
