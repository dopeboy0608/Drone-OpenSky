import { vworldClient } from '@/api/vworldClient';
import { KOREA_BBOX } from '@/features/airspace/constants';
import type { VWorldFeatureCollection } from '@/features/airspace/types';

export const fetchAirspaceZones = async (typename: string): Promise<VWorldFeatureCollection> => {
  const response = await vworldClient.get<VWorldFeatureCollection>('/wfs', {
    params: {
      SERVICE: 'WFS',
      REQUEST: 'GetFeature',
      TYPENAME: typename,
      SRSNAME: 'EPSG:4326',
      OUTPUT: 'application/json',
      BBOX: KOREA_BBOX,
    },
  });

  return response.data;
};
