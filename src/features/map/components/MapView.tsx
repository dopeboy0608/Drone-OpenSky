import { App as AntdApp, Spin } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as KakaoMap, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';

import { AirspaceFilterPanel } from '@/features/airspace/components/AirspaceFilterPanel';
import { AirspaceCacheMenu } from '@/features/airspace/components/AirspaceCacheMenu';
import { AirspaceRenderModeMenu } from '@/features/airspace/components/AirspaceRenderModeMenu';
import { AirspaceLegend } from '@/features/airspace/components/AirspaceLegend';
import { AirspacePolygonLayer } from '@/features/airspace/components/AirspacePolygonLayer';
import { AirspaceWmsLayer } from '@/features/airspace/components/AirspaceWmsLayer';
import { AirspaceZoneOverlay } from '@/features/airspace/components/AirspaceZoneOverlay';
import { useSelectedZone } from '@/features/airspace/hooks/useSelectedZone';
import { useWmsZoneClick } from '@/features/airspace/hooks/useWmsZoneClick';
import { AddressSearch } from '@/features/map/components/AddressSearch';
import { MapControls } from '@/features/map/components/MapControls';
import { useCurrentCenter } from '@/features/map/hooks/useCurrentCenter';
import { useMapMarker } from '@/features/map/hooks/useMapMarker';
import { useAirspaceZoneQueries } from '@/features/airspace/queries/useAirspaceZoneQueries';
import { useAirspaceFilterStore } from '@/features/airspace/store/airspaceFilterStore';
import { useAirspaceRenderModeStore } from '@/features/airspace/store/airspaceRenderModeStore';
import { getVisibleTypenames } from '@/features/airspace/utils/getVisibleTypenames';
import { getVisibleZoneTypes } from '@/features/airspace/utils/getVisibleZoneTypes';

import { DEFAULT_CENTER, DEFAULT_ZOOM_LEVEL } from '@/features/map/constants';

// 참조가 고정된 빈 Set. 렌더마다 새로 만들면 레이어/선택 해제 이펙트가 매번 다시 돈다.
const NO_VISIBLE_ZONE_TYPES: ReadonlySet<string> = new Set();

