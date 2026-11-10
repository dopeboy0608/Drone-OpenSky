import { useQueries } from '@tanstack/react-query';
import { App as AntdApp } from 'antd';
import { useEffect, useRef } from 'react';

import { fetchAirspaceZones } from '@/features/airspace/api/fetchAirspaceZones';
import { writeZoneCache } from '@/features/airspace/cache/airspaceCacheStore';
import {
  AIRSPACE_CACHE_ENABLED,
  AIRSPACE_ZONE_CONFIGS,
  AIRSPACE_ZONE_LABELS,
} from '@/features/airspace/constants';
import { getAirspaceZoneQueryKey } from '@/features/airspace/queries/airspaceZoneQueryKey';
import type { AirspaceZoneConfig, VWorldFeatureCollection } from '@/features/airspace/types';
import { formatLastUpdated } from '@/features/airspace/utils/formatLastUpdated';
import { resolveStaleTimeMs } from '@/features/airspace/utils/resolveStaleTimeMs';
import { tagFeatureZoneType } from '@/features/airspace/utils/tagFeatureZoneType';

const STALE_TIME_MS = resolveStaleTimeMs(import.meta.env.VITE_AIRSPACE_STALE_TIME_MS);
const ERROR_TOAST_DURATION_SECONDS = 3;
const INFO_TOAST_DURATION_SECONDS = 2;

interface AirspaceZoneQueryResult {
  config: AirspaceZoneConfig;
  data: VWorldFeatureCollection | undefined;
  isLoading: boolean;
  isError: boolean;
}

interface UseAirspaceZoneQueriesReturn {
  results: AirspaceZoneQueryResult[];
  refreshStaleZones: () => void;
}

const fetchZoneGroup = async (typenames: string[]): Promise<VWorldFeatureCollection> => {
  const collections = await Promise.all(
    typenames.map(async (typename) => {
      const collection = await fetchAirspaceZones(typename);
      return tagFeatureZoneType(collection.features, typename);
    }),
  );
  return {
    type: 'FeatureCollection',
    features: collections.flat(),
  };
};

export const useAirspaceZoneQueries = (): UseAirspaceZoneQueriesReturn => {
  const { message } = AntdApp.useApp();

  const results = useQueries({
    queries: AIRSPACE_ZONE_CONFIGS.map((config) => ({
      queryKey: getAirspaceZoneQueryKey(config),
      queryFn: async () => {
        const data = await fetchZoneGroup(config.typenames);
        // 저장은 다음 로드를 위한 부가 작업이라 기다리지 않는다(실패해도 writeZoneCache가 삼킨다).
        // 조회가 실패하면 여기까지 오지 않으므로 기존 캐시(만료 포함)가 그대로 남는다.
        if (AIRSPACE_CACHE_ENABLED) {
          void writeZoneCache(config.level, data);
        }
        return data;
      },
      // 캐시를 끄면 세션 동안 다시 받을 이유가 없어(수동 새로고침만 허용) 만료되지 않게 둔다. 0으로 두면 포커스마다 전국 데이터를 받는다.
      staleTime: AIRSPACE_CACHE_ENABLED ? STALE_TIME_MS : Infinity,
      // 포커스 복귀 재조회는 staleTime이 지난 그룹만 대상이라, 신선한 캐시를 쓰는 동안은 요청이 늘지 않는다 (이슈 #68, #37).
      refetchOnWindowFocus: AIRSPACE_CACHE_ENABLED,
      // 포커스 이벤트 없이 탭을 계속 보고 있어도 만료 주기마다 갱신한다. 백그라운드 탭에서는 멈춰 모바일 데이터를 아낀다.
      refetchInterval: AIRSPACE_CACHE_ENABLED ? STALE_TIME_MS : false,
      refetchIntervalInBackground: false,
    })),
  });

  // 구역(level)별로 같은 에러를 중복 토스트하지 않도록 마지막으로 안내한 에러 발생 시각을 기억한다.
  const toastedErrorAtRef = useRef<Partial<Record<AirspaceZoneConfig['level'], number>>>({});

  useEffect(() => {
    results.forEach((result, index) => {
      const config = AIRSPACE_ZONE_CONFIGS[index];

      if (result.isError && toastedErrorAtRef.current[config.level] !== result.errorUpdatedAt) {
        toastedErrorAtRef.current[config.level] = result.errorUpdatedAt;
        console.error(`[airspace] ${config.level} 구역 조회 실패`, result.error);
        message.error(
          `${AIRSPACE_ZONE_LABELS[config.level]} 구역 정보를 불러오지 못했습니다.`,
          ERROR_TOAST_DURATION_SECONDS,
        );
      }
    });
  });

  return {
    results: results.map((result, index) => ({
      config: AIRSPACE_ZONE_CONFIGS[index],
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
    })),
    // "공역 새로고침" 버튼용. 캐시를 끈 동안은 전부 다시 받는다.
    // 캐시를 켠 동안은 staleTime(24시간)이 지난 그룹만 개별적으로 재패칭하고, 모두 신선하면 네트워크 요청 없이
    // 안내 토스트만 띄운다 (이슈 #37, 모바일 데이터 절감). 이때 마지막 갱신 시각을 알려 눌러도 변화가 없는 이유를 보여 준다.
    refreshStaleZones: () => {
      if (!AIRSPACE_CACHE_ENABLED) {
        results.forEach((result) => {
          result.refetch();
        });
        return;
      }

      const staleResults = results.filter((result) => result.isStale);

      if (staleResults.length === 0) {
        // 가장 오래된 그룹 기준이다. "모두 최신"이 보장되는 가장 이른 시점이기 때문이다.
        const updatedAts = results.map((result) => result.dataUpdatedAt).filter((time) => time > 0);
        const lastUpdated =
          updatedAts.length > 0
            ? ` (마지막 갱신: ${formatLastUpdated(Math.min(...updatedAts))})`
            : '';
        message.info(`최신 상태입니다.${lastUpdated}`, INFO_TOAST_DURATION_SECONDS);
        return;
      }

      staleResults.forEach((result) => {
        result.refetch();
      });
    },
  };
};
