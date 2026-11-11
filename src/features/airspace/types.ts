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
  /** 클라이언트에서 typename 기준으로 주입하는 한글 구역 종류 라벨. VWorld 원본 응답에는 없음. */
  zoneType?: string;
}

export interface VWorldFeatureCollection {
  type: 'FeatureCollection';
  features: VWorldFeature[];
}

export interface SelectedZone {
  position: { lat: number; lng: number };
  // null이면 클릭 지점에 조회된 규제 구역이 없다는 뜻이다(#27).
  zoneType: string | null;
}

// 안내 박스가 보여 주는 주소 조회 상태. map feature의 훅이 같은 모양을 주지만, airspace가 map을 import하면
// map→airspace와 순환하므로 구조만 맞춰 둔다.
export type ZoneAddressState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; address: { primary: string; secondary?: string; isRegionOnly?: boolean } }
  | { status: 'notFound' }
  | { status: 'error' };
