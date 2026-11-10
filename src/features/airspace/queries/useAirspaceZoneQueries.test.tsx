import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import { IDBFactory } from 'fake-indexeddb';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readZoneCache, writeZoneCache } from '@/features/airspace/cache/airspaceCacheStore';
import { hydrateAirspaceCache } from '@/features/airspace/cache/hydrateAirspaceCache';
import { useAirspaceZoneQueries } from '@/features/airspace/queries/useAirspaceZoneQueries';
import { server } from '@/test/mocks/server';

// 캐시 비활성(기본값) 상태에서도 캐시 동작을 검증할 수 있도록 이 파일에서만 플래그를 켠다.
vi.mock('@/features/airspace/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/airspace/constants')>()),
  AIRSPACE_CACHE_ENABLED: true,
}));

const WFS_URL = 'https://server-eosin-five-92.vercel.app/api/vworld-api/wfs';
const HOUR_MS = 60 * 60 * 1000;

const makeFeatureCollection = () => ({
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      geometry: { type: 'MultiPolygon' as const, coordinates: [] },
      properties: {},
      zoneType: '캐시',
    },
  ],
});

const renderQueries = (queryClient: QueryClient) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AntdApp>{children}</AntdApp>
    </QueryClientProvider>
  );
  return renderHook(() => useAirspaceZoneQueries(), { wrapper });
};

