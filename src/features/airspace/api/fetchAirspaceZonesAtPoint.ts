import { vworldClient } from '@/api/vworldClient';
import type { VWorldFeatureCollection } from '@/features/airspace/types';

// 클릭 오차를 흡수하면서도 응답이 작게 유지되는 크기(약 10m). 포함 여부는 응답 지오메트리로 다시 판정한다.
const POINT_BBOX_HALF_SIZE_DEG = 0.0001;

// 전국 BBOX 조회(fetchAirspaceZones)와 BBOX 축 순서(경도,위도)와 SRSNAME을 맞춘다.
export const fetchAirspaceZonesAtPoint = async (
  typename: string,
  { lat, lng }: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<VWorldFeatureCollection> => {
  const response = await vworldClient.get<VWorldFeatureCollection>('/wfs', {
    signal,
    params: {
      SERVICE: 'WFS',
      REQUEST: 'GetFeature',
      TYPENAME: typename,
      SRSNAME: 'EPSG:4326',
      OUTPUT: 'application/json',
      BBOX: [
        lng - POINT_BBOX_HALF_SIZE_DEG,
        lat - POINT_BBOX_HALF_SIZE_DEG,
        lng + POINT_BBOX_HALF_SIZE_DEG,
        lat + POINT_BBOX_HALF_SIZE_DEG,
      ].join(','),
    },
  });

  return response.data;
};
