import { Spin } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';
import { type BoundingBox, fetchDroneZone } from '../../api/droneZones';
import { PolygonLayer } from '../PolygonLayer/PolygonLayer';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

// 현재 위치 기준 초기 조회 반경(도 단위, 약 10km)
const BBOX_DELTA = 0.1;

// 드래그엔드 이벤트 디바운스 지연 시간(ms)
const DRAG_END_DEBOUNCE_MS = 300;

const ZONE_TYPES = ['available', 'restricted', 'prohibited'] as const;

const boundsToBbox = (bounds: kakao.maps.LatLngBounds): BoundingBox => {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  return {
    minLng: sw.getLng(),
    minLat: sw.getLat(),
    maxLng: ne.getLng(),
    maxLat: ne.getLat(),
  };
};

const useCurrentCenter = () => {
  const [center, setCenter] = useState(DEFAULT_CENTER);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setCenter(DEFAULT_CENTER);
      },
    );
  }, []);

  return center;
};

export const MapView = () => {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_API_KEY,
  });
  const center = useCurrentCenter();

  const initialBbox = useMemo(
    () => ({
      minLng: center.lng - BBOX_DELTA,
      minLat: center.lat - BBOX_DELTA,
      maxLng: center.lng + BBOX_DELTA,
      maxLat: center.lat + BBOX_DELTA,
    }),
    [center],
  );

  const [manualBbox, setManualBbox] = useState<BoundingBox | null>(null);
  const bbox = manualBbox ?? initialBbox;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(debounceTimerRef.current);
  }, []);

  const handleDragEnd = (map: kakao.maps.Map) => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setManualBbox(boundsToBbox(map.getBounds()));
    }, DRAG_END_DEBOUNCE_MS);
  };

  const zoneQueries = useQueries({
    queries: ZONE_TYPES.map((zoneType) => ({
      queryKey: ['droneZone', zoneType, bbox],
      queryFn: () => fetchDroneZone(zoneType, bbox),
      placeholderData: (previousData: unknown) => previousData,
    })),
  });

  const isFetchingZones = zoneQueries.some((query) => query.isFetching);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        지도를 불러오지 못했습니다.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">지도를 불러오는 중...</div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isFetchingZones && (
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md">
            <Spin size="small" />
            <span>비행 구역 조회 중...</span>
          </div>
        </div>
      )}
      <Map
        center={center}
        level={5}
        style={{ width: '100%', height: '100%' }}
        onDragEnd={handleDragEnd}
      >
        {ZONE_TYPES.map((zoneType, index) => (
          <PolygonLayer key={zoneType} zoneType={zoneType} data={zoneQueries[index].data} />
        ))}
      </Map>
    </div>
  );
};
