import { Polygon } from 'react-kakao-maps-sdk';

import { multiPolygonToKakaoPaths } from '@/features/airspace/utils/multiPolygonToKakaoPaths';
import type { AirspaceZoneConfig, VWorldFeatureCollection } from '@/features/airspace/types';

interface AirspacePolygonLayerProps {
  config: AirspaceZoneConfig;
  data: VWorldFeatureCollection | undefined;
}

export const AirspacePolygonLayer = ({ config, data }: AirspacePolygonLayerProps) => {
  if (!data) {
    return null;
  }

  return (
    <>
      {data.features.flatMap((feature, featureIndex) =>
        multiPolygonToKakaoPaths(feature.geometry.coordinates).map((rings, polygonIndex) => (
          <Polygon
            // biome-ignore lint/suspicious/noArrayIndexKey: GeoJSON 응답은 폴리곤 순서가 바뀌거나 중간에 삽입/삭제되지 않는 정적 목록이라 인덱스 조합으로 안전하다.
            key={`${config.level}-${featureIndex}-${polygonIndex}`}
            path={rings.map((ring) =>
              ring.map((point) => ({ lat: point.getLat(), lng: point.getLng() })),
            )}
            strokeWeight={1}
            strokeColor={config.color}
            strokeOpacity={0.8}
            fillColor={config.color}
            fillOpacity={config.fillOpacity}
            zIndex={config.zIndex}
          />
        )),
      )}
    </>
  );
};
