# #51 의존관계 맵 (진입점 기준 전수 조사)

- 이슈: [#51](https://github.com/dopeboy0608/drone-opensky/issues/51) refactor: fowler-refactor 적용
- 작성: 2026-11-11, 기준 커밋 `460e8f7` (master)
- 목적: `/code-organizer`와 `/fowler-refactor`를 **모듈 단위가 아니라 `src` 전체 의존 그래프를 기준으로** 적용하기 위한 입력 자료. 모듈 단위로 범위를 자르면 놓치기 쉬운 import 밖의 의존(전역 객체, 환경변수, 스토어 직접 접근, 키 공유, 순서 의미)까지 함께 기록한다.
- 범위 밖: 개선 제안, 코드 스멜 판정, Fowler 패턴 매핑. 이 문서는 구조의 **사실**만 담는다. 개선 평가는 사용자가 직접 호출하는 `/dopeboy0608-skills:fowler-refactor`가 한다.

## 1. 조사 방법과 검증

1. `src` 아래 모든 `.ts`/`.tsx`(테스트 포함)에서 `import`/`export … from`/동적 `import()`/`vi.mock` 경로를 추출하고, `@/` 별칭과 상대 경로를 실제 파일로 해석했다(주석 속 import 예시는 제외). `import type`은 값 import와 구분했다.
2. 진입점 `src/index.tsx`에서 값 import만 따라 도달하는 집합을 따로 계산해 **esbuild 번들러의 메타파일**과 대조했다. 결과: 내 그래프 51개 vs esbuild 52개이고 차이는 `src/App.css` 하나(CSS는 그래프에서 제외)라 일치한다. 해석 실패 import는 0건.
3. import 그래프로 보이지 않는 의존은 소스 전체를 패턴 스캔해 별도로 모았다(§6).

## 2. 규모

| 구분                                             | 파일 수 | 줄 수 |
| ------------------------------------------------ | ------- | ----- |
| 프로덕션 (`src`, 테스트·모의 제외)               | 54      | 2,420 |
| 테스트 (`*.test.ts(x)` 36 + `src/test/*` 지원 3) | 39      | 3,781 |

- 진입점 `src/index.tsx`에서 값 import로 도달하는 프로덕션 파일: 51개.
- 타입 import로만 도달: `features/airspace/types.ts`, `features/map/types.ts` (런타임 코드 없음).
- 도달 불가: `src/env.d.ts` (앰비언트 타입 선언이라 import되지 않는 것이 정상).
- **순환 의존: 없음** (강연결요소 검사).

## 3. 진입점 의존 트리

`↑`는 위에서 이미 펼친 파일, _(type)_은 타입 전용 import.

- `index.tsx`
  - `App.tsx`
    - `api/queryClient.ts`
    - `routes/router.tsx`
      - `pages/MapPage.tsx`
        - `features/map/components/MapView.tsx`
          - `features/airspace/components/AirspaceFilterPanel.tsx`
            - `features/airspace/store/airspaceFilterStore.ts`
              - `features/airspace/constants.ts`
                - `features/airspace/types.ts` _(type)_
              - `features/airspace/types.ts` _(type)_ ↑
            - `features/airspace/utils/getGroupCheckState.ts`
            - `features/airspace/constants.ts` ↑
          - `features/airspace/components/AirspaceClickPending.tsx`
          - `features/airspace/components/AirspaceCacheMenu.tsx`
            - `features/airspace/store/airspaceCacheSettingStore.ts`
          - `features/airspace/components/AirspaceRenderModeMenu.tsx`
            - `features/airspace/store/airspaceRenderModeStore.ts`
          - `features/airspace/components/AirspaceLegend.tsx`
            - `features/airspace/constants.ts` ↑
          - `features/airspace/components/AirspacePolygonLayer.tsx`
            - `features/airspace/components/AirspacePolygon.tsx`
              - `features/airspace/types.ts` _(type)_ ↑
            - `features/airspace/utils/multiPolygonToKakaoPaths.ts`
            - `features/airspace/utils/polygonCentroid.ts`
            - `features/airspace/types.ts` _(type)_ ↑
          - `features/airspace/components/AirspaceWmsLayer.tsx`
            - `features/airspace/constants.ts` ↑
            - `features/airspace/store/airspaceFilterStore.ts` ↑
            - `features/airspace/utils/buildWmsTileUrl.ts`
              - `features/airspace/utils/tileToWcongBounds.ts` _(type)_
            - `features/airspace/utils/chunkTypenames.ts`
            - `features/airspace/utils/getVisibleTypenames.ts`
              - `features/airspace/constants.ts` ↑
            - `features/airspace/utils/getWmsTileBbox.ts`
              - `features/airspace/utils/latLngToWebMercator.ts`
              - `features/airspace/utils/tileToWcongBounds.ts` ↑
          - `features/airspace/components/AirspaceZoneOverlay.tsx`
          - `features/airspace/hooks/useSelectedZone.ts`
            - `features/airspace/types.ts` _(type)_ ↑
          - `features/airspace/hooks/useZoneClick.ts`
            - `features/airspace/api/findZoneTypeAtPoint.ts`
              - `features/airspace/api/fetchAirspaceZonesAtPoint.ts`
                - `api/vworldClient.ts`
                - `features/airspace/types.ts` _(type)_ ↑
              - `features/airspace/constants.ts` ↑
              - `features/airspace/utils/isPointInMultiPolygon.ts`
            - `features/airspace/types.ts` _(type)_ ↑
          - `features/map/components/AddressSearch.tsx`
            - `features/map/hooks/useAddressSearch.ts`
              - `features/map/hooks/useDebouncedValue.ts`
              - `features/map/utils/searchAddressCandidates.ts`
                - `features/map/constants.ts`
                - `features/map/types.ts` _(type)_
              - `features/map/constants.ts` ↑
              - `features/map/types.ts` _(type)_ ↑
            - `features/map/types.ts` _(type)_ ↑
          - `features/map/components/MapControls.tsx`
          - `features/map/hooks/useCurrentCenter.ts`
            - `features/map/constants.ts` ↑
            - `features/map/types.ts` _(type)_ ↑
          - `features/map/hooks/useMapMarker.ts`
            - `features/map/types.ts` _(type)_ ↑
          - `features/airspace/queries/useAirspaceZoneQueries.ts`
            - `features/airspace/api/fetchAirspaceZones.ts`
              - `api/vworldClient.ts` ↑
              - `features/airspace/constants.ts` ↑
              - `features/airspace/types.ts` _(type)_ ↑
            - `features/airspace/cache/airspaceCacheStore.ts`
              - `features/airspace/types.ts` _(type)_ ↑
            - `features/airspace/constants.ts` ↑
            - `features/airspace/queries/airspaceZoneQueryKey.ts`
              - `features/airspace/types.ts` _(type)_ ↑
            - `features/airspace/store/airspaceCacheSettingStore.ts` ↑
            - `features/airspace/types.ts` _(type)_ ↑
            - `features/airspace/utils/formatLastUpdated.ts`
            - `features/airspace/utils/resolveStaleTimeMs.ts`
            - `features/airspace/utils/tagFeatureZoneType.ts`
              - `features/airspace/constants.ts` ↑
              - `features/airspace/types.ts` _(type)_ ↑
          - `features/airspace/store/airspaceFilterStore.ts` ↑
          - `features/airspace/store/airspaceRenderModeStore.ts` ↑
          - `features/airspace/utils/getVisibleTypenames.ts` ↑
          - `features/airspace/utils/getVisibleZoneTypes.ts`
            - `features/airspace/constants.ts` ↑
          - `features/map/constants.ts` ↑
  - `api/queryClient.ts` ↑
  - `features/airspace/cache/hydrateAirspaceCache.ts`
    - `features/airspace/cache/airspaceCacheStore.ts` ↑
    - `features/airspace/constants.ts` ↑
    - `features/airspace/queries/airspaceZoneQueryKey.ts` ↑
    - `features/airspace/types.ts` _(type)_ ↑
  - `features/airspace/store/airspaceCacheSettingStore.ts` ↑

## 4. 계층·영역 간 의존 방향

프로덕션 파일 사이의 영역 간 import 수(같은 영역 안은 제외).

| 방향                                  | 간선 수 | 비고                                                              |
| ------------------------------------- | ------- | ----------------------------------------------------------------- |
| `root(index.tsx, App.tsx)` → `routes` | 1       |                                                                   |
| `root` → `api`                        | 2       | `queryClient`                                                     |
| `root` → `features/airspace`          | 2       | `index.tsx` → `hydrateAirspaceCache`, `airspaceCacheSettingStore` |
| `routes` → `pages`                    | 1       |                                                                   |
| `pages` → `features/map`              | 1       | `MapPage` → `MapView`                                             |
| `features/map` → `features/airspace`  | 15      | **전부 `MapView.tsx` 한 파일에서 나감**                           |
| `features/airspace` → `api`           | 2       | `vworldClient` (`fetchAirspaceZones*`)                            |
| `features/airspace` → `features/map`  | 0       | 역방향 참조 없음                                                  |

- 의존은 **단방향**이다: `index → App → routes → pages → features/map → features/airspace → api`.
- `features/map`은 `features/airspace`의 컴포넌트·훅·스토어·유틸을 직접 조립한다. 즉 `MapView.tsx`가 두 도메인의 **합성 지점**이고, `airspace`는 `map`을 모른다.
- `src/components/`, `src/store/`, `src/types/`, `src/constants/`(CLAUDE.md의 공용 디렉터리)는 현재 **존재하지 않는다.** 모든 공용 코드는 `features/*` 안에 있다.
- axios 인스턴스는 `api/vworldClient.ts`에만 있다(CLAUDE.md 규칙과 일치).

## 5. 허브와 변경 영향 반경

**팬아웃(한 파일이 의존하는 프로덕션 파일 수) 상위**: `MapView.tsx` 20, `useAirspaceZoneQueries.ts` 9, `AirspaceWmsLayer.tsx` 6, `hydrateAirspaceCache.ts` 4, `AirspacePolygonLayer.tsx` 4, `useAddressSearch.ts` 4, `index.tsx` 4.

**변경 영향 반경**(그 파일을 직·간접으로 import하는 프로덕션 파일 수 = 바꿨을 때 영향이 퍼지는 범위) 상위:

| 파일                                                   | 영향 반경 | 직접 의존하는 파일 수 |
| ------------------------------------------------------ | --------- | --------------------- |
| `features/airspace/types.ts`                           | 24        | 13                    |
| `features/airspace/constants.ts`                       | 17        | 11                    |
| `api/vworldClient.ts`                                  | 10        | 2                     |
| `features/map/types.ts`                                | 10        | 5                     |
| `features/map/constants.ts`                            | 9         | 4                     |
| `features/airspace/utils/tileToWcongBounds.ts`         | 8         | 2                     |
| `features/airspace/api/fetchAirspaceZonesAtPoint.ts`   | 7         | 1                     |
| `features/airspace/cache/airspaceCacheStore.ts`        | 7         | 2                     |
| `features/airspace/queries/airspaceZoneQueryKey.ts`    | 7         | 2                     |
| `features/airspace/store/airspaceCacheSettingStore.ts` | 7         | 3                     |
| `features/airspace/store/airspaceFilterStore.ts`       | 7         | 3                     |
| `features/airspace/utils/isPointInMultiPolygon.ts`     | 7         | 1                     |

- 영향 반경이 큰 파일은 대부분 **타입·상수·클라이언트** 같은 말단 공용 파일이다. 시그니처를 바꾸면 영향이 가장 넓다.
- `MapView.tsx`는 팬인은 작지만 팬아웃이 20으로 가장 커서, 하위 모듈의 인터페이스 변경이 모두 여기서 만난다.

## 6. import에 드러나지 않는 의존 (암묵적 의존)

모듈 단위 검토에서 가장 놓치기 쉬운 부분이다.

| 종류                                      | 파일                                                                                                                                                                                                        | 설명                                                                                                                                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 전역 `kakao.maps` 객체                    | `AirspacePolygon`, `AirspaceWmsLayer`, `getWmsTileBbox`, `multiPolygonToKakaoPaths`, `polygonCentroid`, `MapView`, `searchAddressCandidates`                                                                | import 없이 전역 SDK에 의존한다. 타입은 `kakao.maps.d.ts`가 제공. **순수 함수로 보이는 `getWmsTileBbox`, `multiPolygonToKakaoPaths`, `polygonCentroid`도 실행 시 `kakao`가 필요하다.** 테스트는 `src/test/mocks/kakaoMaps.ts`로 대체한다. |
| `import.meta.env`                         | `vworldClient`, `AirspaceWmsLayer`, `useAirspaceZoneQueries`, `MapView`, `index.tsx`, `routes/router`                                                                                                       | 빌드 시점 환경변수(`VITE_*`). 읽는 시점이 모듈 로드 시(`useAirspaceZoneQueries`의 staleTime 상수)와 호출 시(`AirspaceWmsLayer`)로 섞여 있다.                                                                                              |
| 훅 밖 스토어 직접 접근 `Store.getState()` | `AirspaceWmsLayer`(타일 `urlFunc` 안에서 필터 스토어), `index.tsx`(렌더 전에 캐시 설정 스토어)                                                                                                              | React 구독을 거치지 않는 읽기. `AirspaceWmsLayer`는 SDK에 전역 등록된 Tileset이 클로저를 못 바꾸기 때문이고, `index.tsx`는 하이드레이션 여부를 렌더 전에 정해야 하기 때문이다.                                                            |
| 모듈 수준 싱글턴                          | `api/queryClient`, `api/vworldClient`, `airspaceCacheSettingStore`, `airspaceFilterStore`, `airspaceRenderModeStore`                                                                                        | 모듈 로드 시 생성되어 앱 전체가 공유한다. `queryClient`는 `App.tsx`와 `index.tsx`가 같은 인스턴스를 써야 해서 분리돼 있다.                                                                                                                |
| 암묵적 브라우저 저장소                    | `airspaceCacheStore`(IndexedDB 직접), `airspaceCacheSettingStore`(zustand `persist` → localStorage, 키 `airspace-cache-setting`)                                                                            | persist는 코드에 `localStorage`가 나오지 않아 검색으로 안 잡힌다.                                                                                                                                                                         |
| 쿼리 키 공유                              | `airspaceZoneQueryKey` ← `hydrateAirspaceCache`, `useAirspaceZoneQueries`                                                                                                                                   | 키가 달라지면 하이드레이션한 데이터가 쿼리에 안 붙는다. 동일 함수를 쓰는 것이 유일한 보장이다.                                                                                                                                            |
| **순서(키 삽입 순서)의 의미**             | `constants.ts`의 `TYPENAME_ZONE_LABELS` → `airspaceFilterStore`(초기 visibility) → `getVisibleTypenames` → (a) `AirspaceWmsLayer`의 슬롯 배정·오버레이 쌓임 순서, (b) `findZoneTypeAtPoint`의 겹침 우선순위 | 객체 키 삽입 순서가 "위험도 우선순위"라는 의미를 갖는다. 선언 순서를 바꾸면 타일 쌓임과 클릭 판정 결과가 함께 바뀐다. 코드에는 주석으로만 남아 있다.                                                                                      |
| typename 정의가 두 곳                     | `AIRSPACE_ZONE_CONFIGS`(그룹별 typename 배열)와 `TYPENAME_ZONE_LABELS`(라벨)                                                                                                                                | 같은 12종을 서로 다른 구조로 정의한다. 한쪽만 고치면 어긋난다.                                                                                                                                                                            |
| 취소 신호 전달                            | `useZoneClick` → `findZoneTypeAtPoint` → `fetchAirspaceZonesAtPoint` → axios                                                                                                                                | `AbortSignal`이 세 계층을 관통한다.                                                                                                                                                                                                       |
| 콘솔 출력                                 | `vworldClient`, `airspaceCacheStore`, `hydrateAirspaceCache`, `useZoneClick`, `useAirspaceZoneQueries`, `index.tsx`                                                                                         | 오류 보고 경로가 파일마다 `console.*`로 흩어져 있다. 취소 오류는 `vworldClient` 인터셉터에서만 걸러진다.                                                                                                                                  |
| import 스타일 혼재                        | `App.tsx`, `index.tsx`만 상대 경로(`./`), 나머지는 전부 `@/` 별칭                                                                                                                                           | `code-organizer`의 그룹 정렬 대상이 되는 지점.                                                                                                                                                                                            |

## 7. 테스트와의 연결

- 프로덕션 54개 중 **직접 테스트(import 또는 mock)가 없는 파일 9개**: `App.tsx`, `api/queryClient.ts`, `features/airspace/api/fetchAirspaceZones.ts`, `components/AirspacePolygon.tsx`, `components/AirspaceRenderModeMenu.tsx`, `features/map/components/MapControls.tsx`, `features/map/hooks/useDebouncedValue.ts`, `pages/MapPage.tsx`, `routes/router.tsx`. (`MapView.test.tsx`가 `MapControls`·일부를 렌더 경로로 간접 실행할 수 있으나 직접 참조는 없다.)
- 리팩터링 후 회귀 확인의 안전망은 `pnpm test`(현재 238개), `pnpm lint`, `npx tsc --noEmit`이다. 위 9개 파일을 건드릴 때는 자동 테스트가 직접 잡아 주지 못한다.
- 테스트가 모킹하는 경계: 카카오 SDK(`kakaoMaps.ts`), `react-kakao-maps-sdk`(여러 테스트에서 `vi.mock`), MSW(VWorld 응답). 모듈 경로·export 이름을 바꾸면 `vi.mock` 경로 문자열도 함께 바뀌어야 한다.

## 8. 파일 카탈로그 (프로덕션 54개)

열: 줄 수 / 직접 의존(프로덕션) 수 / 직접 의존받는 수(팬인) / 영향 반경 / 직접 테스트.

| 파일                                                      | 줄  | 의존 | 팬인 | 영향 반경 | 직접 테스트                                                                                                                                                                                 |
| --------------------------------------------------------- | --- | ---- | ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `App.tsx`                                                 | 17  | 2    | 1    | 1         | —                                                                                                                                                                                           |
| `api/queryClient.ts`                                      | 5   | 0    | 2    | 2         | —                                                                                                                                                                                           |
| `api/vworldClient.ts`                                     | 51  | 0    | 2    | 10        | `vworldClient.test.ts`                                                                                                                                                                      |
| `env.d.ts`                                                | 26  | 0    | 0    | 0         | —                                                                                                                                                                                           |
| `features/airspace/api/fetchAirspaceZones.ts`             | 19  | 3    | 1    | 6         | —                                                                                                                                                                                           |
| `features/airspace/api/fetchAirspaceZonesAtPoint.ts`      | 32  | 2    | 1    | 7         | `findZoneTypeAtPoint.abort.test.ts`                                                                                                                                                         |
| `features/airspace/api/findZoneTypeAtPoint.ts`            | 70  | 3    | 1    | 6         | `findZoneTypeAtPoint.abort.test.ts`, `findZoneTypeAtPoint.test.ts`                                                                                                                          |
| `features/airspace/cache/airspaceCacheStore.ts`           | 136 | 1    | 2    | 7         | `airspaceCacheStore.test.ts`, `hydrateAirspaceCache.test.ts`, `useAirspaceZoneQueries.cacheDisabled.test.tsx`, `useAirspaceZoneQueries.test.tsx`                                            |
| `features/airspace/cache/hydrateAirspaceCache.ts`         | 54  | 4    | 1    | 1         | `hydrateAirspaceCache.test.ts`, `useAirspaceZoneQueries.test.tsx`                                                                                                                           |
| `features/airspace/components/AirspaceCacheMenu.tsx`      | 42  | 1    | 1    | 5         | `AirspaceCacheMenu.test.tsx`                                                                                                                                                                |
| `features/airspace/components/AirspaceClickPending.tsx`   | 25  | 0    | 1    | 5         | `AirspaceClickPending.test.tsx`                                                                                                                                                             |
| `features/airspace/components/AirspaceFilterPanel.tsx`    | 85  | 3    | 1    | 5         | `MapView.test.tsx`                                                                                                                                                                          |
| `features/airspace/components/AirspaceLegend.tsx`         | 16  | 1    | 1    | 5         | `MapView.test.tsx`                                                                                                                                                                          |
| `features/airspace/components/AirspacePolygon.tsx`        | 75  | 1    | 1    | 6         | —                                                                                                                                                                                           |
| `features/airspace/components/AirspacePolygonLayer.tsx`   | 96  | 4    | 1    | 5         | `AirspacePolygonLayer.test.tsx`, `MapView.test.tsx`                                                                                                                                         |
| `features/airspace/components/AirspaceRenderModeMenu.tsx` | 43  | 1    | 1    | 5         | —                                                                                                                                                                                           |
| `features/airspace/components/AirspaceWmsLayer.tsx`       | 106 | 6    | 1    | 5         | `AirspaceWmsLayer.test.tsx`                                                                                                                                                                 |
| `features/airspace/components/AirspaceZoneOverlay.tsx`    | 71  | 0    | 1    | 5         | `AirspaceZoneOverlay.test.tsx`, `MapView.test.tsx`                                                                                                                                          |
| `features/airspace/constants.ts`                          | 59  | 1    | 11   | 17        | `hydrateAirspaceCache.test.ts`, `AirspacePolygonLayer.test.tsx`, `AirspaceWmsLayer.test.tsx`, `airspaceFilterStore.test.ts`                                                                 |
| `features/airspace/hooks/useSelectedZone.ts`              | 23  | 1    | 1    | 5         | `useSelectedZone.test.ts`                                                                                                                                                                   |
| `features/airspace/hooks/useZoneClick.ts`                 | 92  | 2    | 1    | 5         | `useZoneClick.test.tsx`                                                                                                                                                                     |
| `features/airspace/queries/airspaceZoneQueryKey.ts`       | 6   | 1    | 2    | 7         | `hydrateAirspaceCache.test.ts`                                                                                                                                                              |
| `features/airspace/queries/useAirspaceZoneQueries.ts`     | 141 | 9    | 1    | 5         | `useAirspaceZoneQueries.cacheDisabled.test.tsx`, `useAirspaceZoneQueries.test.tsx`, `MapView.test.tsx`                                                                                      |
| `features/airspace/store/airspaceCacheSettingStore.ts`    | 27  | 0    | 3    | 7         | `AirspaceCacheMenu.test.tsx`, `useAirspaceZoneQueries.cacheDisabled.test.tsx`, `useAirspaceZoneQueries.test.tsx`, `airspaceCacheSettingStore.test.ts`                                       |
| `features/airspace/store/airspaceFilterStore.ts`          | 48  | 2    | 3    | 7         | `AirspaceWmsLayer.test.tsx`, `airspaceFilterStore.test.ts`                                                                                                                                  |
| `features/airspace/store/airspaceRenderModeStore.ts`      | 15  | 0    | 2    | 6         | `airspaceRenderModeStore.test.ts`                                                                                                                                                           |
| `features/airspace/types.ts`                              | 31  | 0    | 13   | 24        | `findZoneTypeAtPoint.abort.test.ts`, `airspaceCacheStore.test.ts`, `hydrateAirspaceCache.test.ts`, `AirspacePolygonLayer.test.tsx`, `useSelectedZone.test.ts`, `tagFeatureZoneType.test.ts` |
| `features/airspace/utils/buildWmsTileUrl.ts`              | 33  | 1    | 1    | 6         | `buildWmsTileUrl.test.ts`                                                                                                                                                                   |
| `features/airspace/utils/chunkTypenames.ts`               | 13  | 0    | 1    | 6         | `chunkTypenames.test.ts`                                                                                                                                                                    |
| `features/airspace/utils/formatLastUpdated.ts`            | 17  | 0    | 1    | 6         | `formatLastUpdated.test.ts`                                                                                                                                                                 |
| `features/airspace/utils/getGroupCheckState.ts`           | 16  | 0    | 1    | 6         | `getGroupCheckState.test.ts`                                                                                                                                                                |
| `features/airspace/utils/getVisibleTypenames.ts`          | 9   | 1    | 2    | 6         | `getVisibleTypenames.test.ts`                                                                                                                                                               |
| `features/airspace/utils/getVisibleZoneTypes.ts`          | 10  | 1    | 1    | 5         | `getVisibleZoneTypes.test.ts`                                                                                                                                                               |
| `features/airspace/utils/getWmsTileBbox.ts`               | 28  | 2    | 1    | 6         | `getWmsTileBbox.test.ts`                                                                                                                                                                    |
| `features/airspace/utils/isPointInMultiPolygon.ts`        | 35  | 0    | 1    | 7         | `isPointInMultiPolygon.test.ts`                                                                                                                                                             |
| `features/airspace/utils/latLngToWebMercator.ts`          | 8   | 0    | 1    | 7         | `getWmsTileBbox.test.ts`, `latLngToWebMercator.test.ts`                                                                                                                                     |
| `features/airspace/utils/multiPolygonToKakaoPaths.ts`     | 17  | 0    | 1    | 6         | `multiPolygonToKakaoPaths.test.ts`                                                                                                                                                          |
| `features/airspace/utils/polygonCentroid.ts`              | 13  | 0    | 1    | 6         | `polygonCentroid.test.ts`                                                                                                                                                                   |
| `features/airspace/utils/resolveStaleTimeMs.ts`           | 15  | 0    | 1    | 6         | `resolveStaleTimeMs.test.ts`                                                                                                                                                                |
| `features/airspace/utils/tagFeatureZoneType.ts`           | 16  | 2    | 1    | 6         | `tagFeatureZoneType.test.ts`                                                                                                                                                                |
| `features/airspace/utils/tileToWcongBounds.ts`            | 21  | 0    | 2    | 8         | `getWmsTileBbox.test.ts`, `tileToWcongBounds.test.ts`                                                                                                                                       |
| `features/map/components/AddressSearch.tsx`               | 119 | 2    | 1    | 5         | `AddressSearch.test.tsx`, `MapView.test.tsx`                                                                                                                                                |
| `features/map/components/MapControls.tsx`                 | 35  | 0    | 1    | 5         | —                                                                                                                                                                                           |
| `features/map/components/MapView.tsx`                     | 192 | 20   | 1    | 4         | `MapView.test.tsx`                                                                                                                                                                          |
| `features/map/constants.ts`                               | 18  | 0    | 4    | 9         | `MapView.test.tsx`, `useAddressSearch.test.tsx`                                                                                                                                             |
| `features/map/hooks/useAddressSearch.ts`                  | 61  | 4    | 1    | 6         | `AddressSearch.test.tsx`, `useAddressSearch.test.tsx`                                                                                                                                       |
| `features/map/hooks/useCurrentCenter.ts`                  | 71  | 2    | 1    | 5         | `MapView.test.tsx`                                                                                                                                                                          |
| `features/map/hooks/useDebouncedValue.ts`                 | 14  | 0    | 1    | 7         | —                                                                                                                                                                                           |
| `features/map/hooks/useMapMarker.ts`                      | 35  | 1    | 1    | 5         | `useMapMarker.test.ts`                                                                                                                                                                      |
| `features/map/types.ts`                                   | 13  | 0    | 5    | 10        | `AddressSearch.test.tsx`, `useAddressSearch.test.tsx`                                                                                                                                       |
| `features/map/utils/searchAddressCandidates.ts`           | 125 | 2    | 1    | 7         | `useAddressSearch.test.tsx`, `searchAddressCandidates.test.ts`                                                                                                                              |
| `index.tsx`                                               | 29  | 4    | 0    | 0         | —                                                                                                                                                                                           |
| `pages/MapPage.tsx`                                       | 8   | 1    | 1    | 3         | —                                                                                                                                                                                           |
| `routes/router.tsx`                                       | 38  | 1    | 1    | 2         | —                                                                                                                                                                                           |

## 9. `fowler-refactor`·`code-organizer` 적용 시 함께 봐야 하는 묶음

모듈 하나만 보면 연결된 반대편을 놓치는 구간이다. 아래 묶음은 위 그래프에서 서로 직접 import하거나 §6의 암묵적 결합을 공유하는 파일들이다.

1. **캐시·부팅**: `index.tsx`, `App.tsx`, `api/queryClient.ts`, `cache/airspaceCacheStore.ts`, `cache/hydrateAirspaceCache.ts`, `queries/airspaceZoneQueryKey.ts`, `queries/useAirspaceZoneQueries.ts`, `store/airspaceCacheSettingStore.ts`, `components/AirspaceCacheMenu.tsx`, `utils/{formatLastUpdated,resolveStaleTimeMs}.ts`
2. **WMS 타일**: `components/AirspaceWmsLayer.tsx`, `utils/{buildWmsTileUrl,chunkTypenames,getVisibleTypenames,getWmsTileBbox,latLngToWebMercator,tileToWcongBounds}.ts`, `store/airspaceFilterStore.ts`, `constants.ts`
3. **WMS 클릭 안내**: `hooks/useZoneClick.ts`, `api/findZoneTypeAtPoint.ts`, `api/fetchAirspaceZonesAtPoint.ts`, `utils/isPointInMultiPolygon.ts`, `components/AirspaceClickPending.tsx`, `components/AirspaceZoneOverlay.tsx`, `hooks/useSelectedZone.ts`, `api/vworldClient.ts`
4. **폴리곤 렌더**: `components/AirspacePolygonLayer.tsx`, `components/AirspacePolygon.tsx`, `utils/{multiPolygonToKakaoPaths,polygonCentroid,tagFeatureZoneType}.ts`, `api/fetchAirspaceZones.ts`
5. **범례·필터·표시 방식 UI**: `components/{AirspaceFilterPanel,AirspaceLegend,AirspaceRenderModeMenu}.tsx`, `store/{airspaceFilterStore,airspaceRenderModeStore}.ts`, `utils/{getGroupCheckState,getVisibleZoneTypes}.ts`
6. **라우팅·페이지**: `routes/router.tsx`, `pages/MapPage.tsx` (`App.tsx`·`index.tsx`는 1번과 겹침)
7. **지도·검색·위치**: `features/map/**`(`MapView`, `MapControls`, `AddressSearch`, `useAddressSearch`, `searchAddressCandidates`, `useCurrentCenter`, `useMapMarker`, `useDebouncedValue`, `types.ts`, `constants.ts`)

전역 앰비언트 선언 `src/env.d.ts`(`ImportMetaEnv`, `*.svg?react`)는 어느 묶음에도 import로 걸리지 않지만 `import.meta.env`를 쓰는 모든 파일(§6)의 타입 계약이므로 환경변수를 건드리는 변경에서 함께 본다.

묶음 사이의 직접 import 연결을 전수 계산한 결과(공용 `constants.ts`/`types.ts` 제외):

- **`MapView.tsx`를 거치는 연결**: 7(지도) → 1, 2, 3, 4, 5 전부. 합성 지점이라 묶음 5개와 모두 이어진다.
- **`MapView`를 거치지 않는 연결 5개** (한 묶음만 보면 놓치는 곳):

| 연결                                                                         | 의미                                                                                                                                      |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1 → 4: `useAirspaceZoneQueries` → `fetchAirspaceZones`, `tagFeatureZoneType` | 캐시·부팅 묶음의 쿼리 훅이 폴리곤 묶음의 조회·태깅 함수에 의존한다.                                                                       |
| 4 → 3: `fetchAirspaceZones` → `vworldClient`                                 | 폴리곤 조회와 WMS 클릭 조회(`fetchAirspaceZonesAtPoint`)가 같은 axios 클라이언트를 공유한다. `vworldClient` 변경은 두 묶음 모두에 닿는다. |
| 2 → 5: `AirspaceWmsLayer` → `airspaceFilterStore`                            | WMS 타일이 범례 필터 스토어에 직접 의존한다(타일 `urlFunc`에서 `getState()`로 읽는 것이 §6의 암묵적 접근).                                |
| 1 → 6: `App.tsx` → `routes/router.tsx`                                       | 부팅 → 라우팅.                                                                                                                            |
| 6 → 7: `pages/MapPage.tsx` → `MapView.tsx`                                   | 라우팅 → 지도.                                                                                                                            |

따라서 어떤 묶음을 먼저 하든 `MapView.tsx`, `features/airspace/constants.ts`, `features/airspace/types.ts`, `api/vworldClient.ts`, `store/airspaceFilterStore.ts`는 여러 묶음에 걸치는 공통 의존으로 함께 검토해야 한다.

## 10. 다음 단계

1. `/dopeboy0608-skills:code-organizer`를 `src` 전체에 적용한다(이슈 요청, 사용자 승인 완료). 로직 변경 없이 import 순서와 훅/상태/이펙트 배치만 정렬한다.
2. 사용자가 `/dopeboy0608-skills:fowler-refactor`를 직접 호출한다(모델 호출 불가 스킬). 호출 시 범위는 "`src` 전체, 이 문서의 의존 그래프와 §6 암묵적 의존 포함, 모듈 단위로 자르지 말 것"으로 지정한다.
3. 제안이 승인되면 묶음 단위로 적용하되, 매 단계마다 `pnpm test` / `pnpm lint` / `npx tsc --noEmit`으로 회귀를 확인한다.

## 11. `code-organizer` 적용 결과 (2026-11-11)

범위: `src` 프로덕션 파일 51개(타입 선언 `*.d.ts`와 테스트·모의 제외). 이동만 했고 이름·로직·주석은 그대로다. 프로젝트에 import 정렬 린트 규칙이 없어(Biome `assist` 비활성) 스킬의 Part 1(import)과 Part 2(본문)를 모두 적용했다. 변경 파일 12개.

**Part 1: import (10개 파일)**

- 이미 대부분 정렬돼 있어 상수·타입을 맨 아래 그룹(5)으로 내리고 그룹 사이 빈 줄을 맞추는 정도였다: `fetchAirspaceZones`, `fetchAirspaceZonesAtPoint`, `findZoneTypeAtPoint`, `hydrateAirspaceCache`, `AirspacePolygonLayer`, `AirspaceWmsLayer`, `useZoneClick`, `useAirspaceZoneQueries`, `MapView`, `routes/router`.
- 스킬이 순서를 정의하지 않은 `api/`, `cache/`, `utils/`는 기존 관례(경로 알파벳 순)를 유지했다.

**Part 2: 컴포넌트·훅 본문 (4개 파일)**

| 파일                  | 변경                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `MapView.tsx`         | 스토어 구독 → 로더·쿼리 훅 → 상태 → ref → 파생값(`useMemo`) → 파생값에 의존하는 훅(`useSelectedZone`, `useZoneClick`) → 이펙트 순으로 재배치 |
| `AddressSearch.tsx`   | 단일 의존 이펙트(`[isOpen]`)를 다중 의존 이펙트 앞으로, 상태에 의존하는 훅 앞 빈 줄                                                          |
| `AirspacePolygon.tsx` | `useCallback` 핸들러를 `useLayoutEffect` 위로                                                                                                |
| `useZoneClick.ts`     | `useCallback` 핸들러(`onMapClick`)를 마운트 이펙트 위로                                                                                      |

**검증**: 변경 전후 줄 집합이 12개 파일 모두 동일(이동만 있음), `pnpm lint`, `npx tsc --noEmit`, `pnpm test`(238개), `prettier --check` 통과. 줄 집합 비교만으로는 효과가 중간에서 잘리는 편집 오류를 잡지 못했고(작업 중 한 번 발생해 테스트와 린트가 잡았다), 최종 보증은 위 네 가지 검사다.

**이동하지 않고 제안으로 남긴 항목** (스킬: 경계가 모호하면 옮기지 않는다)

1. `@tanstack/react-query`: 스킬 예시는 라우터를 그룹 2, 외부 패키지를 그룹 1로 두지만 쿼리 라이브러리는 "API 클라이언트/쿼리 훅"으로 그룹 2일 수도 있어 그룹 1에 그대로 두었다.
2. `import type`을 외부 패키지에서 가져오는 경우(`hydrateAirspaceCache`의 `QueryClient`): 스킬은 `import type`을 그룹 5-b에 두라고 하지만 프로젝트 타입이 아니어서 옮기지 않았다.
3. `@/pages/*`, `@/routes/*`, `./App` 등 스킬이 계층으로 정의하지 않은 모듈(`routes/router.tsx`, `App.tsx`, `index.tsx`): 위치 변경 없음. `App.tsx`·`index.tsx`는 상대 경로(`./`)라 다른 파일과 스타일이 다르다.
4. `AirspaceWmsLayer`의 `useMap()`(컨텍스트)과 `useAirspaceFilterStore`(스토어)는 둘 다 1a 블록이라 기존 순서를 유지했다.
5. 테스트 파일 36개: 이번 범위에서 제외했다(프로덕션 54개 기준 요청).

## 12. `fowler-refactor` 적용 결과 (2026-11-11)

제안서의 P1~~P11을 모두 적용했다(P6은 핸들러 추출과 훅 이동). 1차는 P1~~P7, 2차는 P6(b), P8~P11이다. 증상·원인·개선 방안·Before/After는 [`51-code-smell-study.md`](./51-code-smell-study.md)에 정리했다. 항목마다 커밋을 나눴고 각 커밋이 단독으로 테스트와 타입 검사를 통과한다.

**구조 변화**

- 새 파일: `bootstrap.tsx`(부팅 로직), `constants/toast.ts`(공용 상수 디렉터리가 처음 생김), `features/airspace/api/requestAirspaceFeatures.ts`(WFS 요청 공통 함수), `features/airspace/utils/wmsTilesets.ts`(타일셋 등록·슬롯 규칙), `features/airspace/hooks/useLatestRequest.ts`("마지막 요청만 반영"), `features/airspace/hooks/useAirspaceMapInteraction.ts`(필터·선택·클릭 연결).
- `constants.ts`는 위험도 순서의 표 하나(`ZONE_TYPES`)에서 `AIRSPACE_ZONE_CONFIGS`와 `TYPENAME_ZONE_LABELS`를 파생한다(export 이름·값·순서 동일). §6의 "정의가 두 곳"과 "키 삽입 순서의 의미"는 구조로 해소됐고, 순서의 의미는 `constants.test.ts`가 고정한다.
- `WMS_TILE_SIZE`를 공유해 §6의 "타일 크기" 결합이 해소됐다. 쿼리 키 공유, 전역 `kakao`, 훅 밖 `getState()`, 싱글턴, 암묵적 저장소는 그대로다(이번 범위 밖).
- `index.tsx`는 `bootstrap`만 호출한다. `App.tsx`·`index.tsx`의 상대 경로 import를 `@/` 별칭으로 통일해 상대 경로 import는 0개다.
- `MapView`는 필터·선택·클릭 처리를 `useAirspaceMapInteraction` 하나로 호출한다. `findZoneTypeAtPoint`는 `linkAbortSignals`·`startPointQueries`로, `useAirspaceZoneQueries`는 `getCachePolicy`·`useZoneErrorToasts`·`formatFreshMessage`로 분해했다.

**적용 후 수치** (적용 전 → 후)

| 항목                      | 적용 전    | 적용 후                      |
| ------------------------- | ---------- | ---------------------------- |
| 프로덕션 파일 / 줄        | 54 / 2,432 | 60 / 2,553                   |
| 테스트 파일 / 줄          | 39 / 3,781 | 44 / 4,161                   |
| 테스트 개수               | 238        | 260                          |
| 순환 의존                 | 없음       | 없음                         |
| `MapView` 팬아웃          | 20         | **18**                       |
| `map` → `airspace` import | 15         | **12**                       |
| 직접 테스트 없는 파일     | 9          | 9 (스크립트 기준, 아래 참고) |

**정직하게 적을 점**

- `MapView` 팬아웃은 1차(P6 핸들러 추출) 뒤 오히려 21로 늘었다(핸들러에 쓰는 타입 import 추가). 2차에서 책임을 `useAirspaceMapInteraction`으로 옮긴 뒤에야 18로 줄었다. 이름 붙이기만으로는 의존이 줄지 않았다.
- "직접 테스트 없음"이 그대로 9개인 이유: 일부(`fetchAirspaceZones`)는 특성 테스트로 해소됐지만, 새로 만든 파일 중 `constants/toast.ts`, `requestAirspaceFeatures.ts`, `wmsTilesets.ts`는 이를 쓰는 기존 테스트로 간접 검증될 뿐 직접 테스트가 없다. `App.tsx`는 `bootstrap.test`에서 모킹만 되어 스크립트 목록에서는 빠지지만 실질적으로 미검증이다. 여전히 직접 테스트가 없는 기존 파일: `AirspacePolygon`, `AirspaceRenderModeMenu`, `MapControls`, `useDebouncedValue`, `MapPage`, `router`.
- 공개 인터페이스: export 이름 목록을 전후로 비교해 제거·개명이 없음을 확인했다. 추가된 export는 `WMS_TILE_SIZE`, `requestAirspaceFeatures`, `bootstrap`, `wmsTilesets`의 네 심볼, `useLatestRequest`, `useAirspaceMapInteraction`, 토스트 상수 2개다.
- 후속 과제(F1, **이슈 #94에서 수정됨**): `useZoneClick`의 원래 주석은 "모드를 바꾸거나 언마운트되면 조회를 끊는다"였지만 코드는 언마운트에서만 끊는다. 프로브로 원본과 현재가 같은 동작임을 확인했고, 동작을 바꾸는 수정이라 이번에는 고치지 않았다(주석만 코드에 맞췄다).
- 묶음 간 직접 연결(`MapView`를 거치지 않는 것): §9의 **5개에서 8개로 늘었다.** 책임이 `MapView`에서 airspace 안으로 이동하면서 airspace 내부 묶음 사이의 연결이 드러났기 때문이다. 현재의 8개: 캐시·부팅→라우팅(`App`→`router`), 폴리곤→WMS 클릭(`fetchAirspaceZones`→`requestAirspaceFeatures`), WMS 타일→범례(`AirspaceWmsLayer`·`wmsTilesets`→`airspaceFilterStore`), WMS 클릭→범례(`useAirspaceMapInteraction`→`getVisibleZoneTypes`, 표시 방식 스토어), WMS 클릭→WMS 타일(`useAirspaceMapInteraction`→`getVisibleTypenames`), 캐시·부팅→폴리곤(`useAirspaceZoneQueries`→`fetchAirspaceZones`·`tagFeatureZoneType`), 범례→WMS 타일(`getVisibleZoneTypes`→`getVisibleTypenames`, P2로 생김), 라우팅→지도(`MapPage`→`MapView`). `MapView`의 팬아웃과 map→airspace import는 줄었지만, 전체 결합이 줄었다고 말할 수는 없다. 결합의 위치가 바뀌었다.
