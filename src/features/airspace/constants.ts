import type { AirspaceZoneConfig } from '@/features/airspace/types';

// 대한민국 전역을 덮는 고정 BBOX (minLng,minLat,maxLng,maxLat). API_REFERENCE.md 실증값.
export const KOREA_BBOX = '124,33,132,43';

export const AIRSPACE_ZONE_CONFIGS: AirspaceZoneConfig[] = [
  {
    level: 'prohibited',
    typenames: ['lt_c_aisprhc', 'lt_c_aistemp', 'lt_c_aisdngc'],
    color: '#FF4D4F',
    fillOpacity: 0.35,
    zIndex: 3,
  },
  {
    level: 'restricted',
    typenames: [
      'lt_c_aisresc',
      'lt_c_aisctrc',
      'lt_c_aismoac',
      'lt_c_aisaltc',
      'lt_c_aisatzc',
      'lt_c_aisfldc',
      'lt_c_wgisnpgug',
    ],
    color: '#8C8C8C',
    fillOpacity: 0.3,
    zIndex: 2,
  },
  {
    level: 'available',
    typenames: ['lt_c_aisuac', 'lt_c_aisdronezone'],
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

// typename → 한글 구역 종류 라벨. 같은 색상 그룹 안에서도 클릭 시 정확한 구역 종류를 구분하기 위함(#24 FR-007).
export const TYPENAME_ZONE_LABELS: Record<string, string> = {
  lt_c_aisprhc: '비행금지구역',
  lt_c_aistemp: '임시비행금지구역',
  lt_c_aisdngc: '위험구역',
  lt_c_aisresc: '비행제한구역',
  lt_c_aisctrc: '관제권',
  lt_c_aismoac: '군작전구역',
  lt_c_aisaltc: '경계구역',
  lt_c_aisatzc: '비행장교통구역',
  lt_c_aisfldc: '경량항공기 이착륙장',
  lt_c_wgisnpgug: '국립자연공원',
  lt_c_aisuac: '초경량비행장치공역(UA)',
  lt_c_aisdronezone: '드론시범사업구역',
};
