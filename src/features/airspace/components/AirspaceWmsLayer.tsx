import { useEffect } from 'react';
import { useMap } from 'react-kakao-maps-sdk';

import { buildWmsTileUrl } from '@/features/airspace/utils/buildWmsTileUrl';
import { getWmsTileBbox } from '@/features/airspace/utils/getWmsTileBbox';

import { TYPENAME_ZONE_LABELS } from '@/features/airspace/constants';

const WMS_MAP_TYPE_NAME = 'AIRSPACE_WMS';
const TILE_SIZE = 256;
// 에러 타일 URL이 빈 문자열이면 카카오 SDK 내부에서 오류가 나므로 1px 투명 GIF를 쓴다.
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// #72는 필터 없이 12종 전부를 고정으로 요청한다. 필터 반영은 #73.
const ALL_TYPENAMES = Object.keys(TYPENAME_ZONE_LABELS);

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
    urlFunc: (x, y, z) =>
      buildWmsTileUrl({
        bbox: getWmsTileBbox(x, y, z),
        typenames: ALL_TYPENAMES,
        key: import.meta.env.VITE_VWORLD_API_KEY,
      }),
    // errorTileUrl은 SDK가 받지만 공식 타입 정의에 빠져 있다.
    errorTileUrl: TRANSPARENT_PIXEL,
  } as kakao.maps.TilesetOptions);
  kakao.maps.Tileset.add(WMS_MAP_TYPE_NAME, tileset);
};

export const AirspaceWmsLayer = () => {
  const map = useMap();

  useEffect(() => {
    registerWmsTileset();
    const mapTypeId = getRegisteredMapTypeId();
    if (!mapTypeId) {
      return;
    }

    map.addOverlayMapTypeId(mapTypeId);
    // 모드가 바뀌거나 언마운트될 때 오버레이가 남지 않도록 클린업에서 제거한다.
    return () => map.removeOverlayMapTypeId(mapTypeId);
  }, [map]);

  return null;
};
