import { describe, expect, it } from 'vitest';

import { WMS_TILE_SIZE, buildWmsTileUrl } from '@/features/airspace/utils/buildWmsTileUrl';

const bbox = { minX: 1, minY: 2, maxX: 3, maxY: 4 };

describe('buildWmsTileUrl', () => {
  it('VWorld WMS GetMap 고정 파라미터를 채운다', () => {
    const url = new URL(buildWmsTileUrl({ bbox, typenames: ['a'], key: 'K' }));

    expect(`${url.origin}${url.pathname}`).toBe('https://api.vworld.kr/req/wms');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetMap',
      FORMAT: 'image/png',
      TRANSPARENT: 'true',
      WIDTH: '256',
      HEIGHT: '256',
      CRS: 'EPSG:3857',
      key: 'K',
    });
  });

  it('WIDTH와 HEIGHT는 공유 상수 WMS_TILE_SIZE와 같다 (카카오 Tileset 크기와 어긋나지 않게)', () => {
    const url = new URL(buildWmsTileUrl({ bbox, typenames: ['a'], key: 'K' }));

    expect(url.searchParams.get('WIDTH')).toBe(String(WMS_TILE_SIZE));
    expect(url.searchParams.get('HEIGHT')).toBe(String(WMS_TILE_SIZE));
  });

  it('LAYERS와 STYLES에 같은 typename 목록을 쉼표로 이어 넣는다', () => {
    const url = new URL(
      buildWmsTileUrl({ bbox, typenames: ['lt_c_aisprhc', 'lt_c_aisctrc'], key: 'K' }),
    );

    expect(url.searchParams.get('LAYERS')).toBe('lt_c_aisprhc,lt_c_aisctrc');
    expect(url.searchParams.get('STYLES')).toBe('lt_c_aisprhc,lt_c_aisctrc');
  });

  it('BBOX는 minX,minY,maxX,maxY 순서다(EPSG:3857은 x,y 축 순서)', () => {
    const url = new URL(buildWmsTileUrl({ bbox, typenames: ['a'], key: 'K' }));

    expect(url.searchParams.get('BBOX')).toBe('1,2,3,4');
  });
});
