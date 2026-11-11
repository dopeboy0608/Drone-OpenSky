import type { Bounds } from '@/features/airspace/utils/tileToWcongBounds';

const VWORLD_WMS_URL = 'https://api.vworld.kr/req/wms';
// 카카오 Tileset의 타일 크기(AirspaceWmsLayer)와 같아야 한다. 다르면 서버가 그린 이미지가 타일 칸에 늘어나거나 줄어든다.
export const WMS_TILE_SIZE = 256;

interface BuildWmsTileUrlParams {
  bbox: Bounds;
  typenames: string[];
  key: string;
}

// 타일은 <img>가 직접 요청하므로 CORS가 필요 없지만, 키가 URL에 들어간다. 이 URL을 로그로 출력하지 않는다.
// STYLES를 LAYERS와 같게 두는 것은 국토부 원스톱의 요청 방식과 맞추기 위함이다(이슈 #28 실측).
export const buildWmsTileUrl = ({ bbox, typenames, key }: BuildWmsTileUrlParams): string => {
  const layers = typenames.join(',');
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetMap',
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
    WIDTH: String(WMS_TILE_SIZE),
    HEIGHT: String(WMS_TILE_SIZE),
    LAYERS: layers,
    STYLES: layers,
    CRS: 'EPSG:3857',
    BBOX: `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`,
    key,
  });

  return `${VWORLD_WMS_URL}?${params.toString()}`;
};
