import { describe, expect, it } from 'vitest';

import { latLngToWebMercator } from '@/features/airspace/utils/latLngToWebMercator';

describe('latLngToWebMercator', () => {
  it('(0, 0)은 원점이다', () => {
    const { x, y } = latLngToWebMercator(0, 0);

    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(0, 6);
  });

  it('경도 180은 x가 지구 반둘레(20037508.34)다', () => {
    expect(latLngToWebMercator(0, 180).x).toBeCloseTo(20037508.34, 1);
  });

  it('서울(37.5665, 126.978)을 알려진 값으로 변환한다', () => {
    const { x, y } = latLngToWebMercator(37.5665, 126.978);

    expect(x).toBeCloseTo(14135126, 0);
    expect(y).toBeCloseTo(4518400, -4);
  });

  it('남반구·서반구는 음수 좌표다', () => {
    const { x, y } = latLngToWebMercator(-10, -20);

    expect(x).toBeLessThan(0);
    expect(y).toBeLessThan(0);
  });
});
