import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';

// WMS LAYERS용 typename 목록이다. 라벨이 정의된 12종만 허용해, 필터 상태에 섞인 알 수 없는 키가
// 외부 API 요청 파라미터로 그대로 나가지 않게 한다.
export const getVisibleTypenames = (visibility: Record<string, boolean>): string[] =>
  Object.entries(visibility)
    .filter(([typename, isVisible]) => isVisible && typename in TYPENAME_ZONE_LABELS)
    .map(([typename]) => typename);
