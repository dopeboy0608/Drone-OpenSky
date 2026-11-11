import { describe, expect, it } from 'vitest';

import { resolveFlightGuidance } from '@/features/airspace/utils/resolveFlightGuidance';

describe('resolveFlightGuidance', () => {
  it('금지 레벨 구역은 금지 안내와 error 톤을 준다', () => {
    const guidance = resolveFlightGuidance('비행금지구역');

    expect(guidance.level).toBe('prohibited');
    expect(guidance.tone).toBe('error');
    expect(guidance.headline).toBe('비행 금지 구역');
  });

  it('제한 레벨 구역은 승인 필요 여부 확인을 안내한다', () => {
    const guidance = resolveFlightGuidance('관제권');

    expect(guidance.level).toBe('restricted');
    expect(guidance.tone).toBe('warning');
    expect(guidance.detail).toContain('승인');
  });

  it('가능 레벨 구역도 승인 불필요라고 단정하지 않는다', () => {
    const guidance = resolveFlightGuidance('초경량비행장치공역(UA)');

    expect(guidance.level).toBe('available');
    expect(guidance.detail).toContain('공식');
    expect(guidance.detail).not.toContain('불필요');
  });

  it('구역이 없으면(null) 비행 가능으로 단정하지 않고 참고용임을 알린다', () => {
    const guidance = resolveFlightGuidance(null);

    expect(guidance.level).toBeNull();
    expect(guidance.headline).toBe('조회된 규제 구역 없음');
    expect(guidance.detail).toContain('공식 확인');
    expect(guidance.headline).not.toContain('비행 가능');
  });

  it('알 수 없는 라벨은 레벨을 단정하지 않는다', () => {
    const guidance = resolveFlightGuidance('처음 보는 구역');

    expect(guidance.level).toBeNull();
    expect(guidance.tone).toBe('default');
  });
});
