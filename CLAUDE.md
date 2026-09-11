# CLAUDE.md

## 프로젝트 목적 / 현재 범위

드론 비행 가능/제한/불가 구역을 실시간 지도 기반으로 제공하는 서비스. 현재 구현 범위는 Kakao Map 지도 뷰 위에 공공 API 데이터를 폴리곤으로 표시하는 것까지다. 필터, 로그인, DB, AI 추천, 커뮤니티 기능은 아직 범위 밖이다 (자세한 내용은 [ROADMAP.md](./ROADMAP.md), [ARCHITECTURE.md](./ARCHITECTURE.md#out-of-scope-future) 참고). 범위 밖 기능을 임의로 구현하지 않는다.

## 명령어

- `pnpm dev` — 개발 서버 실행
- `pnpm build` — 프로덕션 빌드
- `pnpm preview` — 프로덕션 빌드 로컬 미리보기
- `pnpm lint` — ESLint 검사
- `pnpm lint:fix` — ESLint 자동 수정
- `pnpm format` — Prettier로 코드 포맷

## 코드 작성 후 규칙

코드를 작성하거나 수정한 뒤에는 커밋 전에 `pnpm format`(Prettier)과 `pnpm lint`를 실행해 포맷/린트 이슈를 정리한다. husky + lint-staged pre-commit 훅이 커밋 시 변경 파일에 대해 이를 자동 실행한다.

## 참고 문서

- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt

## 디렉터리 구조

```
src/
  pages/                    # 라우트가 렌더링하는 화면 컴포넌트
    MapPage.tsx
  features/
    map/                    # 도메인: Kakao Map 초기화/컨테이너
      components/
      hooks/
      queries/              # 도메인 전용 TanStack Query 훅 (필요 시)
      store/                # 도메인 전용 zustand (필요 시)
      types.ts              # 도메인 전용 타입 (필요 시)
      constants.ts          # 도메인 전용 상수 (필요 시)
    airspace/                # 도메인: 공공 API 폴리곤(GeoJSON → Kakao Map Polygon) 조회/렌더링 (범위 확장 시)
  components/               # 여러 feature가 공유하는 순수 공용 UI 컴포넌트
  routes/                   # TanStack Router 라우트 정의(경로/loader). pages/를 얇게 렌더링만 한다
  api/                      # axios 인스턴스 등 공통 API 클라이언트 (도메인 전용 조회 훅은 features/*/queries)
  store/                    # 전역 zustand 스토어 (도메인 전용 상태는 features/*/store)
  types/                    # 여러 도메인이 공유하는 타입
  constants/                # 여러 도메인이 공유하는 상수
  assets/                   # svg/이미지 등 정적 에셋
docs/draft/                 # 장기 비전 초안 (참고용, 현재 범위 아님)
```

코드 정렬(import 순서, 컴포넌트 내부 훅/상태/이펙트 구조) 규칙은 `/code-organizer` 스킬(`.claude/skills/code-organizer/SKILL.md`) 참고.

## 기술 스택

- React + TypeScript, 빌드 도구: rsbuild
- 패키지 매니저: pnpm (npm/yarn 명령 사용 금지)
- 지도: Kakao Map API (`react-kakao-maps-sdk`)
- 스타일: Tailwind CSS(레이아웃/spacing) + Ant Design(컴포넌트, theme token으로 커스터마이즈). Tailwind로 antd 내부 스타일을 직접 오버라이드하지 않는다.
- 상태 관리: zustand
- 라우팅: TanStack Router
- 데이터 조회: 기본은 axios 직접 사용. 호출 로직은 그대로 컴포넌트/훅에 두지 않고 API 호출 유틸 함수로 만들어 사용한다. 캐싱, 재시도, 백그라운드 리페치 등 TanStack Query의 기능이 필요하다고 판단되면 임의로 도입하지 말고 먼저 사용자에게 제안하고 동의를 받은 뒤 적용한다. axios 인스턴스는 `api/` 아래에서만 생성한다.

## 금지 사항

- API 키를 코드에 하드코딩하지 않는다. `.env`의 `VITE_` 접두 환경 변수로 관리한다.
- 현재 범위(1단계) 밖의 기능(로그인, DB, AI 추천 등)을 별도 논의 없이 구현하지 않는다.
