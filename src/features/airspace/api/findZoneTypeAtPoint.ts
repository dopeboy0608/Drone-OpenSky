import { fetchAirspaceZonesAtPoint } from '@/features/airspace/api/fetchAirspaceZonesAtPoint';
import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';
import { isPointInMultiPolygon } from '@/features/airspace/utils/isPointInMultiPolygon';

// WMS 모드에서 클릭 지점이 속한 구역 종류(한글 라벨)를 찾는다. 없으면 null.
// typenames 순서가 곧 우선순위다(TYPENAME_ZONE_LABELS는 위험도 높은 순). 폴리곤 모드에서 가장 위에 그려진
// 폴리곤이 클릭을 받는 것과 같은 결과가 되도록, 응답이 도착한 순서가 아니라 이 순서로 고른다.
export const findZoneTypeAtPoint = async (
  point: { lat: number; lng: number },
  typenames: string[],
): Promise<string | null> => {
  // allSettled를 쓰는 이유: 12개 중 하나가 실패했다고 다른 요청에서 찾은 구역까지 버리면 안 된다.
  const settled = await Promise.allSettled(
    typenames.map((typename) => fetchAirspaceZonesAtPoint(typename, point)),
  );

  for (const [index, result] of settled.entries()) {
    if (result.status !== 'fulfilled') {
      continue;
    }

    const isInside = result.value.features.some((feature) =>
      isPointInMultiPolygon(point, feature.geometry.coordinates),
    );

    if (isInside) {
      return TYPENAME_ZONE_LABELS[typenames[index]] ?? null;
    }
  }

  // 구역이 없다고 답하려면 실패한 요청이 없어야 한다. 실패를 "빈 땅"으로 보이게 하면 비행 가능으로 오해할 수 있다.
  const firstFailure = settled.find((result) => result.status === 'rejected');
  if (firstFailure?.status === 'rejected') {
    throw firstFailure.reason;
  }

  return null;
};
