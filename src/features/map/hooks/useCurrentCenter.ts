import { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_CENTER } from '@/features/map/constants';

interface UseCurrentCenterReturn {
  position: { lat: number; lng: number };
  hasLocation: boolean;
  /** 최초 자동 조회(마운트 시)가 성공/실패 여부와 무관하게 한 번 끝났는지 여부. */
  hasResolvedInitial: boolean;
  refetchLocation: (onError?: () => void) => void;
}

export const useCurrentCenter = (): UseCurrentCenterReturn => {
  const [position, setPosition] = useState(DEFAULT_CENTER);
  const [hasLocation, setHasLocation] = useState(false);
  const [hasResolvedInitial, setHasResolvedInitial] = useState(false);

  // 마운트 시 자동 실행되는 최초 조회와, 버튼 클릭으로 실행되는 이후 재조회를 구분하기 위한 플래그.
  const isFirstFetchRef = useRef(true);

  const refetchLocation = useCallback((onError?: () => void) => {
    const markResolved = () => {
      if (isFirstFetchRef.current) {
        isFirstFetchRef.current = false;
        setHasResolvedInitial(true);
      }
    };

    if (!navigator.geolocation) {
      onError?.();
      markResolved();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({
          lat: result.coords.latitude,
          lng: result.coords.longitude,
        });
        setHasLocation(true);
        markResolved();
      },
      () => {
        // 실패 시 마커는 숨기되, 위치는 기존 값(최초에는 DEFAULT_CENTER) 그대로 유지한다.
        setHasLocation(false);
        onError?.();
        markResolved();
      },
    );
  }, []);

  // 최초 마운트 시 한 번 자동으로 위치를 조회한다(이후 재조회는 버튼 클릭으로 refetchLocation 직접 호출).
  useEffect(() => {
    refetchLocation();
  }, [refetchLocation]);

  return { position, hasLocation, hasResolvedInitial, refetchLocation };
};
