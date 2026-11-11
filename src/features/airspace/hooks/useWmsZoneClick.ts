import { App as AntdApp } from 'antd';
import { useCallback, useState } from 'react';

import { findZoneTypeAtPoint } from '@/features/airspace/api/findZoneTypeAtPoint';
import { useLatestRequest } from '@/features/airspace/hooks/useLatestRequest';

import { ERROR_TOAST_DURATION_SECONDS } from '@/constants/toast';
import type { SelectedZone } from '@/features/airspace/types';

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
  // 조회가 끝날 때까지 클릭 지점에 보여 줄 좌표. 응답을 기다리는 동안 화면이 멈춘 것처럼 보이지 않게 한다.
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null);
  // 연속 클릭에서 늦게 도착한 이전 응답이 나중 클릭의 결과를 덮어쓰지 않도록 마지막 요청만 반영한다.
  const beginLatestRequest = useLatestRequest();

  const onMapClick = useCallback(
    async (point: { lat: number; lng: number }) => {
      if (!enabled) {
        return;
      }

      // 새 클릭이 오면 이전 조회는 결과를 쓰지 않으므로 요청 자체를 끊어 네트워크와 파싱을 아낀다.
      const { signal, isLatest } = beginLatestRequest();

      if (typenames.length === 0) {
        setPendingPosition(null);
        clearZone();
        return;
      }

      setPendingPosition(point);

      try {
        const zoneType = await findZoneTypeAtPoint(point, typenames, signal);

        if (!isLatest()) {
          return;
        }

        if (zoneType === null) {
          clearZone();
          return;
        }

        selectZone({ position: point, zoneType });
      } catch (error) {
        if (!isLatest()) {
          return;
        }

        console.error('[airspace] 클릭 지점 구역 조회 실패', error);
        message.error('구역 정보를 불러오지 못했습니다.', ERROR_TOAST_DURATION_SECONDS);
      } finally {
        // 마지막 클릭의 조회가 끝났을 때만 표시를 지운다(이전 클릭이 새 표시를 지우지 않게).
        if (isLatest()) {
          setPendingPosition(null);
        }
      }
    },
    [enabled, typenames, selectZone, clearZone, message, beginLatestRequest],
  );

  return { onMapClick, pendingPosition };
};
