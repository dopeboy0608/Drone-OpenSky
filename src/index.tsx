import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { queryClient } from './api/queryClient';
import { AIRSPACE_CACHE_ENABLED } from './features/airspace/constants';
import { hydrateAirspaceCache } from './features/airspace/cache/hydrateAirspaceCache';
import { useAirspaceCacheSettingStore } from './features/airspace/store/airspaceCacheSettingStore';

console.log(
  `[Drone-OpenSky] v${import.meta.env.VITE_APP_VERSION} — ${import.meta.env.VITE_APP_LAST_COMMIT}`,
);

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  // 캐시를 먼저 채워야 useQueries가 마운트 시 이미 신선한 데이터를 보고 네트워크 요청을 건너뛴다.
  // hydrateAirspaceCache는 실패/타임아웃을 내부에서 처리하므로 finally로 렌더를 항상 보장한다.
  // 저장된 설정(localStorage)은 동기로 복원되므로 렌더 전에 읽을 수 있다. 캐시를 끈 동안은 하이드레이션하지 않는다. 이전에 저장된 IndexedDB 항목은 그대로 두어, 다시 켤 때 재사용된다.
  const hydration = useAirspaceCacheSettingStore.getState().enabled
    ? hydrateAirspaceCache(queryClient)
    : Promise.resolve();
  hydration.finally(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
