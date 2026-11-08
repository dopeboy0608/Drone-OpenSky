import { describe, expect, it } from 'vitest';

import { getGroupCheckState } from '@/features/airspace/utils/getGroupCheckState';

describe('getGroupCheckState', () => {
  const typenames = ['a', 'b', 'c'];

  it('모두 켜져 있으면 all', () => {
    expect(getGroupCheckState(typenames, { a: true, b: true, c: true })).toBe('all');
  });

  it('모두 꺼져 있으면 none', () => {
    expect(getGroupCheckState(typenames, { a: false, b: false, c: false })).toBe('none');
  });

  it('섞여 있으면 some', () => {
    expect(getGroupCheckState(typenames, { a: true, b: false, c: true })).toBe('some');
  });

  it('visibility에 없는 키는 꺼짐으로 취급한다', () => {
    expect(getGroupCheckState(typenames, { a: true, b: true })).toBe('some');
    expect(getGroupCheckState(typenames, {})).toBe('none');
  });

  it('다른 그룹의 상태는 영향을 주지 않는다', () => {
    expect(getGroupCheckState(['a'], { a: true, b: false })).toBe('all');
  });
});
