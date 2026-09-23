/**
 * ring(폴리곤 외곽 좌표 목록)을 구성하는 좌표들의 단순 평균 좌표를 반환한다.
 * 라벨을 그릴 대표 위치 계산용으로, 기하학적으로 정밀한 centroid는 필요하지 않다.
 */
export const polygonCentroid = (ring: kakao.maps.LatLng[]): { lat: number; lng: number } => {
  const sum = ring.reduce(
    (acc, point) => ({ lat: acc.lat + point.getLat(), lng: acc.lng + point.getLng() }),
    { lat: 0, lng: 0 },
  );

  return { lat: sum.lat / ring.length, lng: sum.lng / ring.length };
};
