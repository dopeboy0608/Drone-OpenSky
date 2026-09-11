export interface LatLng {
  lat: number;
  lng: number;
}

type Ring = number[][];

const ringToLatLng = (ring: Ring): LatLng[] => ring.map(([lng, lat]) => ({ lat, lng }));

/** GeoJSON Polygon/MultiPolygon geometry를 Kakao Map Polygon `path`용 링 배열로 변환한다. */
export const geometryToPaths = (geometry: {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}): LatLng[][][] => {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as Ring[];
    return [rings.map(ringToLatLng)];
  }

  const polygons = geometry.coordinates as Ring[][];
  return polygons.map((rings) => rings.map(ringToLatLng));
};
