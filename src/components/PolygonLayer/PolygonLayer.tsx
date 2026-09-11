import { useQuery } from '@tanstack/react-query';
import { Polygon } from 'react-kakao-maps-sdk';
import { type BoundingBox, type ZoneType, fetchDroneZone } from '../../api/droneZones';
import { geometryToPaths } from './geo';
import { ZONE_FILL_OPACITY, ZONE_STROKE_OPACITY, ZONE_STYLE } from './zoneStyle';

interface PolygonLayerProps {
  zoneType: ZoneType;
  bbox: BoundingBox;
}

export const PolygonLayer = ({ zoneType, bbox }: PolygonLayerProps) => {
  const style = ZONE_STYLE[zoneType];

  const { data } = useQuery({
    queryKey: ['droneZone', zoneType, bbox],
    queryFn: () => fetchDroneZone(zoneType, bbox),
  });

  if (!data) {
    return null;
  }

  return (
    <>
      {data.features.flatMap((feature, featureIndex) =>
        geometryToPaths(feature.geometry).map((path, polygonIndex) => (
          <Polygon
            key={`${zoneType}-${featureIndex}-${polygonIndex}`}
            path={path}
            strokeWeight={1.5}
            strokeColor={style.strokeColor}
            strokeOpacity={ZONE_STROKE_OPACITY}
            strokeStyle="solid"
            fillColor={style.fillColor}
            fillOpacity={ZONE_FILL_OPACITY}
          />
        )),
      )}
    </>
  );
};
