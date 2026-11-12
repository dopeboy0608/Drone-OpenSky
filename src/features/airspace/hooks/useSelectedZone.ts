import { useCallback, useState } from 'react';

import type { SelectedZone } from '@/features/airspace/types';

// 선택 상태를 폴리곤 레이어 밖에 두는 이유: 레이어 안에 있으면 오버레이를 열고 닫을 때마다
// 레이어의 모든 폴리곤이 리렌더되어 Polygon.setPath가 반복 호출된다 (이슈 #47).
// 범례에서 해당 종류를 꺼도 닫지 않는다: 안내는 표시 여부와 무관한 조회 결과이고, 숨김 상태는 카드에 표기한다(#27).
export const useSelectedZone = () => {
  const [selectedZone, setSelectedZone] = useState<SelectedZone | null>(null);

  const clearZone = useCallback(() => setSelectedZone(null), []);

  return { selectedZone, selectZone: setSelectedZone, clearZone };
};
