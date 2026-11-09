import { describe, expect, it } from 'vitest';

import { tileToWcongBounds } from '@/features/airspace/utils/tileToWcongBounds';

describe('tileToWcongBounds', () => {
  it('z=0, (0,0)은 크기 80의 타일이 원점(-75000, -150000)에서 시작한다', () => {
    expect(tileToWcongBounds(0, 0, 0)).toEqual({
      minX: -75000,
      minY: -150000,
      maxX: -74920,
      maxY: -149920,
    });
  });

  it('size는 80·2^z로 레벨마다 두 배가 된다', () => {
    const bounds = tileToWcongBounds(0, 0, 3);

    expect(bounds.maxX - bounds.minX).toBe(640);
    expect(bounds.maxY - bounds.minY).toBe(640);
  });

  it('x, y 인덱스만큼 size 단위로 이동한다', () => {
    const bounds = tileToWcongBounds(2, 3, 1);

    expect(bounds).toEqual({
      minX: -75000 + 160 * 2,
      minY: -150000 + 160 * 3,
      maxX: -75000 + 160 * 3,
      maxY: -150000 + 160 * 4,
    });
  });

  it('음수 인덱스도 같은 선형 공식으로 계산한다', () => {
    const bounds = tileToWcongBounds(-1, -2, 2);

    expect(bounds.minX).toBe(-75000 - 320);
    expect(bounds.minY).toBe(-150000 - 640);
  });
});
