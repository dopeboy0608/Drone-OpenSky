import { vworldClient } from './vworldClient';

export type ZoneType = 'available' | 'restricted' | 'prohibited';

const ZONE_TYPENAME: Record<ZoneType, string> = {
  available: 'lt_c_aisuac', // 초경량비행장치 공역 (비행가능)
  restricted: 'lt_c_aisresc', // 비행제한구역
  prohibited: 'lt_c_aisprhc', // 비행금지구역
};

export interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][] | number[][][][];
    };
    properties: Record<string, unknown>;
  }>;
}

export const fetchDroneZone = async (
  zoneType: ZoneType,
  bbox: BoundingBox,
): Promise<GeoJsonFeatureCollection> => {
  const { data } = await vworldClient.get<GeoJsonFeatureCollection>('/wfs', {
    params: {
      SERVICE: 'WFS',
      REQUEST: 'GetFeature',
      TYPENAME: ZONE_TYPENAME[zoneType],
      SRSNAME: 'EPSG:4326',
      OUTPUT: 'application/json',
      BBOX: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
    },
  });

  return data;
};
