import { beforeEach, describe, expect, it } from 'vitest';

import { useAirspaceRenderModeStore } from '@/features/airspace/store/airspaceRenderModeStore';

describe('airspaceRenderModeStore', () => {
  beforeEach(() => {
    useAirspaceRenderModeStore.setState({ renderMode: 'polygon' });
  });

  it('초기값은 polygon이다', () => {
    expect(useAirspaceRenderModeStore.getState().renderMode).toBe('polygon');
  });

  it('setRenderMode로 wms로 전환한다', () => {
    useAirspaceRenderModeStore.getState().setRenderMode('wms');

    expect(useAirspaceRenderModeStore.getState().renderMode).toBe('wms');
  });

  it('wms에서 polygon으로 되돌린다', () => {
    useAirspaceRenderModeStore.getState().setRenderMode('wms');
    useAirspaceRenderModeStore.getState().setRenderMode('polygon');

    expect(useAirspaceRenderModeStore.getState().renderMode).toBe('polygon');
  });
});
