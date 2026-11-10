import { App as AntdApp } from 'antd';
import { useCallback, useRef } from 'react';

import { findZoneTypeAtPoint } from '@/features/airspace/api/findZoneTypeAtPoint';
import type { SelectedZone } from '@/features/airspace/types';

const ERROR_TOAST_DURATION_SECONDS = 3;

interface UseWmsZoneClickParams {
  // WMS 모드일 때만 켠다. 폴리곤 모드는 폴리곤 자체가 클릭을 받는다.
  enabled: boolean;
  typenames: string[];
  selectZone: (zone: SelectedZone) => void;
  clearZone: () => void;
}

// WMS 타일은 래스터라 클릭 대상이 없어서, 클릭 지점만 WFS로 조회해 폴리곤 모드와 같은 안내를 띄운다 (이슈 #75).
export const useWmsZoneClick = ({
  enabled,
  typenames,
  selectZone,
  clearZone,
}: UseWmsZoneClickParams) => {
  const { message } = AntdApp.useApp();
  // 연속 클릭에서 늦게 도착한 이전 응답이 나중 클릭의 결과를 덮어쓰지 않도록 마지막 요청만 반영한다.
  const latestRequestIdRef = useRef(0);

  return useCallback(
    async (point: { lat: number; lng: number }) => {
      if (!enabled) {
        return;
      }

      latestRequestIdRef.current += 1;
      const requestId = latestRequestIdRef.current;

      if (typenames.length === 0) {
        clearZone();
        return;
      }

      try {
        const zoneType = await findZoneTypeAtPoint(point, typenames);

        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        if (zoneType === null) {
          clearZone();
          return;
        }

        selectZone({ position: point, zoneType });
      } catch (error) {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        console.error('[airspace] 클릭 지점 구역 조회 실패', error);
        message.error('구역 정보를 불러오지 못했습니다.', ERROR_TOAST_DURATION_SECONDS);
      }
    },
    [enabled, typenames, selectZone, clearZone, message],
  );
};
