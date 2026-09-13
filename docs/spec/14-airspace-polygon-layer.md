# 스펙: 공공 API 호출 + 불가/제한/가능 3색 폴리곤 표시

## 배경/목적

1단계 범위(ROADMAP.md)의 핵심 작업. VWorld WFS API에서 전국 단위 공역 데이터를 받아와
Kakao Map 위에 불가(빨강)/제한(회색)/가능(녹색) 3색 폴리곤으로 단순 표기한다.
필터, 인터랙션, 뷰포트 기반 재조회는 이번 범위에 포함하지 않는다.

## 데이터 매핑

- **불가(빨강)**: `lt_c_aisprhc` (비행금지구역)
- **제한(회색)**: `lt_c_aisresc`(비행제한구역) + `lt_c_aisctrc`(관제권) + `lt_c_aismoac`(군작전구역)
- **가능(녹색)**: `lt_c_aisuac` (UA초경량비행장치공역)
- `lt_c_aistemp`(임시비행금지), `lt_c_aisdronezone`(드론시범사업구역)는 이번 범위 제외

## 입력

- **좌표 변환 함수** (`src/features/airspace/utils/`): VWorld GeoJSON feature의
  `geometry.coordinates` (`MultiPolygon`, `[lng, lat][][][]`) 배열.
- **`AirspacePolygonLayer` 컴포넌트**: `typenames: string[]`(제한 구역처럼 여러 typename을
  한 색상으로 합쳐야 하는 경우 대응), `color: string`, `fillOpacity: number`, `zIndex: number` props.
- **VWorld 호출 유틸** (`src/features/airspace/queries/` 또는 `api/`): typename, 고정 BBOX(대한민국 전체)를
  받아 `vworldClient`로 WFS `GetFeature` 요청.

## 기대 동작

- [ ] TanStack Query `useQueries`로 3개 typename 그룹(불가/제한/가능) 병렬 호출
      (`staleTime`: 30분, `refetchOnWindowFocus: false`). 제한 그룹은 typename 3개를 하나의
      쿼리 함수 안에서 `Promise.all`로 호출해 합친다.
- [ ] `QueryClientProvider`를 앱 루트(`App.tsx`)에 추가 (아직 미설정).
- [ ] BBOX 파라미터는 우선 생략 시도, 미동작 시 대한민국 전체를 덮는 고정 BBOX
      (`124,33,132,43`, API_REFERENCE.md 실증값)로 폴백.
- [ ] 좌표 변환 함수: `MultiPolygon.coordinates`를 순회해 폴리곤 1개당 `<Polygon>` 1개,
      `path`는 `LatLng[][]`(첫 ring=외곽, 이후=홀)로 매핑. `[lng, lat]` → `kakao.maps.LatLng(lat, lng)` 순서 변환.
- [ ] 범용 `AirspacePolygonLayer` 컴포넌트를 3번(불가/제한/가능) 인스턴스화해 렌더링.
- [ ] 색상: 불가 `#FF4D4F`(fillOpacity 0.35) / 제한 `#8C8C8C`(0.3) / 가능 `#52C41A`(0.2),
      z-index는 불가 > 제한 > 가능 순.
- [ ] 로딩 중 antd `Spin`을 지도 위 상단 중앙에 오버레이로 표시 (3개 쿼리 그룹 중
      하나라도 로딩이면 표시).
- [ ] 우하단에 정적 범례(불가/제한/가능 3줄) 추가.
- [ ] 레이어별(그룹별) 독립 실패 처리: 하나 실패해도 나머지는 정상 표시, 실패는
      `console.error` 로그 + antd `message.error` 토스트(3초, `AIRSPACE_ZONE_LABELS` 기준
      그룹명 포함)로 사용자에게도 알림. 같은 그룹이 재조회 없이 계속 에러 상태를 유지하는
      동안 토스트가 중복 노출되지 않도록 그룹별 마지막 `errorUpdatedAt`을 기억한다.

## 엣지케이스

- [ ] 3개 그룹 중 일부만 실패하는 경우 → 실패한 그룹만 렌더링 생략, 나머지 정상 표시
- [ ] 3개 그룹 모두 실패하는 경우 → 폴리곤 없이 지도만 표시, 콘솔에 에러 3건
- [ ] MultiPolygon에 홀(hole)이 있는 feature → 외곽 ring 이후의 ring들도 `path`에 포함
- [ ] 빈 FeatureCollection(0건) 응답 → 폴리곤 렌더링 없이 정상 종료 (에러 아님)
- [ ] `coordinates`가 빈 배열인 경우 → 빈 `LatLng[][]` 반환

## 범위 밖

- 공역별 필터/토글 (추후 고도화 시 typename별 분리 호출)
- 지도 영역(rect) 기반 호출 + dragEnd 디바운스 또는 재조회 버튼
- 폴리곤 클릭/hover 인터랙션 (상세 정보 팝업 등)

## 관련 이슈

#14 (선행 작업: #11, closed)
