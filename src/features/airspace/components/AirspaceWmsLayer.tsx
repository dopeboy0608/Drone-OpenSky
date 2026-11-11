import { useEffect, useMemo } from 'react';
import { useMap } from 'react-kakao-maps-sdk';

import { useAirspaceFilterStore } from '@/features/airspace/store/airspaceFilterStore';
import { buildWmsTileUrl } from '@/features/airspace/utils/buildWmsTileUrl';
import { chunkTypenames } from '@/features/airspace/utils/chunkTypenames';
import { getVisibleTypenames } from '@/features/airspace/utils/getVisibleTypenames';
import { getWmsTileBbox } from '@/features/airspace/utils/getWmsTileBbox';

import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';

const TILE_SIZE = 256;
// VWorld WMS는 LAYERS를 요청당 4개까지만 받는다(5개 이상이면 INVALID_RANGE 오류 XML이 와서 타일이 전부 실패한다).
// 국토부 원스톱이 레이어별로 따로 요청해 겹쳐 보여 주는 것도 같은 제약 때문이다.
const MAX_LAYERS_PER_REQUEST = 4;
const SLOT_COUNT = Math.ceil(Object.keys(TYPENAME_ZONE_LABELS).length / MAX_LAYERS_PER_REQUEST);
const SLOT_INDEXES = Array.from({ length: SLOT_COUNT }, (_, index) => index);
// 에러 타일 URL이 빈 문자열이면 카카오 SDK 내부에서 오류가 나므로 1px 투명 GIF를 쓴다.
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const getMapTypeName = (slot: number) => `AIRSPACE_WMS_${slot}`;

// 켜진 typename을 앞에서부터 4개씩 슬롯에 채운다. 필터 상태는 타일을 요청하는 시점마다 스토어에서 읽는다.
const getSlotTypenames = (slot: number) =>
  chunkTypenames(
    getVisibleTypenames(useAirspaceFilterStore.getState().visibility),
    MAX_LAYERS_PER_REQUEST,
  )[slot] ?? [];

// kakao.maps.MapTypeId 타입은 enum이라 런타임에 추가되는 이름을 인덱싱하려면 단언이 필요하다.
const getRegisteredMapTypeId = (slot: number) =>
  (kakao.maps.MapTypeId as unknown as Record<string, kakao.maps.MapTypeId | undefined>)[
    getMapTypeName(slot)
  ];

const registerWmsTileset = (slot: number) => {
  // StrictMode 재마운트나 모드 재전환에서 같은 이름으로 다시 add하면 안 되므로 등록 여부를 SDK에서 확인한다.
  if (getRegisteredMapTypeId(slot)) {
    return;
  }

  const tileset = new kakao.maps.Tileset({
    width: TILE_SIZE,
    height: TILE_SIZE,
    // Tileset은 SDK 전역에 슬롯당 한 번만 등록되고 이름이 같으면 다시 add할 수 없어서, 필터 상태를 클로저로
    // 캡처하지 않고 타일을 요청하는 시점마다 읽는다.
    urlFunc: (x, y, z) => {
      const typenames = getSlotTypenames(slot);

      // 전부 꺼진 직후 이미 스케줄된 타일 요청이 빈 LAYERS로 나가면 서버 오류가 나므로 투명 타일로 대체한다.
      if (typenames.length === 0) {
        return TRANSPARENT_PIXEL;
      }

      return buildWmsTileUrl({
        bbox: getWmsTileBbox(x, y, z),
        typenames,
        key: import.meta.env.VITE_VWORLD_API_KEY,
      });
    },
    // errorTileUrl은 SDK가 받지만 공식 타입 정의에 빠져 있다.
    errorTileUrl: TRANSPARENT_PIXEL,
  } as kakao.maps.TilesetOptions);
  kakao.maps.Tileset.add(getMapTypeName(slot), tileset);
};

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
