---
description: 'Task list for 지도 표시 고도화 — 구역 세분화 표시'
---

# Tasks: 지도 표시 고도화 — 구역 세분화 표시

**Input**: Design documents from `/specs/002-airspace-zone-detail/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: plan.md Technical Context에 따라 순수 함수(`tagFeatureZoneType`, `polygonCentroid`)는 TDD로 테스트를 먼저 작성한다. React 컴포넌트/Kakao SDK 의존 코드는 TDD 대상이 아니며 quickstart.md 수동 검증으로 확인한다.

**Organization**: spec.md의 User Story 우선순위(US1=P1, US3=P1, US2=P2) 순서로 구성한다. US1과 US3는 둘 다 P1이지만, US3(클릭 식별)가 US1(신규 구역 표시)이 만든 데이터 파이프라인 위에서 동작하므로 US1 → US3 순으로 배치한다.

## Path Conventions

단일 프론트엔드 프로젝트(`src/features/airspace/`) — plan.md Project Structure 참고.

## Phase 1: Setup

해당 없음 — 기존 프로젝트 구조를 확장하는 작업이라 신규 셋업이 없다.

## Phase 2: Foundational

해당 없음 — 이 기능을 막는 선행 인프라 작업이 없다(#31처럼 순수 CSS 수정도 아니고, 기존 쿼리/컴포넌트 구조를 그대로 확장).

## Phase 3: User Story 1 — 사용자가 더 많은 종류의 규제구역을 지도에서 확인할 수 있다 (P1)

**Goal**: 신규 7개 typename이 기존 3색 그룹 체계 안에서 지도에 표시된다 (spec FR-001/FR-002).

**Independent Test**: quickstart.md 1단계 — 신규 typename이 존재하는 지역으로 지도를 이동해 폴리곤이 올바른 색상으로 렌더링되는지 확인.

- [x] T001 [US1] `src/features/airspace/constants.ts`의 `AIRSPACE_ZONE_CONFIGS`에서 그룹별 `typenames`를 data-model.md 매핑대로 확장: `prohibited`에 `lt_c_aistemp`, `lt_c_aisdngc` 추가 / `restricted`에 `lt_c_aisaltc`, `lt_c_aisatzc`, `lt_c_aisfldc`, `lt_c_wgisnpgug` 추가 / `available`에 `lt_c_aisdronezone` 추가
- [ ] T002 [US1] `pnpm dev`로 실행 후 quickstart.md 1단계대로 신규 구역(국립공원/위험구역/드론시범사업구역 등)이 존재하는 위치에서 폴리곤이 올바른 색상으로 표시되는지 수동 확인

**Checkpoint**: T001~T002 완료 시 신규 구역이 지도에 보이는 상태로 US1 단독 배포 가능.

---

## Phase 4: User Story 3 — 사용자가 같은 색상 안에서도 정확한 구역 종류를 구분할 수 있다 (P1)

**Goal**: 폴리곤 클릭 시 정확한 구역 종류 명칭이 표시된다 (spec FR-007).

**Independent Test**: quickstart.md 2단계 — 같은 색상 그룹의 서로 다른 두 구역을 각각 클릭했을 때 다른 라벨이 뜨는지 확인.

- [x] T003 [P] [US3] `src/features/airspace/utils/tagFeatureZoneType.test.ts`에 실패하는 테스트 작성(TDD): typename과 feature 배열을 받아 각 feature에 `zoneType` 필드를 주입하는지, 매핑에 없는 typename이면 에러를 던지는지 검증 (data-model.md "순수 함수: tagFeatureZoneType" 참고)
- [x] T004 [US3] `src/features/airspace/constants.ts`에 `TYPENAME_ZONE_LABELS`(typename → 한글 구역 종류 라벨) 상수 추가 — data-model.md "Zone Type Label Map" 표 그대로
- [x] T005 [US3] `src/features/airspace/utils/tagFeatureZoneType.ts` 구현해 T003 테스트를 통과시킴
- [x] T006 [US3] `src/features/airspace/types.ts`의 `VWorldFeature`에 `zoneType: string` 필드 추가
- [x] T007 [US3] `src/features/airspace/queries/useAirspaceZoneQueries.ts`의 `fetchZoneGroup`에서 typename별 응답에 `tagFeatureZoneType`을 적용한 뒤 그룹으로 병합하도록 수정
- [x] T008 [US3] `src/features/airspace/components/AirspaceZoneOverlay.tsx` 신규 생성: 클릭 위치에 `zoneType` 텍스트를 보여주는 Kakao `CustomOverlay` 컴포넌트
- [x] T009 [US3] `src/features/airspace/components/AirspacePolygonLayer.tsx`에 `Polygon`의 `onClick` 핸들러 추가 — 클릭된 feature를 로컬 상태로 관리하고 `AirspaceZoneOverlay`를 클릭 위치에 렌더링
- [ ] T010 [US3] quickstart.md 2단계대로 같은 색상 그룹 내 서로 다른 구역(예: 비행금지 vs 위험구역, 관제권 vs 경계구역)을 각각 클릭해 다른 라벨이 뜨는지 수동 확인

**Checkpoint**: T001~T010 완료 시 두 P1 스토리(US1, US3)가 모두 충족된 MVP.

---

## Phase 5: User Story 2 — 사용자가 구역의 식별 번호를 확인할 수 있다 (P2)

**Goal**: 비행금지/제한구역에 구역 식별 번호가 라벨로 표시된다 (spec FR-003).

**Independent Test**: quickstart.md 3단계 — 비행금지/제한구역에서 번호 라벨(`RK P73A`, `R75` 등)이 보이는지 확인.

- [x] T011 [P] [US2] `src/features/airspace/utils/polygonCentroid.test.ts`에 실패하는 테스트 작성(TDD): `kakao.maps.LatLng[][]`(외곽 ring)을 받아 대표 좌표(중심점) 하나를 반환하는지 검증 — 라벨을 그릴 위치 계산용
- [x] T012 [US2] `src/features/airspace/utils/polygonCentroid.ts` 구현해 T011 테스트를 통과시킴 (단순 평균 좌표 방식으로 충분 — 정밀 geometric centroid 불필요)
- [x] T013 [US2] `src/features/airspace/components/AirspacePolygonLayer.tsx`에서 `prohibited`/`restricted` 그룹이고 `properties.prh_lbl_1` 또는 `properties.res_lbl_1`이 존재하는 feature에 한해, `polygonCentroid`로 계산한 위치에 번호 텍스트를 `CustomOverlay`로 렌더링
- [ ] T014 [US2] quickstart.md 3단계대로 비행금지/제한구역에서 번호 라벨이 보이는지 수동 확인

**Checkpoint**: T001~T014 완료 시 세 User Story 모두 충족.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T015 quickstart.md 4단계대로 특정 typename 조회 실패 시 해당 그룹만 렌더링 생략되고 나머지는 정상 표시되는지(기존 #14 장애 격리 정책 유지) 확인
- [x] T016 [P] `pnpm format`과 `pnpm lint` 실행해 포맷/린트 정리 (CLAUDE.md "코드 작성 후 규칙")
- [x] T017 `pnpm test` 실행해 `tagFeatureZoneType`/`polygonCentroid` 신규 테스트를 포함한 전체 스위트 통과 확인 — 4 test files / 13 tests 전부 통과, `pnpm build`도 정상 완료

## Dependencies & Execution Order

- Phase 3(US1) → Phase 4(US3): US3의 클릭 식별은 US1에서 확장된 typenames가 실제로 조회되고 있어야 의미가 있다.
- Phase 4(US3) 내부: T003(테스트) → T004,T005(구현) → T006 → T007 → T008 → T009 → T010(검증) 순서로 진행한다. T004는 T003과 파일이 달라 병렬 가능([P] 표시).
- Phase 5(US2)는 Phase 3 이후 독립적으로 진행 가능하며, Phase 4와도 파일이 겹치지 않는 범위(T011, T012)는 병렬 가능하다. 단 T013은 T009(AirspacePolygonLayer 수정)와 같은 파일이라 US3의 컴포넌트 변경이 끝난 뒤 진행한다.
- Phase 6(Polish)은 모든 User Story 완료 후 진행한다.

## Implementation Strategy

**MVP 범위**: T001~~T010 (US1 + US3, 둘 다 P1)까지 완료하면 신규 구역이 보이고 클릭으로 정확한 종류까지 구분되는 배포 가능한 상태가 된다. T011~~T014(US2, 구역 번호 라벨)는 부가 정보라 이후 독립적으로 이어서 진행 가능하다.
