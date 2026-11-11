import { useEffect, useState } from 'react';

import { reverseGeocode } from '@/features/map/utils/reverseGeocode';

import type { AddressState } from '@/types/address';

// 구역 판정과 독립적으로 조회한다. 주소 조회가 실패해도 안내 박스의 구역 정보는 그대로여야 하기 때문이다(#27).
export const useAddressAtPosition = (
  position: { lat: number; lng: number } | null,
): AddressState => {
  const [state, setState] = useState<AddressState>({ status: 'idle' });

  const lat = position?.lat;
  const lng = position?.lng;

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setState({ status: 'idle' });
      return;
    }

    // 클릭이 연달아 오면 늦게 도착한 이전 응답이 새 위치의 주소를 덮어쓰지 않게 한다.
    let isStale = false;
    setState({ status: 'loading' });

    reverseGeocode({ lat, lng }).then(
      (address) => {
        if (!isStale) {
          setState(address ? { status: 'success', address } : { status: 'notFound' });
        }
      },
      (error) => {
        if (!isStale) {
          console.error('[map] 클릭 지점 주소 조회 실패', error);
          setState({ status: 'error' });
        }
      },
    );

    return () => {
      isStale = true;
    };
  }, [lat, lng]);

  return state;
};