export const MapView = () => {
  const { message } = AntdApp.useApp();

  // 카카오 SDK 스크립트 로딩 상태. 로딩/에러 시 지도 대신 안내 문구를 렌더링한다.
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_API_KEY,
    // 주소·장소 검색(Places, Geocoder)은 services 라이브러리를 로드해야 쓸 수 있다.
    libraries: ['services'],
  });
  // 현재위치 재조회는 마커 위치만 갱신하고 지도는 움직이지 않아야 하므로,
  // 지도 이동 여부는 아래 mapCenter state로 별도 관리한다.
  const {
    position: currentPosition,
    hasLocation,
    hasResolvedInitial,
    refetchLocation,
  } = useCurrentCenter();

  const { markerPosition, showSearchMarker, showCurrentMarker } = useMapMarker(
    currentPosition,
    hasLocation,
  );

  const renderMode = useAirspaceRenderModeStore((state) => state.renderMode);
  // WMS 모드에서는 폴리곤 조회를 멈춘다. 폴리곤으로 돌아오면 다시 조회(또는 캐시 사용)한다.
  const { results: airspaceZoneResults, refreshStaleZones } = useAirspaceZoneQueries({
    enabled: renderMode === 'polygon',
  });

  const airspaceVisibility = useAirspaceFilterStore((state) => state.visibility);
  const filteredZoneTypes = useMemo(
    () => getVisibleZoneTypes(airspaceVisibility),
    [airspaceVisibility],
  );
  // WMS 모드의 숨김은 언마운트가 아니라 가시성 전환으로 한다. 폴리곤 복귀 시 Polygon 재생성 비용을
  // 피하기 위함이다(#47).
  const visibleZoneTypes = renderMode === 'wms' ? NO_VISIBLE_ZONE_TYPES : filteredZoneTypes;
  // 안내 박스의 자동 닫힘 기준은 폴리곤 숨김과 분리한다. WMS 모드에서도 클릭 안내(#75)가 열려야 하므로
  // 모드와 무관하게 범례 필터 기준(꺼진 종류만 닫힘)을 쓴다.
  const { selectedZone, selectZone, clearZone } = useSelectedZone(filteredZoneTypes);
  const visibleTypenames = useMemo(
    () => getVisibleTypenames(airspaceVisibility),
    [airspaceVisibility],
  );
  const handleWmsMapClick = useWmsZoneClick({
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

  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  // "현재위치로 이동"은 kakaoMapInstance.panTo()로 명령형 호출한다. react-kakao-maps-sdk의
  // Map은 center prop의 lat/lng 값이 실제로 바뀔 때만 지도를 움직이는 값 비교 방식이라,
  // 이미 알고 있는 좌표를 그대로 넘기면(혹은 GPS 재조회 값이 우연히 같으면) 반응하지 않기 때문이다
  // (이슈 #36). onCreate로 받은 인스턴스를 쓰는 이유는 SDK가 ref보다 이 방식을 권장해서다.
  const [kakaoMapInstance, setKakaoMapInstance] = useState<kakao.maps.Map | null>(null);

  // 최초 위치 조회가 끝난 시점에 한 번만 지도 중심을 맞추기 위한 플래그.
  // (이후 "현재위치 재조회"로 currentPosition이 바뀌어도 지도가 따라 움직이지 않도록 함)
  const hasSetInitialCenterRef = useRef(false);

  useEffect(() => {
    if (hasResolvedInitial && !hasSetInitialCenterRef.current) {
      hasSetInitialCenterRef.current = true;
      setMapCenter(currentPosition);
    }
  }, [hasResolvedInitial, currentPosition]);

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

  const isAnyZoneLoading = airspaceZoneResults.some((result) => result.isLoading);

  return (
    <div className="relative h-full w-full">
      {isAnyZoneLoading && (
        // top-16: 상단(top-4)에는 주소 검색 바가 있어 그 아래로 내린다.
        <div className="absolute top-16 left-1/2 z-10 -translate-x-1/2">
          <Spin />
        </div>
      )}
      <KakaoMap
        center={mapCenter}
        level={DEFAULT_ZOOM_LEVEL}
        style={{ width: '100%', height: '100%' }}
        onCreate={setKakaoMapInstance}
        onClick={(_map, mouseEvent) =>
          handleWmsMapClick({
            lat: mouseEvent.latLng.getLat(),
            lng: mouseEvent.latLng.getLng(),
          })
        }
      >
        {airspaceZoneResults.map(({ config, data }) => (
          <AirspacePolygonLayer
            key={config.level}
            config={config}
            data={data}
            visibleZoneTypes={visibleZoneTypes}
            onSelectZone={selectZone}
          />
        ))}
        {renderMode === 'wms' && <AirspaceWmsLayer />}
        {selectedZone && (
          <AirspaceZoneOverlay
            position={selectedZone.position}
            zoneType={selectedZone.zoneType}
            onClose={clearZone}
          />
        )}
        {markerPosition && <MapMarker position={markerPosition} />}
      </KakaoMap>
      <AddressSearch
        onSelectCandidate={({ lat, lng }) => {
          // 위치 권한 팝업 등으로 최초 위치 조회가 늦어질 때, 사용자가 먼저 검색으로 이동했다면
          // 조회가 끝난 뒤 지도를 내 위치로 되돌리지 않도록 최초 중심 맞춤을 끝난 것으로 표시한다.
          hasSetInitialCenterRef.current = true;
          kakaoMapInstance?.panTo(new kakao.maps.LatLng(lat, lng));
          showSearchMarker({ lat, lng });
        }}
      />
      <AirspaceLegend />
      <AirspaceFilterPanel />
      <MapControls
        onRefreshPolygons={refreshStaleZones}
        onMoveToCurrentLocation={() =>
          refetchLocation({
            onSuccess: (position) => {
              kakaoMapInstance?.panTo(new kakao.maps.LatLng(position.lat, position.lng));
              showCurrentMarker();
            },
            // 실패하면 마커 상태를 바꾸지 않는다. 검색 마커가 떠 있다면 위치를 못 구했다는 이유로 지울 필요가 없다.
            onError: () => message.error('현재 위치를 가져오지 못했습니다.'),
          })
        }
      >
        <AirspaceRenderModeMenu />
        <AirspaceCacheMenu />
      </MapControls>
    </div>
  );
};
