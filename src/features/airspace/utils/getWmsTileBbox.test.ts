import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getWmsTileBbox } from '@/features/airspace/utils/getWmsTileBbox';
import { latLngToWebMercator } from '@/features/airspace/utils/latLngToWebMercator';
import { tileToWcongBounds } from '@/features/airspace/utils/tileToWcongBounds';

import { installKakaoMapsMock, uninstallKakaoMapsMock } from '@/test/mocks/kakaoMaps';

describe('getWmsTileBbox', () => {
  beforeEach(installKakaoMapsMock);
  afterEach(uninstallKakaoMapsMock);

  it('타일 네 모서리를 3857로 바꾼 값의 외접 사각형을 반환한다', () => {
    const wcong = tileToWcongBounds(5, 7, 4);

    const bbox = getWmsTileBbox(5, 7, 4);

    // 목의 Coords는 lat = 37 + y/1e6, lng = 127 + x/1e6 이므로 같은 식으로 기대값을 만든다.
    const corners = [
      latLngToWebMercator(37 + wcong.minY / 1e6, 127 + wcong.minX / 1e6),
      latLngToWebMercator(37 + wcong.minY / 1e6, 127 + wcong.maxX / 1e6),
      latLngToWebMercator(37 + wcong.maxY / 1e6, 127 + wcong.minX / 1e6),
      latLngToWebMercator(37 + wcong.maxY / 1e6, 127 + wcong.maxX / 1e6),
    ];
    expect(bbox.minX).toBeCloseTo(Math.min(...corners.map((c) => c.x)), 6);
    expect(bbox.maxX).toBeCloseTo(Math.max(...corners.map((c) => c.x)), 6);
    expect(bbox.minY).toBeCloseTo(Math.min(...corners.map((c) => c.y)), 6);
    expect(bbox.maxY).toBeCloseTo(Math.max(...corners.map((c) => c.y)), 6);
  });

  it('min은 max보다 작다', () => {
    const bbox = getWmsTileBbox(1, 1, 2);

    expect(bbox.minX).toBeLessThan(bbox.maxX);
    expect(bbox.minY).toBeLessThan(bbox.maxY);
  });
});
