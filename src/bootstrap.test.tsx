import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bootstrap } from '@/bootstrap';
import { queryClient } from '@/api/queryClient';
import { hydrateAirspaceCache } from '@/features/airspace/cache/hydrateAirspaceCache';
import { useAirspaceCacheSettingStore } from '@/features/airspace/store/airspaceCacheSettingStore';

const { render, createRoot } = vi.hoisted(() => {
  const render = vi.fn();
  return { render, createRoot: vi.fn(() => ({ render })) };
});

vi.mock('react-dom/client', () => ({ createRoot }));
vi.mock('@/App', () => ({ default: () => null }));
vi.mock('@/features/airspace/cache/hydrateAirspaceCache');

const rootEl = {} as HTMLElement;

describe('bootstrap', () => {
  beforeEach(() => {
    render.mockClear();
    createRoot.mockClear();
    vi.mocked(hydrateAirspaceCache).mockReset();
  });

  it('주어진 루트 요소에 React 루트를 만든다', () => {
    useAirspaceCacheSettingStore.setState({ enabled: false });

    bootstrap(rootEl);

    expect(createRoot).toHaveBeenCalledWith(rootEl);
  });

  it('캐시가 꺼져 있으면 하이드레이션하지 않고 StrictMode로 렌더한다', async () => {
    useAirspaceCacheSettingStore.setState({ enabled: false });

    bootstrap(rootEl);

    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    expect(hydrateAirspaceCache).not.toHaveBeenCalled();
    expect(render.mock.calls[0][0].type).toBe(StrictMode);
  });

  // 캐시를 먼저 채워야 useQueries가 마운트될 때 신선한 데이터를 보고 네트워크 요청을 건너뛴다.
  it('캐시가 켜져 있으면 하이드레이션이 끝난 뒤에 렌더한다', async () => {
    useAirspaceCacheSettingStore.setState({ enabled: true });
    let finishHydration: () => void = () => {};
    vi.mocked(hydrateAirspaceCache).mockReturnValue(
      new Promise<void>((resolve) => {
        finishHydration = resolve;
      }),
    );

    bootstrap(rootEl);
    await Promise.resolve();

    expect(hydrateAirspaceCache).toHaveBeenCalledWith(queryClient);
    expect(render).not.toHaveBeenCalled();

    finishHydration();

    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));
  });
});
