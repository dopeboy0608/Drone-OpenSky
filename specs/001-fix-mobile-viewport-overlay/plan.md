# Implementation Plan: 모바일 뷰포트 하단 플로팅 요소 노출 수정

**Branch**: `bug/31-mobile-viewport-overlay` (spec dir: `001-fix-mobile-viewport-overlay`) | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-fix-mobile-viewport-overlay/spec.md`

## Summary

`src/pages/MapPage.tsx`가 정적 뷰포트 단위(`h-screen w-screen` = `100vh`/`100vw`)를 사용해, 모바일 브라우저에서 주소창 등 브라우저 UI가 실제로 차지하는 영역만큼 지도 컨테이너가 화면보다 커진다. 이로 인해 우하단 `AirspaceLegend`와 Kakao 지도 기본 축척 표시(좌하단)가 화면 밖으로 밀려 보이지 않는다. 동적 뷰포트 단위(`h-dvh`, `w-dvw`)로 전환해 컨테이너 크기를 실제 보이는 영역에 맞춘다.

## Technical Context

**Language/Version**: TypeScript 7.0.2, React 19.2

**Primary Dependencies**: Tailwind CSS 4.3(레이아웃), react-kakao-maps-sdk(Kakao Maps SDK 래퍼), antd 6(UI 컴포넌트) — 이번 수정은 신규 의존성을 추가하지 않는다.

**Storage**: N/A

**Testing**: Vitest(`pnpm test`). 이번 변경은 CSS 클래스 교체 수준의 레이아웃 수정으로, ARCHITECTURE.md "TDD 적용 기준" 상 순수 함수가 아니라 TDD 대상이 아니다. Kakao Maps SDK를 로딩하는 `MapView`/`MapPage`는 실제 렌더된 화면의 시각적 크기를 검증해야 하는데, JSDOM 환경에서는 브라우저의 동적 뷰포트(주소창 표시/축소) 자체를 재현할 수 없어 자동화 테스트로 회귀를 보장하기 어렵다. 따라서 이 기능은 수동 검증(브라우저 개발자도구 모바일 에뮬레이션 + 실기기 확인)으로 검증하고, 기존 `pnpm test` 스위트는 회귀 없음만 확인한다. E2E(Playwright) 도입은 CLAUDE.md 방침상 별도 제안 없이 도입하지 않는다.

**Target Platform**: 모바일 웹 브라우저(iOS Safari, Android Chrome 우선) + 기존 데스크톱 브라우저(회귀 없어야 함)

**Project Type**: 단일 프론트엔드 웹 앱 (`src/pages`, `src/features`)

**Performance Goals**: 해당 없음 (레이아웃 수정, 성능 영향 없음)

**Constraints**: 브라우저 User-Agent 분기 없이 CSS만으로 해결 (spec FR-005)

**Scale/Scope**: `src/pages/MapPage.tsx` 1개 파일의 클래스 변경 수준. 범위 확장 없음.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

이 레포에는 아직 `/speckit-constitution`으로 채워진 프로젝트 constitution이 없다(템플릿 상태). 대신 `CLAUDE.md`가 사실상의 운영 원칙 역할을 하므로 이를 게이트로 사용한다.

- [x] 범위 준수: `CLAUDE.md` 1단계 범위(지도 뷰 + 공공 API 폴리곤 표시) 내의 버그 수정이며, 로그인/DB/AI 추천 등 범위 밖 기능을 건드리지 않는다.
- [x] 스택 준수: 새 라이브러리 도입 없이 기존 Tailwind 유틸리티(`h-dvh`, `w-dvw`)만 사용한다.
- [x] 테스트 하네스 기준: 위 Technical Context에서 밝힌 대로 이 변경은 TDD/MSW/Kakao SDK 모킹 대상 기준(ARCHITECTURE.md)에 해당하지 않아 수동 검증으로 대체하며, 임의로 E2E를 도입하지 않는다.
- [x] 복잡도: 단일 파일의 CSS 클래스 교체 수준으로, 추가 구조/추상화가 필요 없다.

위반 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-mobile-viewport-overlay/
├── spec.md               # 완료 (/speckit-specify)
├── plan.md               # 이 파일 (/speckit-plan)
├── research.md           # Phase 0 output
├── quickstart.md         # Phase 1 output (수동 검증 가이드)
├── checklists/
│   └── requirements.md   # 완료, 전 항목 통과
└── tasks.md              # Phase 2 output (/speckit-tasks에서 생성 예정)
```

`data-model.md`, `contracts/`는 생성하지 않는다 — 이 기능은 데이터 엔티티나 외부 인터페이스(API/CLI 계약)를 다루지 않는 순수 레이아웃 수정이기 때문이다.

### Source Code (repository root)

```text
src/
├── pages/
│   └── MapPage.tsx              # 수정 대상: h-screen w-screen → h-dvh w-dvw
├── features/
│   ├── map/components/MapView.tsx        # 참고만, 수정 없음 (이미 h-full/w-full로 부모를 채움)
│   └── airspace/components/AirspaceLegend.tsx  # 참고만, 수정 없음 (absolute bottom-4 right-4 유지)
```

**Structure Decision**: 기존 디렉터리 구조(`src/pages`, `src/features/*`)를 그대로 따르며 새 디렉터리를 만들지 않는다. 수정은 `src/pages/MapPage.tsx` 한 곳에 국한된다(대안 검토는 research.md 참고).

## Complexity Tracking

해당 없음 — Constitution Check 위반 없음.
