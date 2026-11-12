import type { SelectedZone } from '@/features/airspace/types';

// 겹침 줄 문구. 확인이 끝나기 전에는 "없음"으로 단정하지 않는다.
export const formatZoneOverlap = (overlap: SelectedZone['overlap']): string | null => {
  if (overlap === undefined) {
    return null;
  }

  const list = overlap.zoneTypes.join(', ');

  if (!overlap.isComplete) {
    return list ? `겹침: ${list} (확인 중…)` : '겹침 확인 중…';
  }

  if (overlap.hasFailure) {
    return list ? `겹침: ${list} (일부 조회 실패)` : '겹침 확인 중 일부 조회에 실패했습니다.';
  }

  return list ? `겹침: ${list}` : '겹치는 구역 없음';
};