describe('useAirspaceZoneQueries + IndexedDB 캐시', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('모든 그룹의 캐시가 24시간 이내면 네트워크 요청 없이 캐시 데이터를 쓴다', async () => {
    let requestCount = 0;
    server.use(
      http.get(WFS_URL, () => {
        requestCount += 1;
        return HttpResponse.json({ type: 'FeatureCollection', features: [] });
      }),
    );
    for (const level of ['prohibited', 'restricted', 'available'] as const) {
      await writeZoneCache(level, makeFeatureCollection(), Date.now() - HOUR_MS);
    }
    const queryClient = new QueryClient();
    await hydrateAirspaceCache(queryClient);

    const { result } = renderQueries(queryClient);

    await waitFor(() => {
      expect(result.current.results.every((zone) => zone.data !== undefined)).toBe(true);
    });
    expect(requestCount).toBe(0);
  });

  it('만료된 그룹은 캐시 데이터를 먼저 보여주고 재조회한다', async () => {
    let requestCount = 0;
    server.use(
      http.get(WFS_URL, () => {
        requestCount += 1;
        return HttpResponse.json({ type: 'FeatureCollection', features: [] });
      }),
    );
    await writeZoneCache('prohibited', makeFeatureCollection(), Date.now() - 25 * HOUR_MS);
    const queryClient = new QueryClient();
    await hydrateAirspaceCache(queryClient);

    const { result } = renderQueries(queryClient);

    // 재조회가 끝나기 전에도 캐시된 데이터가 있어 로딩 상태가 아니다.
    expect(result.current.results[0].data).toBeDefined();
    expect(result.current.results[0].isLoading).toBe(false);
    await waitFor(() => expect(requestCount).toBeGreaterThan(0));
  });

  // 이슈 #68: 탭을 열어 둔 채 만료 시간이 지나도 갱신 경로가 없던 문제.
  describe('열어 둔 탭의 포커스 복귀', () => {
    const mountWithFreshCache = async () => {
      let requestCount = 0;
      server.use(
        http.get(WFS_URL, () => {
          requestCount += 1;
          return HttpResponse.json({ type: 'FeatureCollection', features: [] });
        }),
      );
      for (const level of ['prohibited', 'restricted', 'available'] as const) {
        await writeZoneCache(level, makeFeatureCollection(), Date.now() - HOUR_MS);
      }
      const queryClient = new QueryClient();
      await hydrateAirspaceCache(queryClient);
      renderQueries(queryClient);
      return { getRequestCount: () => requestCount };
    };
    const returnToTab = () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    };

    afterEach(() => {
      vi.useRealTimers();
      focusManager.setFocused(undefined);
    });

    it('만료 시간이 지난 뒤 탭으로 돌아오면 재조회한다', async () => {
      const { getRequestCount } = await mountWithFreshCache();
      expect(getRequestCount()).toBe(0);

      // Date만 앞당겨 24시간 경과를 흉내 낸다(타이머는 진짜를 써서 MSW 응답이 막히지 않게 한다).
      vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 25 * HOUR_MS });
      returnToTab();

      await waitFor(() => expect(getRequestCount()).toBeGreaterThan(0));
    });

    it('아직 신선하면 탭으로 돌아와도 재조회하지 않는다', async () => {
      const { getRequestCount } = await mountWithFreshCache();

      returnToTab();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(getRequestCount()).toBe(0);
    });
  });

  describe('새로고침 버튼 안내', () => {
    it('모두 최신이면 요청 없이 마지막 갱신 시각과 함께 안내한다', async () => {
      let requestCount = 0;
      server.use(
        http.get(WFS_URL, () => {
          requestCount += 1;
          return HttpResponse.json({ type: 'FeatureCollection', features: [] });
        }),
      );
      const savedAt = new Date(2026, 10, 10, 14, 5).getTime();
      vi.useFakeTimers({ toFake: ['Date'], now: savedAt + HOUR_MS });
      for (const level of ['prohibited', 'restricted', 'available'] as const) {
        await writeZoneCache(level, makeFeatureCollection(), savedAt);
      }
      const queryClient = new QueryClient();
      await hydrateAirspaceCache(queryClient);
      const { result } = renderQueries(queryClient);

      act(() => result.current.refreshStaleZones());

      expect(await screen.findByText('최신 상태입니다. (마지막 갱신: 14:05)')).toBeDefined();
      expect(requestCount).toBe(0);
    });
  });

  describe('조회 성공 시 저장', () => {
    const useWfsHandler = (respond: () => Response) => {
      server.use(http.get(WFS_URL, () => respond()));
    };
    const featureResponse = () => HttpResponse.json(makeFeatureCollection());
    const allLevels = ['prohibited', 'restricted', 'available'] as const;

    it('그룹 조회에 성공하면 결과를 IndexedDB에 저장한다', async () => {
      useWfsHandler(featureResponse);
      const queryClient = new QueryClient();
      const { result } = renderQueries(queryClient);

      await waitFor(() => {
        expect(result.current.results.every((zone) => zone.data !== undefined)).toBe(true);
      });

      for (const level of allLevels) {
        const zone = result.current.results.find((item) => item.config.level === level);
        await waitFor(async () => {
          expect((await readZoneCache(level))?.data).toEqual(zone?.data);
        });
      }
    });

    it('만료 캐시를 재조회하면 savedAt을 새 값으로 갱신한다', async () => {
      useWfsHandler(featureResponse);
      const expiredAt = Date.now() - 25 * HOUR_MS;
      await writeZoneCache('prohibited', makeFeatureCollection(), expiredAt);
      const queryClient = new QueryClient();
      await hydrateAirspaceCache(queryClient);
      const before = Date.now();

      renderQueries(queryClient);

      await waitFor(async () => {
        expect((await readZoneCache('prohibited'))?.savedAt).toBeGreaterThanOrEqual(before);
      });
    });

    it('조회에 실패하면 저장하지 않아 기존 캐시가 그대로 남고 화면은 기존 데이터를 쓴다', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(http.get(WFS_URL, () => HttpResponse.json({}, { status: 500 })));
      const expiredAt = Date.now() - 25 * HOUR_MS;
      await writeZoneCache('prohibited', makeFeatureCollection(), expiredAt);
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      await hydrateAirspaceCache(queryClient);

      const { result } = renderQueries(queryClient);

      await waitFor(() => expect(result.current.results[0].isError).toBe(true));
      expect((await readZoneCache('prohibited'))?.savedAt).toBe(expiredAt);
      expect(result.current.results[0].data).toBeDefined();
    });

    it('IndexedDB를 쓸 수 없어도 조회 결과는 정상 표시된다', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.stubGlobal('indexedDB', undefined);
      useWfsHandler(featureResponse);
      const { result } = renderQueries(new QueryClient());

      await waitFor(() => {
        expect(result.current.results.every((zone) => zone.data !== undefined)).toBe(true);
      });
      expect(result.current.results.some((zone) => zone.isError)).toBe(false);

      vi.unstubAllGlobals();
    });
  });

  describe('만료 캐시 재조회 실패', () => {
    it('에러 토스트를 한 번 보여주고, 저장된 데이터는 계속 쓴다', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(http.get(WFS_URL, () => HttpResponse.json({}, { status: 500 })));
      await writeZoneCache('prohibited', makeFeatureCollection(), Date.now() - 25 * HOUR_MS);
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      await hydrateAirspaceCache(queryClient);

      const { result, rerender } = renderQueries(queryClient);

      await screen.findAllByText('비행 금지 구역 정보를 불러오지 못했습니다.');
      rerender();
      // antd 토스트 DOM은 앞선 테스트 것이 body에 남아 개수를 셀 수 없어, 토스트와 함께 남기는 로그로 중복 여부를 본다.
      const prohibitedFailureLogs = consoleError.mock.calls.filter(
        ([message]) => message === '[airspace] prohibited 구역 조회 실패',
      );
      expect(prohibitedFailureLogs).toHaveLength(1);
      expect(result.current.results[0].data).toBeDefined();
      expect(result.current.results[0].isLoading).toBe(false);
    });
  });
});
