type Ring = number[][];

// 짝홀 규칙(ray casting). GeoJSON 좌표는 [lng, lat]이라 lng를 x, lat을 y로 놓는다.
const isPointInRing = ({ lat, lng }: { lat: number; lng: number }, ring: Ring): boolean => {
  let inside = false;

  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [currentX, currentY] = ring[current];
    const [previousX, previousY] = ring[previous];
    const crossesRay = currentY > lat !== previousY > lat;

    if (
      crossesRay &&
      lng < ((previousX - currentX) * (lat - currentY)) / (previousY - currentY) + currentX
    ) {
      inside = !inside;
    }
  }

  return inside;
};

// 첫 ring이 바깥 경계, 나머지가 홀이다. 국립공원처럼 홀이 있는 구역은 홀 안쪽을 제외해야 한다.
export const isPointInMultiPolygon = (
  point: { lat: number; lng: number },
  multiPolygon: number[][][][],
): boolean =>
  multiPolygon.some(([outerRing, ...holes]) => {
    if (!outerRing || !isPointInRing(point, outerRing)) {
      return false;
    }

    return !holes.some((hole) => isPointInRing(point, hole));
  });
