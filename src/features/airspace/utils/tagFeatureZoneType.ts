import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';
import type { VWorldFeature } from '@/features/airspace/types';

export const tagFeatureZoneType = (
  features: VWorldFeature[],
  typename: string,
): VWorldFeature[] => {
  const zoneType = TYPENAME_ZONE_LABELS[typename];

  if (zoneType === undefined) {
    throw new Error(`[airspace] typename에 대응하는 구역 종류 라벨이 없습니다: ${typename}`);
  }

  return features.map((feature) => ({ ...feature, zoneType }));
};
