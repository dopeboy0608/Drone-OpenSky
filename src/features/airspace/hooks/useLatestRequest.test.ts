import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLatestRequest } from '@/features/airspace/hooks/useLatestRequest';

describe('useLatestRequest', () => {
  it('begin()한 요청은 시작 직후 최신이고 신호는 취소되지 않았다', () => {
    const { result } = renderHook(() => useLatestRequest());

    const request = result.current();

    expect(request.isLatest()).toBe(true);
    expect(request.signal.aborted).toBe(false);
  });

  it('새 요청을 시작하면 이전 요청은 최신이 아니고 신호가 취소된다', () => {
    const { result } = renderHook(() => useLatestRequest());

    const first = result.current();
    const second = result.current();

    expect(first.isLatest()).toBe(false);
    expect(first.signal.aborted).toBe(true);
    expect(second.isLatest()).toBe(true);
    expect(second.signal.aborted).toBe(false);
  });

  it('언마운트하면 진행 중인 요청의 신호를 취소한다', () => {
    const { result, unmount } = renderHook(() => useLatestRequest());
    const request = result.current();

    unmount();

    expect(request.signal.aborted).toBe(true);
  });

  it('렌더가 바뀌어도 begin 함수의 참조는 같다 (콜백 의존성이 흔들리지 않게)', () => {
    const { result, rerender } = renderHook(() => useLatestRequest());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
