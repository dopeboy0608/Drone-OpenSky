import { ZONE_LEVEL_BY_LABEL } from '@/features/airspace/constants';
import type { AirspaceZoneLevel } from '@/features/airspace/types';

export type GuidanceTone = 'error' | 'warning' | 'success' | 'default';

export interface FlightGuidance {
  level: AirspaceZoneLevel | null;
  tone: GuidanceTone;
  headline: string;
  detail: string;
}

const REFERENCE_ONLY_NOTICE = '참고용 정보이며 비행 전 공식 확인이 필요합니다.';

const GUIDANCE_BY_LEVEL: Record<AirspaceZoneLevel, Omit<FlightGuidance, 'level'>> = {
  prohibited: {
    tone: 'error',
    headline: '비행 금지 구역',
    detail: '원칙적으로 비행이 금지된 구역입니다. 비행 전 승인 절차를 확인하세요.',
  },
  restricted: {
    tone: 'warning',
    headline: '비행 제한 구역',
    detail: '비행 전 승인 필요 여부를 확인하세요.',
  },
  // 이 레벨을 "승인 불필요"로 단정하지 않는다. 그 판단은 국토부 데이터 검증(#76)과 함께 정한다.
  available: {
    tone: 'success',
    headline: '비행 가능 공역으로 분류',
    detail: '승인 필요 여부는 공식 확인이 필요합니다.',
  },
};

// 구역이 없다는 것은 "조회된 규제가 없다"일 뿐 비행 가능을 보증하지 않는다. 그래서 headline에 가능이라는 말을 쓰지 않는다.
const NO_ZONE_GUIDANCE: FlightGuidance = {
  level: null,
  tone: 'default',
  headline: '조회된 규제 구역 없음',
  detail: REFERENCE_ONLY_NOTICE,
};

export const resolveFlightGuidance = (zoneType: string | null): FlightGuidance => {
  if (zoneType === null) {
    return NO_ZONE_GUIDANCE;
  }

  const level = ZONE_LEVEL_BY_LABEL[zoneType];

  // 알 수 없는 구역은 레벨을 추측하지 않는다(추측이 틀리면 안전 안내가 틀어진다).
  if (level === undefined) {
    return { level: null, tone: 'default', headline: zoneType, detail: REFERENCE_ONLY_NOTICE };
  }

  return { level, ...GUIDANCE_BY_LEVEL[level] };
};
