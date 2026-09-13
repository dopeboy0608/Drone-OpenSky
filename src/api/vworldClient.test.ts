import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/mocks/server';

import { vworldClient } from './vworldClient';

const WFS_URL = 'https://api.vworld.kr/req/wfs';

describe('vworldClient', () => {
  it('정상 GeoJSON 응답을 그대로 반환한다', async () => {
    server.use(
      http.get(WFS_URL, () => HttpResponse.json({ type: 'FeatureCollection', features: [] })),
    );

    const response = await vworldClient.get('/wfs');

    expect(response.data).toEqual({ type: 'FeatureCollection', features: [] });
  });

  it('HTTP 200 + XML ServiceExceptionReport 응답을 에러로 처리한다', async () => {
    server.use(
      http.get(WFS_URL, () =>
        HttpResponse.text('<ServiceExceptionReport>INCORRECT_KEY</ServiceExceptionReport>'),
      ),
    );

    await expect(vworldClient.get('/wfs')).rejects.toThrow('[vworldClient] VWorld API 응답 오류');
  });

  it('HTTP 200 + JSON status: ERROR 응답을 에러로 처리한다', async () => {
    server.use(http.get(WFS_URL, () => HttpResponse.json({ response: { status: 'ERROR' } })));

    await expect(vworldClient.get('/wfs')).rejects.toThrow('[vworldClient] VWorld API 응답 오류');
  });

  it('네트워크 에러를 그대로 전파한다', async () => {
    server.use(http.get(WFS_URL, () => HttpResponse.error()));

    await expect(vworldClient.get('/wfs')).rejects.toThrow();
  });
});
