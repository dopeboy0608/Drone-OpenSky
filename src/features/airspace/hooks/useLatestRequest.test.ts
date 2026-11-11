import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLatestRequest } from '@/features/airspace/hooks/useLatestRequest';

describe('useLatestRequest', () => {
  it('begin()한 요청은 시작 직후 최신이고 신호는 취소되지 않았다', () => {
    const { result } = renderHook(() => useLatestRequest());

    const request = result.current.begin();

    expect(request.isLatest()).toBe(true);
    expect(request.signal.aborted).toBe(false);
  });

  it('새 요청을 시작하면 이전 요청은 최신이 아니고 신호가 취소된다', () => {
    const { result } = renderHook(() => useLatestRequest());

    const first = result.current.begin();
    const second = result.current.begin();

    expect(first.isLatest()).toBe(false);
    expect(first.signal.aborted).toBe(true);
    expect(second.isLatest()).toBe(true);
    expect(second.signal.aborted).toBe(false);
  });

  it('언마운트하면 진행 중인 요청의 신호를 취소한다', () => {
    const { result, unmount } = renderHook(() => useLatestRequest());
    const request = result.current.begin();

    unmount();

    expect(request.signal.aborted).toBe(true);
  });

  it('렌더가 바뀌어도 begin·cancel의 참조는 같다 (콜백과 이펙트 의존성이 흔들리지 않게)', () => {
    const { result, rerender } = renderHook(() => useLatestRequest());
    const first = result.current;

    rerender();

    expect(result.current.begin).toBe(first.begin);
    expect(result.current.cancel).toBe(first.cancel);
  });

  // 이슈 #94: 호출하는 쪽이 비활성화될 때 이미 나간 요청을 끊고 결과를 무시할 수 있어야 한다.
  it('cancel()하면 진행 중인 요청은 최신이 아니고 신호가 취소된다', () => {
    const { result } = renderHook(() => useLatestRequest());
    const request = result.current.begin();

    result.current.cancel();

    expect(request.isLatest()).toBe(false);
    expect(request.signal.aborted).toBe(true);
  });

  it('진행 중인 요청이 없을 때 cancel()해도 오류 없이 지나간다', () => {
    const { result } = renderHook(() => useLatestRequest());

    expect(() => result.current.cancel()).not.toThrow();
  });

  it('cancel() 뒤에 새로 시작한 요청은 정상적으로 최신이다', () => {
    const { result } = renderHook(() => useLatestRequest());
    result.current.begin();
    result.current.cancel();

    const next = result.current.begin();

    expect(next.isLatest()).toBe(true);
    expect(next.signal.aborted).toBe(false);
  });
});
