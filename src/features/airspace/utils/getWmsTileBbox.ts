import { latLngToWebMercator } from '@/features/airspace/utils/latLngToWebMercator';
import { type Bounds, tileToWcongBounds } from '@/features/airspace/utils/tileToWcongBounds';

// VWorld는 WCONGNAMUL 좌표를 그대로 받지 못한다(5181과 값이 달라 타일이 전부 투명해진다, 이슈 #28).
// 그래서 네 모서리를 위경도로 바꿔 3857 외접 사각형으로 요청한다. 줌이 클수록 외접 오차가 커지는 점은 #76에서 점검한다.
export const getWmsTileBbox = (x: number, y: number, z: number): Bounds => {
  const { minX, minY, maxX, maxY } = tileToWcongBounds(x, y, z);
  const corners = [
    [minX, minY],
    [maxX, minY],
    [minX, maxY],
    [maxX, maxY],
  ].map(([cornerX, cornerY]) => {
    const latLng = new kakao.maps.Coords(cornerX, cornerY).toLatLng();
    return latLngToWebMercator(latLng.getLat(), latLng.getLng());
  });

  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
};
