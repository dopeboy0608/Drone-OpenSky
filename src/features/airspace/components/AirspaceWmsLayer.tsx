import { useEffect, useMemo } from 'react';
import { useMap } from 'react-kakao-maps-sdk';

import { useAirspaceFilterStore } from '@/features/airspace/store/airspaceFilterStore';
import { buildWmsTileUrl } from '@/features/airspace/utils/buildWmsTileUrl';
import { getVisibleTypenames } from '@/features/airspace/utils/getVisibleTypenames';
import { getWmsTileBbox } from '@/features/airspace/utils/getWmsTileBbox';

const WMS_MAP_TYPE_NAME = 'AIRSPACE_WMS';
const TILE_SIZE = 256;
// 에러 타일 URL이 빈 문자열이면 카카오 SDK 내부에서 오류가 나므로 1px 투명 GIF를 쓴다.
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// kakao.maps.MapTypeId 타입은 enum이라 런타임에 추가되는 이름을 인덱싱하려면 단언이 필요하다.
const getRegisteredMapTypeId = () =>
  (kakao.maps.MapTypeId as unknown as Record<string, kakao.maps.MapTypeId | undefined>)[
    WMS_MAP_TYPE_NAME
  ];

const registerWmsTileset = () => {
  // StrictMode 재마운트나 모드 재전환에서 같은 이름으로 다시 add하면 안 되므로 등록 여부를 SDK에서 확인한다.
  if (getRegisteredMapTypeId()) {
    return;
  }

  const tileset = new kakao.maps.Tileset({
    width: TILE_SIZE,
    height: TILE_SIZE,
    // Tileset은 SDK 전역에 한 번만 등록되고 이름이 같으면 다시 add할 수 없어서, 필터 상태를 클로저로 캡처하지 않고
    // 타일을 요청하는 시점마다 스토어에서 읽는다.
    urlFunc: (x, y, z) => {
      const typenames = getVisibleTypenames(useAirspaceFilterStore.getState().visibility);

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
  kakao.maps.Tileset.add(WMS_MAP_TYPE_NAME, tileset);
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
    registerWmsTileset();
    const mapTypeId = getRegisteredMapTypeId();
    // 모두 꺼진 상태에서는 오버레이 자체를 붙이지 않는다. 붙이면 빈 LAYERS 요청이 나간다.
    if (!mapTypeId || visibleTypenamesKey === '') {
      return;
    }

    // 필터가 바뀌면 이 이펙트가 다시 돌아 오버레이를 뗐다 붙인다. 카카오 Tileset에는 타일 갱신 API가 없고,
    // 오버레이를 다시 붙여야 urlFunc가 새 LAYERS로 다시 호출된다.
    map.addOverlayMapTypeId(mapTypeId);
    // 모드가 바뀌거나 언마운트될 때 오버레이가 남지 않도록 클린업에서 제거한다.
    return () => map.removeOverlayMapTypeId(mapTypeId);
  }, [map, visibleTypenamesKey]);

  return null;
};
