export type AirspaceZoneLevel = 'prohibited' | 'restricted' | 'available';

export interface AirspaceZoneConfig {
  level: AirspaceZoneLevel;
  typenames: string[];
  color: string;
  fillOpacity: number;
  zIndex: number;
}

export interface VWorldFeature {
  type: 'Feature';
  geometry: {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  };
  properties: Record<string, unknown>;
}

export interface VWorldFeatureCollection {
  type: 'FeatureCollection';
  features: VWorldFeature[];
}
