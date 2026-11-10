import { describe, expect, it } from 'vitest';

import { getVisibleTypenames } from '@/features/airspace/utils/getVisibleTypenames';

describe('getVisibleTypenames', () => {
  it('켜진 typename만 입력 순서대로 반환한다', () => {
    expect(
      getVisibleTypenames({ lt_c_aisprhc: true, lt_c_aisctrc: false, lt_c_aisuac: true }),
    ).toEqual(['lt_c_aisprhc', 'lt_c_aisuac']);
  });

  it('모두 꺼져 있으면 빈 배열을 반환한다', () => {
    expect(getVisibleTypenames({ lt_c_aisprhc: false })).toEqual([]);
  });

  it('라벨이 없는 알 수 없는 키는 WMS LAYERS에 넣지 않는다', () => {
    expect(getVisibleTypenames({ unknown: true, lt_c_aisprhc: true })).toEqual(['lt_c_aisprhc']);
  });
});
