# 스펙: 공역 표시 방식 전환 — WMS 타일 오버레이 (#72, 스토리 #28)

## 배경/목적

국토부 드론 원스톱은 폴리곤이 아니라 VWorld WMS 래스터 타일을 겹쳐 보여준다. 같은 소스·스타일로
볼 수 있도록 `renderMode`가 `wms`일 때 카카오 `Tileset`으로 VWorld WMS 타일을 지도에 올린다.
이 스펙은 #72 범위(고정 12종 레이어 표시)까지만 다룬다. 필터 반영·조회 중단(#73), 프로덕션 키(#74),
구역 클릭(#75), 줌 오차 점검(#76)은 범위 밖이다.

## 입력

- **`tileToWcongBounds(x, y, z)`**: 카카오 타일 인덱스. 정수 `x`, `y`와 카카오 타일 레벨 `z`.
- **`latLngToWebMercator(lat, lng)`**: 위경도(도).
- **`getWmsTileBbox(x, y, z)`**: 카카오 타일 인덱스. 내부에서 `kakao.maps.Coords`를 쓴다.
- **`buildWmsTileUrl({ bbox, typenames, key })`**: EPSG:3857 BBOX, typename 목록, VWorld 키.
- **`AirspaceWmsLayer`**: `KakaoMap` 자식으로 렌더. 마운트 중에만 오버레이가 켜진다.

## 기대 동작

- [ ] `tileToWcongBounds`: `size = 80·2^z`, X 범위 `[-75000+size·x, +size]`, Y 범위 `[-150000+size·y, +size]`.
- [ ] `latLngToWebMercator`: (0, 0)은 (0, 0), 경도 180은 x ≈ 20037508.34, 위도는 로그 탄젠트 공식.
- [ ] `getWmsTileBbox`: 타일 네 모서리를 `Coords.toLatLng()`로 위경도로 바꾼 뒤 3857로 변환해 외접 사각형을 반환한다.
- [ ] `buildWmsTileUrl`: `https://api.vworld.kr/req/wms`, `SERVICE=WMS`, `VERSION=1.3.0`, `REQUEST=GetMap`,
      `FORMAT=image/png`, `TRANSPARENT=true`, `WIDTH=HEIGHT=256`, `CRS=EPSG:3857`,
      `LAYERS`=`STYLES`=쉼표로 이은 typename, `BBOX=minX,minY,maxX,maxY`, `key`.
- [ ] `AirspaceWmsLayer`: 마운트 시 `Tileset.add` 후 `map.addOverlayMapTypeId`, 언마운트 시 `removeOverlayMapTypeId`.
- [ ] 레이어는 `AIRSPACE_ZONE_CONFIGS`의 12종 typename 전부를 고정으로 요청한다.
- [ ] `MapView`는 `renderMode === 'wms'`일 때만 `AirspaceWmsLayer`를 렌더한다.

## 엣지케이스

- [ ] StrictMode 재마운트나 모드 재전환으로 `Tileset.add`가 같은 이름으로 두 번 호출되지 않는다(이미 등록돼 있으면 건너뛴다).
- [ ] 언마운트 후 다시 마운트하면 오버레이가 다시 켜진다.
- [ ] `errorTileUrl`은 유효한 URL(1px GIF data URL)이다. 빈 문자열이면 SDK 내부 오류가 난다.
- [ ] 키는 URL에 들어가므로 로그로 출력하지 않는다.
- [ ] 음수·큰 `x`, `y`, `z`에서도 `tileToWcongBounds`가 선형 공식대로 계산한다.

## 범위 밖

- 범례 필터를 `LAYERS`에 반영, WMS 모드에서 폴리곤 조회(WFS) 중단 → #73
- 프로덕션 키·도메인 설정 → #74
- WMS 모드 구역 클릭 안내 → #75
- 줌별 외접 BBOX 오차 점검, 국토부 지도 비교 → #76

## 관련 이슈

#72, #28
