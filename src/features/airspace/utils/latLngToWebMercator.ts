// EPSG:3857 구 반지름. VWorld WMS가 요청받는 CRS와 같은 값이어야 BBOX가 어긋나지 않는다.
const EARTH_RADIUS = 6378137;

export const latLngToWebMercator = (lat: number, lng: number): { x: number; y: number } => ({
  x: EARTH_RADIUS * ((lng * Math.PI) / 180),
  y: EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
});
