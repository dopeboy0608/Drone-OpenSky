import { create } from 'zustand';

import { AIRSPACE_ZONE_CONFIGS, TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';
import type { AirspaceZoneLevel } from '@/features/airspace/types';

interface AirspaceFilterState {
  visibility: Record<string, boolean>;
  toggleZone: (typename: string) => void;
  setAllZones: (isVisible: boolean) => void;
  setGroupZones: (level: AirspaceZoneLevel, isVisible: boolean) => void;
}

export const createInitialVisibility = (): Record<string, boolean> =>
  Object.fromEntries(Object.keys(TYPENAME_ZONE_LABELS).map((typename) => [typename, true]));

// 상태는 메모리에만 둔다(새로고침 시 전체 켜짐). 영속화는 이슈 #25 범위 밖.
export const useAirspaceFilterStore = create<AirspaceFilterState>((set) => ({
  visibility: createInitialVisibility(),
  toggleZone: (typename) =>
    set((state) => {
      // 알 수 없는 typename으로 키가 새로 생기면 이후 지도 필터가 의도치 않게 동작할 수 있어 무시한다.
      if (!(typename in state.visibility)) {
        return state;
      }
      return { visibility: { ...state.visibility, [typename]: !state.visibility[typename] } };
    }),
  setAllZones: (isVisible) =>
    set((state) => ({
      visibility: Object.fromEntries(
        Object.keys(state.visibility).map((typename) => [typename, isVisible]),
      ),
    })),
  setGroupZones: (level, isVisible) =>
    set((state) => {
      const config = AIRSPACE_ZONE_CONFIGS.find((zoneConfig) => zoneConfig.level === level);
      // 알 수 없는 level은 무시한다. 새 객체를 만들면 구독 중인 지도 필터가 불필요하게 다시 계산된다.
      if (!config) {
        return state;
      }
      return {
        visibility: {
          ...state.visibility,
          ...Object.fromEntries(config.typenames.map((typename) => [typename, isVisible])),
        },
      };
    }),
}));
