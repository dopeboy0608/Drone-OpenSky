import { describe, expect, it } from 'vitest';

import { chunkTypenames } from '@/features/airspace/utils/chunkTypenames';

describe('chunkTypenames', () => {
  it('지정한 개수씩 순서를 유지해 나눈다', () => {
    expect(chunkTypenames(['a', 'b', 'c', 'd', 'e'], 4)).toEqual([['a', 'b', 'c', 'd'], ['e']]);
  });

  it('개수가 딱 맞으면 마지막 빈 묶음을 만들지 않는다', () => {
    expect(chunkTypenames(['a', 'b', 'c', 'd'], 4)).toEqual([['a', 'b', 'c', 'd']]);
  });

  it('4개 이하면 한 묶음이다', () => {
    expect(chunkTypenames(['a'], 4)).toEqual([['a']]);
  });

  it('빈 입력이면 빈 배열을 반환한다', () => {
    expect(chunkTypenames([], 4)).toEqual([]);
  });

  it('크기가 1 미만이면 무한 루프 대신 오류를 던진다', () => {
    expect(() => chunkTypenames(['a'], 0)).toThrow();
  });
});
