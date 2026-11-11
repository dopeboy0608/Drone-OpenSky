import { type UseQueryResult, useQueries } from '@tanstack/react-query';
import { App as AntdApp } from 'antd';
import { useEffect, useRef } from 'react';

import { fetchAirspaceZones } from '@/features/airspace/api/fetchAirspaceZones';
import { writeZoneCache } from '@/features/airspace/cache/airspaceCacheStore';
import { getAirspaceZoneQueryKey } from '@/features/airspace/queries/airspaceZoneQueryKey';
import { useAirspaceCacheSettingStore } from '@/features/airspace/store/airspaceCacheSettingStore';
import { formatLastUpdated } from '@/features/airspace/utils/formatLastUpdated';
import { resolveStaleTimeMs } from '@/features/airspace/utils/resolveStaleTimeMs';
import { tagFeatureZoneType } from '@/features/airspace/utils/tagFeatureZoneType';

import { AIRSPACE_ZONE_CONFIGS, AIRSPACE_ZONE_LABELS } from '@/features/airspace/constants';
import type { AirspaceZoneConfig, VWorldFeatureCollection } from '@/features/airspace/types';

const STALE_TIME_MS = resolveStaleTimeMs(import.meta.env.VITE_AIRSPACE_STALE_TIME_MS);
const ERROR_TOAST_DURATION_SECONDS = 3;
const INFO_TOAST_DURATION_SECONDS = 2;
const WMS_REFRESH_MESSAGE = 'WMS 모드에서는 타일을 자동으로 불러옵니다.';

// antd 내부 경로를 import하지 않고 공개 API(App.useApp)에서 타입을 얻는다.
type MessageApi = ReturnType<typeof AntdApp.useApp>['message'];

interface AirspaceZoneQueryResult {
  config: AirspaceZoneConfig;
  data: VWorldFeatureCollection | undefined;
  isLoading: boolean;
  isError: boolean;
}

interface UseAirspaceZoneQueriesOptions {
  // false면 조회하지 않는다(WMS 모드). 전국 폴리곤은 약 50MB라 쓰지 않는 모드에서는 받지 않는다.
  enabled?: boolean;
}

interface UseAirspaceZoneQueriesReturn {
  results: AirspaceZoneQueryResult[];
  refreshStaleZones: () => void;
}

interface CachePolicy {
  staleTime: number;
  refetchOnWindowFocus: boolean;
  refetchInterval: number | false;
}

// 캐시 켬/끔에 따라 함께 바뀌는 재조회 옵션을 한 곳에 모은다. 세 값이 서로 어긋나면(예: 만료는 없는데 주기 재조회만 켜짐)
// 전국 데이터를 의도치 않게 반복해서 받는다.
const getCachePolicy = (isCacheEnabled: boolean): CachePolicy =>
  isCacheEnabled
    ? {
        staleTime: STALE_TIME_MS,
        // 포커스 복귀 재조회는 staleTime이 지난 그룹만 대상이라, 신선한 캐시를 쓰는 동안은 요청이 늘지 않는다 (이슈 #68, #37).
        refetchOnWindowFocus: true,
        // 포커스 이벤트 없이 탭을 계속 보고 있어도 만료 주기마다 갱신한다. 백그라운드 탭에서는 멈춰 모바일 데이터를 아낀다.
        refetchInterval: STALE_TIME_MS,
      }
    : {
        // 캐시를 끄면 세션 동안 다시 받을 이유가 없어(수동 새로고침만 허용) 만료되지 않게 둔다. 0으로 두면 포커스마다 전국 데이터를 받는다.
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchInterval: false,
      };

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

// 가장 오래된 그룹 기준이다. "모두 최신"이 보장되는 가장 이른 시점이기 때문이다.
const formatFreshMessage = (dataUpdatedAts: number[]): string => {
  const updatedAts = dataUpdatedAts.filter((time) => time > 0);
  const lastUpdated =
    updatedAts.length > 0 ? ` (마지막 갱신: ${formatLastUpdated(Math.min(...updatedAts))})` : '';

  return `최신 상태입니다.${lastUpdated}`;
};

const useZoneErrorToasts = (
  results: UseQueryResult<VWorldFeatureCollection, Error>[],
  message: MessageApi,
) => {
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
};

export const useAirspaceZoneQueries = ({
  enabled = true,
}: UseAirspaceZoneQueriesOptions = {}): UseAirspaceZoneQueriesReturn => {
  const { message } = AntdApp.useApp();
  // 구독해 두면 설정을 바꾸는 즉시 아래 쿼리 옵션이 갱신된다(재시작 불필요).
  const isCacheEnabled = useAirspaceCacheSettingStore((state) => state.enabled);

  const results = useQueries({
    queries: AIRSPACE_ZONE_CONFIGS.map((config) => ({
      queryKey: getAirspaceZoneQueryKey(config),
      enabled,
      queryFn: async () => {
        const data = await fetchZoneGroup(config.typenames);
        // 저장은 다음 로드를 위한 부가 작업이라 기다리지 않는다(실패해도 writeZoneCache가 삼킨다).
        // 조회가 실패하면 여기까지 오지 않으므로 기존 캐시(만료 포함)가 그대로 남는다.
        if (isCacheEnabled) {
          void writeZoneCache(config.level, data);
        }
        return data;
      },
      ...getCachePolicy(isCacheEnabled),
      refetchIntervalInBackground: false,
    })),
  });

  useZoneErrorToasts(results, message);

  // "공역 새로고침" 버튼용. 캐시를 끈 동안은 전부 다시 받는다.
  // 캐시를 켠 동안은 staleTime(24시간)이 지난 그룹만 개별적으로 재패칭하고, 모두 신선하면 네트워크 요청 없이
  // 안내 토스트만 띄운다 (이슈 #37, 모바일 데이터 절감). 이때 마지막 갱신 시각을 알려 눌러도 변화가 없는 이유를 보여 준다.
  const refreshStaleZones = () => {
    // 비활성 쿼리도 refetch()를 직접 부르면 조회되므로(enabled는 자동 조회만 막는다) 여기서 먼저 막는다.
    if (!enabled) {
      message.info(WMS_REFRESH_MESSAGE, INFO_TOAST_DURATION_SECONDS);
      return;
    }

    if (!isCacheEnabled) {
      results.forEach((result) => {
        result.refetch();
      });
      return;
    }

    const staleResults = results.filter((result) => result.isStale);

    if (staleResults.length === 0) {
      message.info(
        formatFreshMessage(results.map((result) => result.dataUpdatedAt)),
        INFO_TOAST_DURATION_SECONDS,
      );
      return;
    }

    staleResults.forEach((result) => {
      result.refetch();
    });
  };

  return {
    results: results.map((result, index) => ({
      config: AIRSPACE_ZONE_CONFIGS[index],
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
    })),
    refreshStaleZones,
  };
};
