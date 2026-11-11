import { getVisibleTypenames } from '@/features/airspace/utils/getVisibleTypenames';

import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';

// 레이어는 feature.zoneType(한글 라벨)으로 필터링하고 스토어는 typename을 키로 쓰므로 여기서 변환한다.
// 켜짐·알려진 typename 판정은 getVisibleTypenames와 같아야 하므로 그 결과를 재사용한다(두 곳에서 판정이 어긋나지 않게).
export const getVisibleZoneTypes = (visibility: Record<string, boolean>): Set<string> =>
  new Set(getVisibleTypenames(visibility).map((typename) => TYPENAME_ZONE_LABELS[typename]));
