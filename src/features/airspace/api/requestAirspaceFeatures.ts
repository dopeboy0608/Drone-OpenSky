import { vworldClient } from '@/api/vworldClient';

import type { VWorldFeatureCollection } from '@/features/airspace/types';

// 전국 조회와 클릭 지점 조회가 같은 WFS 요청 형태를 쓴다. BBOX 축 순서(경도,위도)와 SRSNAME을 한 곳에서 맞춰,
// 한쪽만 바뀌어 두 조회의 좌표 해석이 어긋나지 않게 한다.
export const requestAirspaceFeatures = async (
  typename: string,
  bbox: string,
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
      BBOX: bbox,
    },
  });

  return response.data;
};
