import { useQueries } from '@tanstack/react-query';
import { App as AntdApp } from 'antd';
import { useEffect, useRef } from 'react';

import { fetchAirspaceZones } from '@/features/airspace/api/fetchAirspaceZones';
import { AIRSPACE_ZONE_CONFIGS, AIRSPACE_ZONE_LABELS } from '@/features/airspace/constants';
import type { AirspaceZoneConfig, VWorldFeatureCollection } from '@/features/airspace/types';

const STALE_TIME_MS = 30 * 60 * 1000;
const ERROR_TOAST_DURATION_SECONDS = 3;

interface AirspaceZoneQueryResult {
  config: AirspaceZoneConfig;
  data: VWorldFeatureCollection | undefined;
  isLoading: boolean;
  isError: boolean;
}

const fetchZoneGroup = async (typenames: string[]): Promise<VWorldFeatureCollection> => {
  const collections = await Promise.all(typenames.map(fetchAirspaceZones));
  return {
    type: 'FeatureCollection',
    features: collections.flatMap((collection) => collection.features),
  };
};

export const useAirspaceZoneQueries = (): AirspaceZoneQueryResult[] => {
  const { message } = AntdApp.useApp();
  const toastedErrorAtRef = useRef<Partial<Record<AirspaceZoneConfig['level'], number>>>({});

  const results = useQueries({
    queries: AIRSPACE_ZONE_CONFIGS.map((config) => ({
      queryKey: ['airspaceZones', config.level, config.typenames],
      queryFn: () => fetchZoneGroup(config.typenames),
      staleTime: STALE_TIME_MS,
      refetchOnWindowFocus: false,
    })),
  });

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

  return results.map((result, index) => ({
    config: AIRSPACE_ZONE_CONFIGS[index],
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
  }));
};
