import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAddressAtPosition } from '@/features/map/hooks/useAddressAtPosition';
import {
  installKakaoMapsMock,
  kakaoServicesMock,
  uninstallKakaoMapsMock,
} from '@/test/mocks/kakaoMaps';

const A = { lat: 37.1, lng: 127.1 };
const B = { lat: 37.2, lng: 127.2 };

describe('useAddressAtPosition', () => {
  beforeEach(() => {
    installKakaoMapsMock();
  });

  afterEach(() => {
    uninstallKakaoMapsMock();
  });

  it('위치가 없으면 idle이다', () => {
    const { result } = renderHook(() => useAddressAtPosition(null));

    expect(result.current).toEqual({ status: 'idle' });
  });

  it('조회가 끝나면 주소를 준다', async () => {
    kakaoServicesMock.coord2AddressResponse = {
      status: 'OK',
      result: [{ address: { address_name: '지번' }, road_address: { address_name: '도로명' } }],
    };
    const { result } = renderHook(() => useAddressAtPosition(A));

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'success',
        address: { primary: '도로명', secondary: '지번' },
      }),
    );
  });

  it('주소를 찾지 못하면 notFound다', async () => {
    const { result } = renderHook(() => useAddressAtPosition(A));

    await waitFor(() => expect(result.current).toEqual({ status: 'notFound' }));
  });

  it('조회가 실패하면 error다 (구역 안내와는 독립)', async () => {
    kakaoServicesMock.coord2AddressResponse = { status: 'ERROR', result: [] };
    const { result } = renderHook(() => useAddressAtPosition(A));

    await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
  });

  it('위치가 바뀌면 이전 응답이 아니라 새 위치의 결과를 반영한다', async () => {
    kakaoServicesMock.coord2AddressResponse = {
      status: 'OK',
      result: [{ address: { address_name: 'A 주소' }, road_address: null }],
    };
    const { result, rerender } = renderHook(({ p }) => useAddressAtPosition(p), {
      initialProps: { p: A as { lat: number; lng: number } | null },
    });
    await waitFor(() => expect(result.current.status).toBe('success'));

    kakaoServicesMock.coord2AddressResponse = {
      status: 'OK',
      result: [{ address: { address_name: 'B 주소' }, road_address: null }],
    };
    await act(async () => rerender({ p: B }));

    await waitFor(() =>
      expect(result.current).toEqual({ status: 'success', address: { primary: 'B 주소' } }),
    );
  });
});
