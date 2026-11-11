import { requestAirspaceFeatures } from '@/features/airspace/api/requestAirspaceFeatures';

import { KOREA_BBOX } from '@/features/airspace/constants';
import type { VWorldFeatureCollection } from '@/features/airspace/types';

export const fetchAirspaceZones = (typename: string): Promise<VWorldFeatureCollection> =>
  requestAirspaceFeatures(typename, KOREA_BBOX);
