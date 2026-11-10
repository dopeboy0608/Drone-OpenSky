import type { Bounds } from '@/features/airspace/utils/tileToWcongBounds';

const VWORLD_WMS_URL = 'https://api.vworld.kr/req/wms';
const TILE_SIZE = 256;

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
    WIDTH: String(TILE_SIZE),
    HEIGHT: String(TILE_SIZE),
    LAYERS: layers,
    STYLES: layers,
    CRS: 'EPSG:3857',
    BBOX: `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`,
    key,
  });

  return `${VWORLD_WMS_URL}?${params.toString()}`;
};
