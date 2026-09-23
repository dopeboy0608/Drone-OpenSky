import { describe, expect, it } from 'vitest';

import { tagFeatureZoneType } from '@/features/airspace/utils/tagFeatureZoneType';
import type { VWorldFeature } from '@/features/airspace/types';

const makeFeature = (properties: Record<string, unknown> = {}): VWorldFeature => ({
  type: 'Feature',
  geometry: { type: 'MultiPolygon', coordinates: [] },
  properties,
});

describe('tagFeatureZoneType', () => {
  it('주어진 typename의 한글 구역 종류 라벨을 모든 feature에 주입한다', () => {
    const features = [makeFeature({ a: 1 }), makeFeature({ b: 2 })];

    const tagged = tagFeatureZoneType(features, 'lt_c_aisdngc');

    expect(tagged).toEqual([
      { ...features[0], zoneType: '위험구역' },
      { ...features[1], zoneType: '위험구역' },
    ]);
  });

  it('빈 feature 배열이면 빈 배열을 반환한다', () => {
    expect(tagFeatureZoneType([], 'lt_c_aisprhc')).toEqual([]);
  });

  it('매핑에 없는 typename이면 에러를 던진다', () => {
    expect(() => tagFeatureZoneType([makeFeature()], 'lt_c_unknown')).toThrow();
  });
});
