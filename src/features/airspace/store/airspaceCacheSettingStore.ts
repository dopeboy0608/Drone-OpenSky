import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const AIRSPACE_CACHE_SETTING_STORAGE_KEY = 'airspace-cache-setting';

interface AirspaceCacheSettingState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

// 기본값을 꺼짐으로 둔 이유: 신선한 캐시에서 새로고침 버튼이 요청 없이 "최신 상태입니다."만 보여
// 갱신이 안 되는 것처럼 보이던 문제(#68)가 검증될 때까지 매번 새로 받는 쪽이 안전하다.
// 새로고침 뒤에도 유지돼야 하므로(하이드레이션 여부를 시작 시점에 정한다) localStorage에 저장한다.
export const useAirspaceCacheSettingStore = create<AirspaceCacheSettingState>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: AIRSPACE_CACHE_SETTING_STORAGE_KEY,
      // 함수는 직렬화 대상이 아니라 값만 저장한다.
      partialize: ({ enabled }) => ({ enabled }),
    },
  ),
);
