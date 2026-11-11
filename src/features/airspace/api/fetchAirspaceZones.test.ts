import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { fetchAirspaceZones } from '@/features/airspace/api/fetchAirspaceZones';
import { fetchAirspaceZonesAtPoint } from '@/features/airspace/api/fetchAirspaceZonesAtPoint';
import { server } from '@/test/mocks/server';

import { KOREA_BBOX } from '@/features/airspace/constants';

const WFS_URL = 'https://server-eosin-five-92.vercel.app/api/vworld-api/wfs';
const EMPTY = { type: 'FeatureCollection', features: [] };

const captureParams = () => {
  const captured: { params?: Record<string, string> } = {};
  server.use(
    http.get(WFS_URL, ({ request }) => {
      captured.params = Object.fromEntries(new URL(request.url).searchParams);
      return HttpResponse.json(EMPTY);
    }),
  );
  return captured;
};

// 특성 테스트(이슈 #51 P4): 두 조회 함수가 공유하는 WFS 요청 형태를 리팩터링 전후로 고정한다.
describe('WFS 요청 파라미터', () => {
  it('fetchAirspaceZones는 전국 BBOX로 해당 typename을 GeoJSON으로 요청한다', async () => {
    const captured = captureParams();

    const result = await fetchAirspaceZones('lt_c_aisprhc');

    expect(captured.params).toEqual({
      SERVICE: 'WFS',
      REQUEST: 'GetFeature',
      TYPENAME: 'lt_c_aisprhc',
      SRSNAME: 'EPSG:4326',
      OUTPUT: 'application/json',
      BBOX: KOREA_BBOX,
    });
    expect(result).toEqual(EMPTY);
  });

  it('fetchAirspaceZonesAtPoint는 같은 파라미터에 BBOX만 클릭 지점 주변으로 바꾼다', async () => {
    const captured = captureParams();

    await fetchAirspaceZonesAtPoint('lt_c_aisctrc', { lat: 5, lng: 5 });

    expect(captured.params).toEqual({
      SERVICE: 'WFS',
      REQUEST: 'GetFeature',
      TYPENAME: 'lt_c_aisctrc',
      SRSNAME: 'EPSG:4326',
      OUTPUT: 'application/json',
      BBOX: '4.9999,4.9999,5.0001,5.0001',
    });
  });

  it('fetchAirspaceZonesAtPoint는 AbortSignal을 요청에 전달한다', async () => {
    server.use(
      http.get(WFS_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(EMPTY);
      }),
    );
    const controller = new AbortController();

    const pending = fetchAirspaceZonesAtPoint(
      'lt_c_aisprhc',
      { lat: 5, lng: 5 },
      controller.signal,
    );
    controller.abort();

    await expect(pending).rejects.toThrow();
  });
});
