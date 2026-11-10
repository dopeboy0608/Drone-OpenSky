import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import { IDBFactory } from 'fake-indexeddb';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { readZoneCache } from '@/features/airspace/cache/airspaceCacheStore';
import { useAirspaceCacheSettingStore } from '@/features/airspace/store/airspaceCacheSettingStore';
import { useAirspaceZoneQueries } from '@/features/airspace/queries/useAirspaceZoneQueries';
import { server } from '@/test/mocks/server';

const WFS_URL = 'https://server-eosin-five-92.vercel.app/api/vworld-api/wfs';

const renderQueries = () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AntdApp>{children}</AntdApp>
    </QueryClientProvider>
  );
  return renderHook(() => useAirspaceZoneQueries(), { wrapper });
};

// 이슈 #68: 캐시를 끈 기본 상태.
describe('useAirspaceZoneQueries (캐시 비활성)', () => {
  let requestCount = 0;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    useAirspaceCacheSettingStore.setState({ enabled: false });
    requestCount = 0;
    server.use(
      http.get(WFS_URL, () => {
        requestCount += 1;
        return HttpResponse.json({ type: 'FeatureCollection', features: [] });
      }),
    );
  });

  it('조회 결과를 IndexedDB에 저장하지 않는다', async () => {
    const { result } = renderQueries();

    await waitFor(() => {
      expect(result.current.results.every((zone) => zone.data !== undefined)).toBe(true);
    });

    expect(await readZoneCache('prohibited')).toBeNull();
  });

  it('새로고침 버튼은 신선해 보여도 모든 그룹을 다시 조회한다', async () => {
    const { result } = renderQueries();
    await waitFor(() => {
      expect(result.current.results.every((zone) => zone.data !== undefined)).toBe(true);
    });
    const initialCount = requestCount;

    act(() => result.current.refreshStaleZones());

    await waitFor(() => expect(requestCount).toBeGreaterThan(initialCount));
  });

  it('런타임에 캐시를 켜면 이후 조회 결과를 저장하고, 새로고침은 신선한 그룹을 건너뛴다', async () => {
    const { result } = renderQueries();
    await waitFor(() => {
      expect(result.current.results.every((zone) => zone.data !== undefined)).toBe(true);
    });
    const countBeforeToggle = requestCount;

    act(() => useAirspaceCacheSettingStore.getState().setEnabled(true));
    act(() => result.current.refreshStaleZones());

    // 켠 직후의 데이터는 방금 받은 것이라 신선하므로 재조회 없이 안내만 나간다.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requestCount).toBe(countBeforeToggle);
  });
});
