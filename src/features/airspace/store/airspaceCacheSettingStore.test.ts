import { beforeEach, describe, expect, it } from 'vitest';

import {
  AIRSPACE_CACHE_SETTING_STORAGE_KEY,
  useAirspaceCacheSettingStore,
} from '@/features/airspace/store/airspaceCacheSettingStore';

describe('airspaceCacheSettingStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAirspaceCacheSettingStore.setState({ enabled: false });
  });

  it('초기값은 꺼짐이다', () => {
    expect(useAirspaceCacheSettingStore.getState().enabled).toBe(false);
  });

  it('setEnabled로 켜고 끈다', () => {
    useAirspaceCacheSettingStore.getState().setEnabled(true);
    expect(useAirspaceCacheSettingStore.getState().enabled).toBe(true);

    useAirspaceCacheSettingStore.getState().setEnabled(false);
    expect(useAirspaceCacheSettingStore.getState().enabled).toBe(false);
  });

  it('켠 값을 localStorage에 저장한다', () => {
    useAirspaceCacheSettingStore.getState().setEnabled(true);

    const stored = JSON.parse(localStorage.getItem(AIRSPACE_CACHE_SETTING_STORAGE_KEY) ?? '{}');
    expect(stored.state.enabled).toBe(true);
  });

  it('저장된 값을 새로고침 뒤에도 복원한다', async () => {
    localStorage.setItem(
      AIRSPACE_CACHE_SETTING_STORAGE_KEY,
      JSON.stringify({ state: { enabled: true }, version: 0 }),
    );

    await useAirspaceCacheSettingStore.persist.rehydrate();

    expect(useAirspaceCacheSettingStore.getState().enabled).toBe(true);
  });

  it('저장값이 손상되었으면 꺼짐으로 시작한다', async () => {
    localStorage.setItem(AIRSPACE_CACHE_SETTING_STORAGE_KEY, '{not json');

    await useAirspaceCacheSettingStore.persist.rehydrate();

    expect(useAirspaceCacheSettingStore.getState().enabled).toBe(false);
  });
});
