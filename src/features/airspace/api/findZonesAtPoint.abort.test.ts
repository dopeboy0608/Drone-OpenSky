import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAirspaceZonesAtPoint } from '@/features/airspace/api/fetchAirspaceZonesAtPoint';
import { findZonesAtPoint } from '@/features/airspace/api/findZonesAtPoint';
import type { VWorldFeatureCollection } from '@/features/airspace/types';

// MSW(node)는 axios가 요청을 끊어도 request.signal의 abort를 전달하지 않아 취소를 관찰할 수 없다.
// 그래서 요청 함수를 모킹해 넘겨받은 AbortSignal을 직접 확인한다.
vi.mock('@/features/airspace/api/fetchAirspaceZonesAtPoint');

const POINT = { lat: 5, lng: 5 };
const empty: VWorldFeatureCollection = { type: 'FeatureCollection', features: [] };

const signalOf = (callIndex: number) =>
  vi.mocked(fetchAirspaceZonesAtPoint).mock.calls[callIndex][2] as AbortSignal;
const neverResolves = () => new Promise<VWorldFeatureCollection>(() => {});

describe('findZonesAtPoint 요청 취소', () => {
  beforeEach(() => {
    vi.mocked(fetchAirspaceZonesAtPoint).mockReset();
  });

  it('모든 요청이 끝나면 넘겨 준 신호를 정리(취소)한다', async () => {
    vi.mocked(fetchAirspaceZonesAtPoint).mockResolvedValue(empty);

    await findZonesAtPoint(POINT, ['lt_c_aisprhc', 'lt_c_aisctrc']);

    expect(signalOf(0).aborted).toBe(true);
    expect(signalOf(1).aborted).toBe(true);
  });

  it('바깥 신호가 취소되면 요청에 넘긴 신호도 함께 취소된다', async () => {
    vi.mocked(fetchAirspaceZonesAtPoint).mockImplementation(neverResolves);
    const controller = new AbortController();

    const pending = findZonesAtPoint(POINT, ['lt_c_aisprhc'], { signal: controller.signal });
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

    await expect(
      findZonesAtPoint(POINT, ['lt_c_aisprhc'], { signal: controller.signal }),
    ).rejects.toThrow();
    expect(signalOf(0).aborted).toBe(true);
  });
});
