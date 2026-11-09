import { create } from 'zustand';

export type AirspaceRenderMode = 'polygon' | 'wms';

interface AirspaceRenderModeState {
  renderMode: AirspaceRenderMode;
  setRenderMode: (renderMode: AirspaceRenderMode) => void;
}

// 상태는 메모리에만 둔다(새로고침 시 폴리곤). 기본 모드는 WMS 안정화 후 이슈 #76에서 재결정한다.
export const useAirspaceRenderModeStore = create<AirspaceRenderModeState>((set) => ({
  renderMode: 'polygon',
  setRenderMode: (renderMode) => set({ renderMode }),
}));
