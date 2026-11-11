import { requestAirspaceFeatures } from '@/features/airspace/api/requestAirspaceFeatures';

import type { VWorldFeatureCollection } from '@/features/airspace/types';

// 클릭 오차를 흡수하면서도 응답이 작게 유지되는 크기(약 10m). 포함 여부는 응답 지오메트리로 다시 판정한다.
const POINT_BBOX_HALF_SIZE_DEG = 0.0001;

export const fetchAirspaceZonesAtPoint = (
  typename: string,
  { lat, lng }: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<VWorldFeatureCollection> =>
  requestAirspaceFeatures(
    typename,
    [
      lng - POINT_BBOX_HALF_SIZE_DEG,
      lat - POINT_BBOX_HALF_SIZE_DEG,
      lng + POINT_BBOX_HALF_SIZE_DEG,
      lat + POINT_BBOX_HALF_SIZE_DEG,
    ].join(','),
    signal,
  );
