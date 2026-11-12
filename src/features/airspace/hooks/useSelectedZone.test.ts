import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSelectedZone } from '@/features/airspace/hooks/useSelectedZone';

import type { SelectedZone } from '@/features/airspace/types';

const zone: SelectedZone = { position: { lat: 37, lng: 127 }, zoneType: '관제권' };

describe('useSelectedZone', () => {
  it('구역을 선택하고 닫을 수 있다', () => {
    const { result } = renderHook(() => useSelectedZone());

    act(() => result.current.selectZone(zone));
    expect(result.current.selectedZone).toEqual(zone);

    act(() => result.current.clearZone());
    expect(result.current.selectedZone).toBeNull();
  });

  it('selectZone/clearZone은 리렌더 간 참조가 유지된다', () => {
    const { result, rerender } = renderHook(() => useSelectedZone());
    const { selectZone, clearZone } = result.current;

    act(() => result.current.selectZone(zone));
    rerender();

    expect(result.current.selectZone).toBe(selectZone);
    expect(result.current.clearZone).toBe(clearZone);
  });

  it('선택된 종류를 범례에서 꺼도 닫지 않는다 (숨김 여부는 카드에 표기한다)', () => {
    // 가시성 입력 자체가 없으므로 상태가 외부 조건으로 지워지지 않는다는 것을 확인한다.
    const { result, rerender } = renderHook(() => useSelectedZone());

    act(() => result.current.selectZone(zone));
    rerender();

    expect(result.current.selectedZone).toEqual(zone);
  });
});
