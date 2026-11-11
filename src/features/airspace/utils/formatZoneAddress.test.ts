import { describe, expect, it } from 'vitest';

import { formatZoneAddress } from '@/features/airspace/utils/formatZoneAddress';

describe('formatZoneAddress', () => {
  it('idle이면 아무것도 보여 주지 않는다', () => {
    expect(formatZoneAddress({ status: 'idle' })).toBeNull();
  });

  it('조회 중, 못 찾음, 실패는 각각 안내 문구를 준다', () => {
    expect(formatZoneAddress({ status: 'loading' })).toBe('주소 조회 중…');
    expect(formatZoneAddress({ status: 'notFound' })).toBe('주소를 찾지 못했습니다.');
    expect(formatZoneAddress({ status: 'error' })).toBe('주소를 불러오지 못했습니다.');
  });

  it('도로명과 지번이 있으면 지번을 괄호로 병기한다', () => {
    expect(
      formatZoneAddress({ status: 'success', address: { primary: '도로명', secondary: '지번' } }),
    ).toBe('도로명 (지번)');
  });

  it('지번 병기가 없으면 주소만 준다', () => {
    expect(formatZoneAddress({ status: 'success', address: { primary: '지번' } })).toBe('지번');
  });
});
