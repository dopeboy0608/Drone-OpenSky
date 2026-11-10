import { cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AirspaceWmsLayer } from '@/features/airspace/components/AirspaceWmsLayer';

import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';
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
});
