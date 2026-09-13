import { Spin } from 'antd';
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';

import { AirspaceLegend } from '@/features/airspace/components/AirspaceLegend';
import { AirspacePolygonLayer } from '@/features/airspace/components/AirspacePolygonLayer';
import { useAirspaceZoneQueries } from '@/features/airspace/queries/useAirspaceZoneQueries';
import { useCurrentCenter } from '@/features/map/hooks/useCurrentCenter';

export const MapView = () => {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_API_KEY,
  });
  const center = useCurrentCenter();
  const airspaceZoneResults = useAirspaceZoneQueries();

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
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
          <Spin />
        </div>
      )}
      <Map center={center} level={5} style={{ width: '100%', height: '100%' }}>
        {airspaceZoneResults.map(({ config, data }) => (
          <AirspacePolygonLayer key={config.level} config={config} data={data} />
        ))}
      </Map>
      <AirspaceLegend />
    </div>
  );
};
