import { fetchAirspaceZonesAtPoint } from '@/features/airspace/api/fetchAirspaceZonesAtPoint';
import { isPointInMultiPolygon } from '@/features/airspace/utils/isPointInMultiPolygon';

import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';

type Settled = { status: 'fulfilled'; isInside: boolean } | { status: 'rejected'; reason: unknown };

// WMS 모드에서 클릭 지점이 속한 구역 종류(한글 라벨)를 찾는다. 없으면 null.
// typenames 순서가 곧 우선순위다(TYPENAME_ZONE_LABELS는 위험도 높은 순). 폴리곤 모드에서 가장 위에 그려진
// 폴리곤이 클릭을 받는 것과 같은 결과가 되도록, 응답이 도착한 순서가 아니라 이 순서로 고른다.
export const findZoneTypeAtPoint = async (
  point: { lat: number; lng: number },
  typenames: string[],
  signal?: AbortSignal,
): Promise<string | null> => {
  // 바깥 취소(새 클릭)와 안쪽 취소(결과가 확정돼 남은 요청이 필요 없어짐)를 하나의 신호로 합친다.
  const internal = new AbortController();
  const abortInternal = () => internal.abort();
  signal?.addEventListener('abort', abortInternal, { once: true });
  if (signal?.aborted) {
    internal.abort();
  }

  // 요청은 전부 동시에 시작하지만, 결과는 우선순위 순서로 하나씩 확인한다. 그러면 높은 우선순위가 확정되는
  // 즉시 끝낼 수 있어 가장 느린 응답(예: 큰 국립공원 지오메트리)을 기다리지 않는다.
  // 여기서 settle로 감싸 두는 이유: 일찍 반환한 뒤 남은 요청이 나중에 실패해도 처리되지 않은 거부가 되지 않게 한다.
  const settled: Promise<Settled>[] = typenames.map((typename) =>
    fetchAirspaceZonesAtPoint(typename, point, internal.signal).then(
      (collection): Settled => ({
        status: 'fulfilled',
        isInside: collection.features.some((feature) =>
          isPointInMultiPolygon(point, feature.geometry.coordinates),
        ),
      }),
      (reason): Settled => ({ status: 'rejected', reason }),
    ),
  );

  try {
    let firstFailure: Extract<Settled, { status: 'rejected' }> | undefined;

    for (const [index, pending] of settled.entries()) {
      const result = await pending;

      if (signal?.aborted) {
        throw signal.reason ?? new DOMException('Aborted', 'AbortError');
      }

      if (result.status === 'rejected') {
        firstFailure ??= result;
        continue;
      }

      if (result.isInside) {
        return TYPENAME_ZONE_LABELS[typenames[index]] ?? null;
      }
    }

    // 구역이 없다고 답하려면 실패한 요청이 없어야 한다. 실패를 "빈 땅"으로 보이게 하면 비행 가능으로 오해할 수 있다.
    if (firstFailure) {
      throw firstFailure.reason;
    }

    return null;
  } finally {
    // 결과가 확정됐거나 오류로 끝나면 아직 진행 중인 나머지 요청은 끊는다.
    internal.abort();
    signal?.removeEventListener('abort', abortInternal);
  }
};
