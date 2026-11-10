import { describe, expect, it } from 'vitest';

import { formatLastUpdated } from '@/features/airspace/utils/formatLastUpdated';

// 로컬 시간 기준으로 만들어 실행 환경의 타임존과 무관하게 같은 결과가 나오게 한다.
const at = (month: number, day: number, hour: number, minute: number) =>
  new Date(2026, month - 1, day, hour, minute).getTime();

describe('formatLastUpdated', () => {
  it('오늘이면 시:분만 표시한다', () => {
    expect(formatLastUpdated(at(11, 10, 14, 5), at(11, 10, 18, 30))).toBe('14:05');
  });

  it('시와 분은 0을 채워 두 자리로 표시한다', () => {
    expect(formatLastUpdated(at(11, 10, 9, 3), at(11, 10, 18, 30))).toBe('09:03');
  });

  it('오늘이 아니면 월·일을 함께 표시한다', () => {
    expect(formatLastUpdated(at(11, 9, 23, 59), at(11, 10, 0, 1))).toBe('11월 9일 23:59');
  });

  it('해가 바뀌어도 월·일과 시각을 표시한다', () => {
    expect(formatLastUpdated(at(12, 31, 8, 0), at(1, 1, 9, 0))).toBe('12월 31일 08:00');
  });
});
