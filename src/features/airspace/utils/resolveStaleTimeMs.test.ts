import { describe, expect, it } from 'vitest';

import {
  DEFAULT_STALE_TIME_MS,
  resolveStaleTimeMs,
} from '@/features/airspace/utils/resolveStaleTimeMs';

describe('resolveStaleTimeMs', () => {
  it('값이 없으면 기본 24시간을 쓴다', () => {
    expect(resolveStaleTimeMs(undefined)).toBe(DEFAULT_STALE_TIME_MS);
    expect(DEFAULT_STALE_TIME_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('빈 문자열이면 기본값을 쓴다', () => {
    expect(resolveStaleTimeMs('')).toBe(DEFAULT_STALE_TIME_MS);
  });

  it('양의 정수 밀리초 문자열이면 그 값을 쓴다 (1~3분 테스트용)', () => {
    expect(resolveStaleTimeMs('60000')).toBe(60_000);
    expect(resolveStaleTimeMs('180000')).toBe(180_000);
  });

  it('숫자가 아니거나 0 이하면 기본값을 쓴다', () => {
    expect(resolveStaleTimeMs('abc')).toBe(DEFAULT_STALE_TIME_MS);
    expect(resolveStaleTimeMs('0')).toBe(DEFAULT_STALE_TIME_MS);
    expect(resolveStaleTimeMs('-1000')).toBe(DEFAULT_STALE_TIME_MS);
    expect(resolveStaleTimeMs('Infinity')).toBe(DEFAULT_STALE_TIME_MS);
  });
});
