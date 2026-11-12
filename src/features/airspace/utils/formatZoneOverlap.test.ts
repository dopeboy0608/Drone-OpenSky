import { describe, expect, it } from 'vitest';

import { formatZoneOverlap } from '@/features/airspace/utils/formatZoneOverlap';

describe('formatZoneOverlap', () => {
  it('정보가 없으면 줄을 만들지 않는다', () => {
    expect(formatZoneOverlap(undefined)).toBeNull();
  });

  it('확인 중에는 없음으로 단정하지 않는다', () => {
    expect(formatZoneOverlap({ zoneTypes: [], isComplete: false, hasFailure: false })).toBe(
      '겹침 확인 중…',
    );
  });

  it('확인 중에도 이미 찾은 겹침은 보여 준다', () => {
    expect(formatZoneOverlap({ zoneTypes: ['관제권'], isComplete: false, hasFailure: false })).toBe(
      '겹침: 관제권 (확인 중…)',
    );
  });

  it('끝났고 겹침이 없으면 없음이라고 알린다', () => {
    expect(formatZoneOverlap({ zoneTypes: [], isComplete: true, hasFailure: false })).toBe(
      '겹치는 구역 없음',
    );
  });

  it('겹친 구역을 우선순위 순서대로 나열한다', () => {
    expect(
      formatZoneOverlap({ zoneTypes: ['관제권', '경계구역'], isComplete: true, hasFailure: false }),
    ).toBe('겹침: 관제권, 경계구역');
  });

  it('일부 조회가 실패했으면 완전하지 않다고 밝힌다', () => {
    expect(formatZoneOverlap({ zoneTypes: [], isComplete: true, hasFailure: true })).toBe(
      '겹침 확인 중 일부 조회에 실패했습니다.',
    );
    expect(formatZoneOverlap({ zoneTypes: ['관제권'], isComplete: true, hasFailure: true })).toBe(
      '겹침: 관제권 (일부 조회 실패)',
    );
  });
});
