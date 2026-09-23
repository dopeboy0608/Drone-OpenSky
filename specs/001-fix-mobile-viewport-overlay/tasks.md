---
description: 'Task list for 모바일 뷰포트 하단 플로팅 요소 노출 수정'
---

# Tasks: 모바일 뷰포트 하단 플로팅 요소 노출 수정

**Input**: Design documents from `/specs/001-fix-mobile-viewport-overlay/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: spec.md/plan.md에서 명시한 대로 이 기능은 TDD 대상(순수 함수)이 아니며, JSDOM으로 모바일 동적 뷰포트를 재현할 수 없어 자동 회귀 테스트를 추가하지 않는다. 대신 quickstart.md의 수동 검증 절차로 확인한다.

**Organization**: 두 User Story(P1: 범례 노출, P2: 축척 노출) 모두 동일한 단일 CSS 수정으로 해결되므로 Phase 3에서 함께 구현하고, 각 스토리별 독립 검증 태스크로 분리했다.

## Path Conventions

단일 프론트엔드 프로젝트(`src/`) — plan.md Project Structure 참고.

## Phase 1: Setup

해당 없음 — 기존 프로젝트에 새 의존성/구조를 추가하지 않는다 (research.md 참고).

## Phase 2: Foundational

해당 없음 — 이 변경을 막는 선행 인프라 작업이 없다.

## Phase 3: User Story 1 — 모바일에서 범례를 항상 확인할 수 있다 (P1)

**Goal**: 우하단 `AirspaceLegend`가 모바일 브라우저에서 주소창 상태와 무관하게 항상 화면 안에 보인다.

**Independent Test**: quickstart.md 2~3단계(모바일 에뮬레이션/실기기) — 페이지 로드 직후와 주소창 축소 이후 모두 범례 패널 전체가 보이는지 확인.

- [x] T001 [US1] `src/pages/MapPage.tsx`의 컨테이너 클래스를 `h-screen w-screen`에서 `h-dvh w-dvw`로 교체 (research.md "컨테이너 크기 단위" 결정 반영)
- [ ] T002 [US1] 브라우저 개발자도구 모바일 에뮬레이션(iPhone 프리셋)에서 우하단 `AirspaceLegend`가 페이지 로드 직후 화면 안에 보이는지 수동 확인 (quickstart.md 2단계)
- [ ] T003 [US1] 실기기(iOS Safari 또는 Android Chrome)에서 주소창 펼침/축소 양쪽 상태 모두 범례가 화면 안에 보이는지 수동 확인 (quickstart.md 3단계)

**Checkpoint**: T001~T003 완료 시 US1(P1) 단독으로 배포 가능한 MVP.

---

## Phase 4: User Story 2 — 모바일에서 지도 축척을 항상 확인할 수 있다 (P2)

**Goal**: 좌하단 Kakao 지도 기본 축척 표시가 모바일 브라우저에서 항상 화면 안에 보인다.

**Independent Test**: quickstart.md 2~3단계에서 축척 표시 위치를 동일하게 확인.

**Dependencies**: T001(US1)에서 적용한 컨테이너 크기 수정을 그대로 사용 — 추가 코드 변경 없음.

- [ ] T004 [US2] 브라우저 개발자도구 모바일 에뮬레이션에서 좌하단 Kakao 축척 표시가 화면 안에 보이는지 수동 확인 (quickstart.md 2단계)
- [ ] T005 [US2] 실기기에서 지도를 확대/축소하며 축척 표시가 계속 화면 안에 보이는지 수동 확인 (quickstart.md 3단계)

**Checkpoint**: T001~T005 완료 시 두 User Story 모두 충족.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T006 데스크톱 브라우저에서 기존 레이아웃(지도가 뷰포트 전체를 채우는 동작)에 회귀가 없는지 확인 (quickstart.md 1단계, spec.md FR-004/SC-002)
- [x] T007 [P] `pnpm format`과 `pnpm lint` 실행해 포맷/린트 정리 (CLAUDE.md "코드 작성 후 규칙")
- [x] T008 `pnpm test` 실행해 기존 스위트 회귀 없음 확인 (spec.md SC-003) — 2 test files / 8 tests 전부 통과

## Dependencies & Execution Order

- Phase 3(US1) → Phase 4(US2): US2 태스크는 US1에서 적용한 코드 변경을 전제로 검증만 수행하므로 T001 이후에 진행한다.
- Phase 5(Polish)는 T001~T005 완료 후 진행한다.
- T007([P])은 T001 이후 다른 검증 태스크와 병렬로 진행 가능하다.

## Implementation Strategy

**MVP 범위**: T001~~T003 (US1, P1)만으로도 이슈 #31의 핵심 증상(범례 미노출)이 해결된 배포 가능한 상태가 된다. T004~~T005(US2)는 동일 수정으로 자동 해결되는 축척 문제의 검증 단계라 별도 구현 없이 바로 이어서 진행 가능하다.
