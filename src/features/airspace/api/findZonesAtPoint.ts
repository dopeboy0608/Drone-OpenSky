import { fetchAirspaceZonesAtPoint } from '@/features/airspace/api/fetchAirspaceZonesAtPoint';
import { isPointInMultiPolygon } from '@/features/airspace/utils/isPointInMultiPolygon';

import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';

type Settled = { status: 'fulfilled'; isInside: boolean } | { status: 'rejected'; reason: unknown };

// 바깥 취소(새 클릭)와 안쪽 취소(결과가 확정돼 남은 요청이 필요 없어짐)를 하나의 신호로 합친다.
const linkAbortSignals = (outer?: AbortSignal) => {
  const internal = new AbortController();
  const abortInternal = () => internal.abort();
  outer?.addEventListener('abort', abortInternal, { once: true });
  if (outer?.aborted) {
    internal.abort();
  }

  return {
    signal: internal.signal,
    abort: abortInternal,
    dispose: () => outer?.removeEventListener('abort', abortInternal),
  };
};

// 요청은 전부 동시에 시작한다. 여기서 settle로 감싸 두는 이유: 일찍 반환한 뒤 남은 요청이 나중에 실패해도
// 처리되지 않은 거부가 되지 않게 한다.
const startPointQueries = (
  point: { lat: number; lng: number },
  typenames: string[],
  signal: AbortSignal,
): Promise<Settled>[] =>
  typenames.map((typename) =>
    fetchAirspaceZonesAtPoint(typename, point, signal).then(
      (collection): Settled => ({
        status: 'fulfilled',
        isInside: collection.features.some((feature) =>
          isPointInMultiPolygon(point, feature.geometry.coordinates),
        ),
      }),
      (reason): Settled => ({ status: 'rejected', reason }),
    ),
  );

export interface ZonesAtPoint {
  // 우선순위 순서의 구역 종류(한글 라벨). 첫 항목이 최상위이고 나머지는 겹친 구역이다.
  zones: string[];
  // 일부 요청이 실패했다. 겹친 구역이 빠졌을 수 있다는 뜻이다.
  hasFailure: boolean;
}

interface FindZonesAtPointOptions {
  signal?: AbortSignal;
  // 구역이 하나 확정될 때마다 지금까지의 목록으로 호출한다. 최상위 구역을 나머지 응답을 기다리지 않고 먼저 보여 주기 위함이다.
  onProgress?: (zones: string[]) => void;
}

// 클릭 지점이 속한 모든 구역 종류(한글 라벨)를 우선순위 순서로 찾는다. 없으면 빈 목록.
// typenames 순서가 곧 우선순위다(TYPENAME_ZONE_LABELS는 위험도 높은 순). 응답이 도착한 순서가 아니라 이 순서로 확정한다.
export const findZonesAtPoint = async (
  point: { lat: number; lng: number },
  typenames: string[],
  { signal, onProgress }: FindZonesAtPointOptions = {},
): Promise<ZonesAtPoint> => {
  const linked = linkAbortSignals(signal);

  // 요청은 전부 동시에 시작하고, 결과는 우선순위 순서로 하나씩 확인한다. 높은 우선순위가 확정되는 즉시 onProgress로 알려
  // 가장 느린 응답(예: 큰 국립공원 지오메트리)을 기다리지 않고도 최상위 구역을 보여 줄 수 있다.
  const settled = startPointQueries(point, typenames, linked.signal);

  try {
    const zones: string[] = [];
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

      const label = TYPENAME_ZONE_LABELS[typenames[index]];

      if (result.isInside && label !== undefined) {
        zones.push(label);
        onProgress?.([...zones]);
      }
    }

    // 구역이 없다고 답하려면 실패한 요청이 없어야 한다. 실패를 "빈 땅"으로 보이게 하면 비행 가능으로 오해할 수 있다.
    // 하나라도 찾았다면 목록을 돌려주되 hasFailure로 겹친 구역이 빠졌을 수 있음을 알린다.
    if (zones.length === 0 && firstFailure) {
      throw firstFailure.reason;
    }

    return { zones, hasFailure: firstFailure !== undefined };
  } finally {
    // 끝났거나 오류·취소로 중단되면 아직 진행 중인 나머지 요청은 끊는다.
    linked.abort();
    linked.dispose();
  }
};
