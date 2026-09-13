import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { installKakaoMapsMock, uninstallKakaoMapsMock } from '@/test/mocks/kakaoMaps';

import { multiPolygonToKakaoPaths } from './multiPolygonToKakaoPaths';

describe('multiPolygonToKakaoPaths', () => {
  beforeEach(() => {
    installKakaoMapsMock();
  });

  afterEach(() => {
    uninstallKakaoMapsMock();
  });

  it('폴리곤 1개(홀 없음)를 LatLng[][] 1개로 변환한다', () => {
    const coordinates = [
      [
        [
          [127.0, 37.0],
          [127.1, 37.0],
          [127.1, 37.1],
          [127.0, 37.0],
        ],
      ],
    ];

    const result = multiPolygonToKakaoPaths(coordinates);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].map((p) => [p.getLat(), p.getLng()])).toEqual([
      [37.0, 127.0],
      [37.0, 127.1],
      [37.1, 127.1],
      [37.0, 127.0],
    ]);
  });

  it('폴리곤에 홀이 있으면 외곽 ring 이후에 홀 ring들도 포함한다', () => {
    const coordinates = [
      [
        [
          [127.0, 37.0],
          [127.2, 37.0],
          [127.2, 37.2],
          [127.0, 37.0],
        ],
        [
          [127.05, 37.05],
          [127.1, 37.05],
          [127.1, 37.1],
          [127.05, 37.05],
        ],
      ],
    ];

    const result = multiPolygonToKakaoPaths(coordinates);

    expect(result[0]).toHaveLength(2);
    expect(result[0][1].map((p) => [p.getLat(), p.getLng()])).toEqual([
      [37.05, 127.05],
      [37.05, 127.1],
      [37.1, 127.1],
      [37.05, 127.05],
    ]);
  });

  it('폴리곤이 여러 개(MultiPolygon)면 결과 배열도 폴리곤 개수만큼 나온다', () => {
    const coordinates = [
      [
        [
          [127.0, 37.0],
          [127.1, 37.0],
          [127.1, 37.1],
          [127.0, 37.0],
        ],
      ],
      [
        [
          [128.0, 38.0],
          [128.1, 38.0],
          [128.1, 38.1],
          [128.0, 38.0],
        ],
      ],
    ];

    const result = multiPolygonToKakaoPaths(coordinates);

    expect(result).toHaveLength(2);
  });

  it('빈 좌표 배열이면 빈 배열을 반환한다', () => {
    expect(multiPolygonToKakaoPaths([])).toEqual([]);
  });
});
