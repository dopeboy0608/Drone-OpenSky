import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AirspaceCacheMenu } from '@/features/airspace/components/AirspaceCacheMenu';
import { useAirspaceCacheSettingStore } from '@/features/airspace/store/airspaceCacheSettingStore';

// antd Popover/Switch가 크기 변화를 감시하는데 jsdom에는 ResizeObserver가 없다.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('AirspaceCacheMenu', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    useAirspaceCacheSettingStore.setState({ enabled: false });
  });

  afterEach(() => {
    // globals 설정이 꺼져 있어 자동 정리가 되지 않으므로, Popover가 body에 남아 다음 테스트와 섞이지 않게 직접 정리한다.
    cleanup();
    vi.unstubAllGlobals();
  });

  it('버튼을 누르면 꺼짐 상태의 스위치와 설명이 보인다', async () => {
    render(<AirspaceCacheMenu />);

    fireEvent.click(screen.getByRole('button', { name: '공역 캐시' }));

    expect(await screen.findByRole('switch', { name: '공역 캐시 사용' })).toHaveProperty(
      'ariaChecked',
      'false',
    );
    expect(screen.getByText('열 때마다 새로 받고, 새로고침은 전체를 다시 받습니다.')).toBeDefined();
  });

  it('스위치를 켜면 설정 스토어가 켜짐이 되고 설명이 바뀐다', async () => {
    render(<AirspaceCacheMenu />);
    fireEvent.click(screen.getByRole('button', { name: '공역 캐시' }));

    fireEvent.click(await screen.findByRole('switch', { name: '공역 캐시 사용' }));

    expect(useAirspaceCacheSettingStore.getState().enabled).toBe(true);
    expect(
      await screen.findByText(
        '24시간 안에는 저장된 데이터를 쓰고, 새로고침은 만료된 구역만 다시 받습니다.',
      ),
    ).toBeDefined();
  });
});
