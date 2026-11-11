import { useEffect, useMemo } from 'react';

import { useSelectedZone } from '@/features/airspace/hooks/useSelectedZone';
import { useWmsZoneClick } from '@/features/airspace/hooks/useWmsZoneClick';
import type { AirspaceRenderMode } from '@/features/airspace/store/airspaceRenderModeStore';
import { getVisibleTypenames } from '@/features/airspace/utils/getVisibleTypenames';
import { getVisibleZoneTypes } from '@/features/airspace/utils/getVisibleZoneTypes';

// 참조가 고정된 빈 Set. 렌더마다 새로 만들면 레이어/선택 해제 이펙트가 매번 다시 돈다.
const NO_VISIBLE_ZONE_TYPES: ReadonlySet<string> = new Set();

interface UseAirspaceMapInteractionParams {
  renderMode: AirspaceRenderMode;
  visibility: Record<string, boolean>;
}

// 범례 필터와 표시 방식에서 "무엇이 보이는가", "어떤 구역 안내가 열려 있는가", "지도 클릭을 어떻게 처리하는가"를
// 한 곳에서 정한다. 지도 화면(MapView)이 airspace의 이 세 가지 세부를 직접 조립하지 않게 하려는 것이다.
export const useAirspaceMapInteraction = ({
  renderMode,
  visibility,
}: UseAirspaceMapInteractionParams) => {
  const filteredZoneTypes = useMemo(() => getVisibleZoneTypes(visibility), [visibility]);
  const visibleTypenames = useMemo(() => getVisibleTypenames(visibility), [visibility]);
  // WMS 모드의 숨김은 언마운트가 아니라 가시성 전환으로 한다. 폴리곤 복귀 시 Polygon 재생성 비용을
  // 피하기 위함이다(#47).
  const visibleZoneTypes = renderMode === 'wms' ? NO_VISIBLE_ZONE_TYPES : filteredZoneTypes;

  // 안내 박스의 자동 닫힘 기준은 폴리곤 숨김과 분리한다. WMS 모드에서도 클릭 안내(#75)가 열려야 하므로
  // 모드와 무관하게 범례 필터 기준(꺼진 종류만 닫힘)을 쓴다.
  const { selectedZone, selectZone, clearZone } = useSelectedZone(filteredZoneTypes);
  const { onMapClick: handleWmsMapClick, pendingPosition } = useWmsZoneClick({
    enabled: renderMode === 'wms',
    typenames: visibleTypenames,
    selectZone,
    clearZone,
  });

  // 모드를 바꾸면 이전 모드에서 열린 안내는 의미가 없어 닫는다(예전에는 빈 Set 전달로 닫혔다).
  // renderMode는 값이 아니라 "바뀐 시점"을 알리는 트리거로만 쓴다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: renderMode 변경 자체가 실행 조건이다.
  useEffect(() => {
    clearZone();
  }, [renderMode, clearZone]);

  return {
    visibleZoneTypes,
    selectedZone,
    selectZone,
    clearZone,
    handleWmsMapClick,
    pendingPosition,
  };
};
