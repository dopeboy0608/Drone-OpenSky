import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAirspaceZonesAtPoint } from '@/features/airspace/api/fetchAirspaceZonesAtPoint';
import { findZoneTypeAtPoint } from '@/features/airspace/api/findZoneTypeAtPoint';
import type { VWorldFeatureCollection } from '@/features/airspace/types';

// MSW(node)는 axios가 요청을 끊어도 request.signal의 abort를 전달하지 않아 취소를 관찰할 수 없다.
// 그래서 요청 함수를 모킹해 넘겨받은 AbortSignal을 직접 확인한다.
vi.mock('@/features/airspace/api/fetchAirspaceZonesAtPoint');

const POINT = { lat: 5, lng: 5 };
const containing: VWorldFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ],
          ],
        ],
      },
    },
  ],
};
const empty: VWorldFeatureCollection = { type: 'FeatureCollection', features: [] };

const signalOf = (callIndex: number) =>
  vi.mocked(fetchAirspaceZonesAtPoint).mock.calls[callIndex][2] as AbortSignal;
const neverResolves = () => new Promise<VWorldFeatureCollection>(() => {});

describe('findZoneTypeAtPoint 요청 취소', () => {
  beforeEach(() => {
    vi.mocked(fetchAirspaceZonesAtPoint).mockReset();
  });

  it('우선순위가 높은 구역이 확정되면 아직 진행 중인 낮은 우선순위 요청을 끊는다', async () => {
    vi.mocked(fetchAirspaceZonesAtPoint)
      .mockResolvedValueOnce(containing)
      .mockImplementationOnce(neverResolves);

    const result = await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc']);

    expect(result).toBe('비행금지구역');
    expect(signalOf(1).aborted).toBe(true);
  });

  it('모든 요청이 구역 없음으로 끝나면 null을 반환한다', async () => {
    vi.mocked(fetchAirspaceZonesAtPoint).mockResolvedValue(empty);

    expect(await findZoneTypeAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc'])).toBeNull();
  });

  it('바깥 신호가 취소되면 요청에 넘긴 신호도 함께 취소된다', async () => {
    vi.mocked(fetchAirspaceZonesAtPoint).mockImplementation(neverResolves);
    const controller = new AbortController();

    const pending = findZoneTypeAtPoint(POINT, ['lt_c_aisprhc'], controller.signal);
    controller.abort();

    expect(signalOf(0).aborted).toBe(true);
    // 요청이 영영 끝나지 않는 모의라 취소가 결과로 이어지지 않으므로 여기서는 신호 전파만 확인한다.
    void pending;
  });

  it('이미 취소된 신호로 시작하면 요청 신호도 처음부터 취소 상태다', async () => {
    vi.mocked(fetchAirspaceZonesAtPoint).mockRejectedValue(
      new DOMException('Aborted', 'AbortError'),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(findZoneTypeAtPoint(POINT, ['lt_c_aisprhc'], controller.signal)).rejects.toThrow();
    expect(signalOf(0).aborted).toBe(true);
  });
});
