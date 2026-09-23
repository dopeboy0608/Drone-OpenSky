# Implementation Plan: 지도 표시 고도화 — 구역 세분화 표시

**Branch**: `feature/24-airspace-zone-detail` (spec dir: `002-airspace-zone-detail`) | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-airspace-zone-detail/spec.md`

## Summary

기존 `AIRSPACE_ZONE_CONFIGS`(3그룹: prohibited/restricted/available, typename 4개)에 신규 7개 typename을 spec FR-002 매핑대로 추가한다. 그룹별로 여러 typename을 합쳐 조회하는 기존 구조(`fetchZoneGroup`)는 유지하되, 병합 과정에서 각 feature에 "정확한 구역 종류" 메타데이터(typename + 한글 라벨)를 태깅해 FR-007(클릭 시 정확한 구역 종류 노출)을 구현할 수 있게 한다. `AirspacePolygonLayer`에 클릭 핸들러를 추가해 클릭한 폴리곤의 구역 종류 라벨을 보여주는 최소 UI(오버레이/툴팁)를 추가한다. 비행금지/제한구역은 기존 응답 필드(`prh_lbl_1`/`res_lbl_1`)를 이용해 구역 번호 라벨도 지도에 표시한다.

## Technical Context

**Language/Version**: TypeScript 7.0.2, React 19.2

**Primary Dependencies**: `react-kakao-maps-sdk`(Polygon, CustomOverlay), `@tanstack/react-query`(useQueries, 기존 패턴 재사용), antd(기존 에러 토스트 패턴 재사용). 신규 의존성 추가 없음.

**Storage**: N/A (VWorld WFS 원격 조회, 클라이언트 상태만 사용)

**Testing**: Vitest. 이번 변경 중 TDD 대상(ARCHITECTURE.md 기준: 입출력이 명확하고 부수효과 없는 순수 함수)에 해당하는 부분은 **typename → 구역 종류 라벨 매핑 함수**와 **VWorld feature에 zoneType을 태깅하는 병합 함수**(순수 함수로 분리 가능)다. 이 두 함수는 TDD로 먼저 테스트를 작성한다. `AirspacePolygonLayer`의 클릭 인터랙션(Kakao Polygon 렌더링 + 오버레이 표시)은 기존 컴포넌트들과 동일하게 React 컴포넌트/Kakao SDK 의존 코드라 TDD 대상이 아니며, 수동 검증(quickstart.md)으로 확인한다.

**Target Platform**: 웹 브라우저(데스크톱/모바일) — 기존과 동일

**Project Type**: 단일 프론트엔드 웹 앱 (`src/features/airspace`)

**Performance Goals**: 신규 group(승인후비행가능)에 typename이 4개 → 7개로 늘어나 병렬 호출 수가 증가한다. 그룹당 `Promise.all`로 병렬 조회하는 기존 패턴을 유지해 순차 대기로 인한 지연을 피한다.

**Constraints**: 기존 3색 그룹 체계(FR-001)를 유지하며 UI상 색상 팔레트를 늘리지 않는다. 담당자 연락처 등 전체 정보 패널은 범위 밖(#27).

**Scale/Scope**: `src/features/airspace/` 내 4~5개 파일 수정/추가. 새 디렉터리 구조 변경 없음.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

`.specify/memory/constitution.md`는 아직 템플릿 상태라 `CLAUDE.md`를 게이트로 사용한다(#31 plan.md와 동일 방침).

- [x] 범위 준수: CLAUDE.md 1단계 범위(지도 뷰 + 공공 API 폴리곤 표시) 내. 로그인/DB 등 범위 밖 기능 없음.
- [x] 스택 준수: 신규 라이브러리 없음. 기존 TanStack Query/axios/Kakao SDK 패턴 재사용.
- [x] 테스트 하네스 기준: typename→라벨 매핑, feature 태깅 함수는 순수 함수라 TDD 대상(ARCHITECTURE.md 기준 부합). VWorld 호출은 기존과 동일한 `vworldClient`를 재사용하므로 신규 axios 로직이 아니며 별도 MSW 테스트 추가는 필요 없음(기존 `fetchAirspaceZones` 재사용, 신규 typename만 추가).
- [x] 복잡도: 기존 그룹/타입 구조를 확장하는 수준으로, 새로운 추상화 계층을 도입하지 않는다.

위반 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/002-airspace-zone-detail/
├── spec.md               # 완료 (/speckit-specify, Clarifications 포함)
├── plan.md               # 이 파일 (/speckit-plan)
├── research.md           # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output (수동 검증 가이드)
├── checklists/
│   └── requirements.md   # 완료, 전 항목 통과
└── tasks.md              # Phase 2 output (/speckit-tasks에서 생성 예정)
```

`contracts/`는 생성하지 않는다 — 이 기능은 외부에 노출하는 API/CLI 계약이 없고, VWorld는 기존에 이미 소비 중인 외부 API라 신규 계약 정의 대상이 아니다.

### Source Code (repository root)

```text
src/features/airspace/
├── constants.ts                     # 수정: AIRSPACE_ZONE_CONFIGS의 typenames 확장(그룹당),
│                                     #        신규 TYPENAME_ZONE_LABELS(typename → 한글 구역명) 추가
├── types.ts                         # 수정: VWorldFeature에 클라이언트 태깅 필드(zoneType) 추가,
│                                     #        AirspaceZoneLevel은 기존 3값 유지
├── utils/
│   ├── multiPolygonToKakaoPaths.ts  # 변경 없음
│   └── tagFeatureZoneType.ts        # 신규(순수 함수, TDD): feature + typename → zoneType 태깅
├── queries/
│   └── useAirspaceZoneQueries.ts    # 수정: fetchZoneGroup에서 typename별로 태깅 함수 적용 후 병합
├── components/
│   ├── AirspacePolygonLayer.tsx     # 수정: Polygon onClick 추가, 선택된 feature의 zoneType을
│   │                                 #        보여주는 오버레이 렌더링
│   ├── AirspaceZoneOverlay.tsx      # 신규: 클릭한 폴리곤의 구역 종류 라벨을 보여주는 CustomOverlay
│   └── AirspaceLegend.tsx           # 변경 없음(#25 범위)
```

**Structure Decision**: 기존 `src/features/airspace/*` 구조를 그대로 확장한다. 새 하위 디렉터리 없이 기존 폴더(constants/types/utils/queries/components)에 파일을 추가/수정하는 수준으로 제한한다.

## Complexity Tracking

해당 없음 — Constitution Check 위반 없음.
