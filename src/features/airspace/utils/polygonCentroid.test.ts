import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { installKakaoMapsMock, uninstallKakaoMapsMock } from '@/test/mocks/kakaoMaps';

import { polygonCentroid } from './polygonCentroid';

describe('polygonCentroid', () => {
  beforeEach(() => {
    installKakaoMapsMock();
  });

  afterEach(() => {
    uninstallKakaoMapsMock();
  });

  it('ring을 구성하는 좌표들의 평균 좌표를 반환한다', () => {
    const ring = [
      new kakao.maps.LatLng(0, 0),
      new kakao.maps.LatLng(0, 2),
      new kakao.maps.LatLng(2, 2),
      new kakao.maps.LatLng(2, 0),
    ];

    expect(polygonCentroid(ring)).toEqual({ lat: 1, lng: 1 });
  });

  it('점이 하나뿐이면 그 점을 그대로 반환한다', () => {
    const ring = [new kakao.maps.LatLng(37.5, 127.1)];

    expect(polygonCentroid(ring)).toEqual({ lat: 37.5, lng: 127.1 });
  });
});
