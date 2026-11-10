import { describe, expect, it } from 'vitest';

import { isPointInMultiPolygon } from '@/features/airspace/utils/isPointInMultiPolygon';

// GeoJSON 순서: [lng, lat]
const square = (minX: number, minY: number, maxX: number, maxY: number) => [
  [minX, minY],
  [maxX, minY],
  [maxX, maxY],
  [minX, maxY],
  [minX, minY],
];

describe('isPointInMultiPolygon', () => {
  it('폴리곤 안의 점이면 true', () => {
    expect(isPointInMultiPolygon({ lat: 5, lng: 5 }, [[square(0, 0, 10, 10)]])).toBe(true);
  });

  it('폴리곤 밖의 점이면 false', () => {
    expect(isPointInMultiPolygon({ lat: 15, lng: 5 }, [[square(0, 0, 10, 10)]])).toBe(false);
  });

  it('홀(두 번째 ring) 안의 점이면 false (국립공원 내부 제외)', () => {
    const polygonWithHole = [square(0, 0, 10, 10), square(4, 4, 6, 6)];

    expect(isPointInMultiPolygon({ lat: 5, lng: 5 }, [polygonWithHole])).toBe(false);
    expect(isPointInMultiPolygon({ lat: 2, lng: 2 }, [polygonWithHole])).toBe(true);
  });

  it('여러 멤버 중 하나라도 포함하면 true', () => {
    const members = [[square(0, 0, 10, 10)], [square(20, 20, 30, 30)]];

    expect(isPointInMultiPolygon({ lat: 25, lng: 25 }, members)).toBe(true);
    expect(isPointInMultiPolygon({ lat: 15, lng: 15 }, members)).toBe(false);
  });

  it('위도·경도를 바꿔 넣지 않는다 (lng=x, lat=y)', () => {
    const wide = [[square(0, 0, 10, 2)]];

    expect(isPointInMultiPolygon({ lat: 1, lng: 8 }, wide)).toBe(true);
    expect(isPointInMultiPolygon({ lat: 8, lng: 1 }, wide)).toBe(false);
  });

  it('빈 좌표면 false', () => {
    expect(isPointInMultiPolygon({ lat: 1, lng: 1 }, [])).toBe(false);
    expect(isPointInMultiPolygon({ lat: 1, lng: 1 }, [[]])).toBe(false);
  });
});
