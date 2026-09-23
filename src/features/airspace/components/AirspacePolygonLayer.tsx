import { Fragment, useState } from 'react';
import { CustomOverlayMap, Polygon } from 'react-kakao-maps-sdk';

import { AirspaceZoneOverlay } from '@/features/airspace/components/AirspaceZoneOverlay';
import { multiPolygonToKakaoPaths } from '@/features/airspace/utils/multiPolygonToKakaoPaths';
import { polygonCentroid } from '@/features/airspace/utils/polygonCentroid';
import type {
  AirspaceZoneConfig,
  VWorldFeature,
  VWorldFeatureCollection,
} from '@/features/airspace/types';

interface AirspacePolygonLayerProps {
  config: AirspaceZoneConfig;
  data: VWorldFeatureCollection | undefined;
}

interface SelectedZone {
  position: { lat: number; lng: number };
  zoneType: string;
}

const ZONE_NUMBER_PROPERTY_BY_LEVEL: Partial<Record<AirspaceZoneConfig['level'], string>> = {
  prohibited: 'prh_lbl_1',
  restricted: 'res_lbl_1',
};

const getZoneNumberLabel = (
  level: AirspaceZoneConfig['level'],
  properties: VWorldFeature['properties'],
): string | undefined => {
  const propertyKey = ZONE_NUMBER_PROPERTY_BY_LEVEL[level];
  if (!propertyKey) {
    return undefined;
  }
  const value = properties[propertyKey];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

export const AirspacePolygonLayer = ({ config, data }: AirspacePolygonLayerProps) => {
  const [selectedZone, setSelectedZone] = useState<SelectedZone | null>(null);

  if (!data) {
    return null;
  }

  return (
    <>
      {data.features.flatMap((feature, featureIndex) => {
        const zoneNumberLabel = getZoneNumberLabel(config.level, feature.properties);

        return multiPolygonToKakaoPaths(feature.geometry.coordinates).map((rings, polygonIndex) => (
          <Fragment
            // biome-ignore lint/suspicious/noArrayIndexKey: GeoJSON 응답은 폴리곤 순서가 바뀌거나 중간에 삽입/삭제되지 않는 정적 목록이라 인덱스 조합으로 안전하다.
            key={`${config.level}-${featureIndex}-${polygonIndex}`}
          >
            <Polygon
              path={rings.map((ring) =>
                ring.map((point) => ({ lat: point.getLat(), lng: point.getLng() })),
              )}
              strokeWeight={1}
              strokeColor={config.color}
              strokeOpacity={0.8}
              fillColor={config.color}
              fillOpacity={config.fillOpacity}
              zIndex={config.zIndex}
              onClick={(_target, mouseEvent) => {
                if (!feature.zoneType) {
                  return;
                }
                setSelectedZone({
                  position: { lat: mouseEvent.latLng.getLat(), lng: mouseEvent.latLng.getLng() },
                  zoneType: feature.zoneType,
                });
              }}
            />
            {zoneNumberLabel && (
              <CustomOverlayMap position={polygonCentroid(rings[0])} zIndex={config.zIndex}>
                <span className="rounded bg-white/80 px-1 text-[10px] whitespace-nowrap text-gray-800">
                  {zoneNumberLabel}
                </span>
              </CustomOverlayMap>
            )}
          </Fragment>
        ));
      })}
      {selectedZone && (
        <AirspaceZoneOverlay
          position={selectedZone.position}
          zoneType={selectedZone.zoneType}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </>
  );
};
