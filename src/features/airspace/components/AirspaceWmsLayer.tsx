import { useEffect, useMemo } from 'react';
import { useMap } from 'react-kakao-maps-sdk';

import { useAirspaceFilterStore } from '@/features/airspace/store/airspaceFilterStore';
import { chunkTypenames } from '@/features/airspace/utils/chunkTypenames';
import { getVisibleTypenames } from '@/features/airspace/utils/getVisibleTypenames';
import {
  MAX_LAYERS_PER_REQUEST,
  SLOT_INDEXES,
  getRegisteredMapTypeId,
  registerWmsTileset,
} from '@/features/airspace/utils/wmsTilesets';

export const AirspaceWmsLayer = () => {
  const map = useMap();
  const visibility = useAirspaceFilterStore((state) => state.visibility);
  // 문자열 키로 만든 이유: 같은 typename 조합이면 이펙트가 다시 돌지 않게 하려는 것이다(visibility 객체는 토글마다 새로 만들어진다).
  const visibleTypenamesKey = useMemo(
    () => getVisibleTypenames(visibility).join(','),
    [visibility],
  );

  useEffect(() => {
    // 켜진 typename 수만큼만 슬롯을 붙인다. 빈 슬롯을 붙이면 빈 LAYERS 요청이 나간다.
    const visibleTypenames = visibleTypenamesKey === '' ? [] : visibleTypenamesKey.split(',');
    const usedSlotCount = chunkTypenames(visibleTypenames, MAX_LAYERS_PER_REQUEST).length;

    // 카카오 오버레이는 나중에 추가한 것이 위에 그려진다. 앞 슬롯이 비행금지 등 위험도가 높은 구역이라
    // 마지막 슬롯부터 추가해 앞 슬롯이 위로 오게 한다.
    const attachedMapTypeIds = SLOT_INDEXES.slice(0, usedSlotCount)
      .reverse()
      .flatMap((slot) => {
        registerWmsTileset(slot);
        const mapTypeId = getRegisteredMapTypeId(slot);
        return mapTypeId ? [mapTypeId] : [];
      });

    // 필터가 바뀌면 이 이펙트가 다시 돌아 오버레이를 뗐다 붙인다. 카카오 Tileset에는 타일 갱신 API가 없고,
    // 오버레이를 다시 붙여야 urlFunc가 새 LAYERS로 다시 호출된다.
    for (const mapTypeId of attachedMapTypeIds) {
      map.addOverlayMapTypeId(mapTypeId);
    }
    // 모드가 바뀌거나 언마운트될 때 오버레이가 남지 않도록 클린업에서 제거한다.
    return () => {
      for (const mapTypeId of attachedMapTypeIds) {
        map.removeOverlayMapTypeId(mapTypeId);
      }
    };
  }, [map, visibleTypenamesKey]);

  return null;
};
