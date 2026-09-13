type Position = number[];
type LinearRing = Position[];
type Polygon = LinearRing[];
type MultiPolygonCoordinates = Polygon[];

/**
 * VWorld GeoJSON `MultiPolygon.coordinates`([lng, lat] 순서)를 폴리곤 1개당
 * `kakao.maps.LatLng[]`(ring) 1개로, 폴리곤 전체는 `LatLng[][]`로 변환한다.
 * ring[0]은 외곽, ring[1] 이후는 홀이다.
 */
export const multiPolygonToKakaoPaths = (
  coordinates: MultiPolygonCoordinates,
): kakao.maps.LatLng[][][] =>
  coordinates.map((polygon) =>
    polygon.map((ring) => ring.map(([lng, lat]) => new kakao.maps.LatLng(lat, lng))),
  );
