import type { AirspaceZoneConfig } from '@/features/airspace/types';

// 대한민국 전역을 덮는 고정 BBOX (minLng,minLat,maxLng,maxLat). API_REFERENCE.md 실증값.
export const KOREA_BBOX = '124,33,132,43';

export const AIRSPACE_ZONE_CONFIGS: AirspaceZoneConfig[] = [
  {
    level: 'prohibited',
    typenames: ['lt_c_aisprhc'],
    color: '#FF4D4F',
    fillOpacity: 0.35,
    zIndex: 3,
  },
  {
    level: 'restricted',
    typenames: ['lt_c_aisresc', 'lt_c_aisctrc', 'lt_c_aismoac'],
    color: '#8C8C8C',
    fillOpacity: 0.3,
    zIndex: 2,
  },
  {
    level: 'available',
    typenames: ['lt_c_aisuac'],
    color: '#52C41A',
    fillOpacity: 0.2,
    zIndex: 1,
  },
];

export const AIRSPACE_ZONE_LABELS: Record<AirspaceZoneConfig['level'], string> = {
  prohibited: '비행 금지',
  restricted: '비행 제한',
  available: '비행 가능',
};
