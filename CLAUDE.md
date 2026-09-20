# CLAUDE.md

## 프로젝트 목적 / 현재 범위

드론 비행 가능/제한/불가 구역을 실시간 지도 기반으로 제공하는 서비스. 현재 구현 범위는 Kakao Map 지도 뷰 위에 공공 API 데이터를 폴리곤으로 표시하는 것까지다. 필터, 로그인, DB, AI 추천, 커뮤니티 기능은 아직 범위 밖이다 (자세한 내용은 [ROADMAP.md](./docs/ROADMAP.md), [ARCHITECTURE.md](./docs/ARCHITECTURE.md#out-of-scope-future) 참고). 범위 밖 기능을 임의로 구현하지 않는다.

## 명령어

- `pnpm dev` — 개발 서버 실행
- `pnpm build` — 프로덕션 빌드
- `pnpm preview` — 프로덕션 빌드 로컬 미리보기
- `pnpm lint` — ESLint 검사
- `pnpm lint:fix` — ESLint 자동 수정
- `pnpm format` — Prettier로 코드 포맷
- `pnpm test` — Vitest 실행 (watch 모드 없음, 1회 실행)

## 코드 작성 후 규칙

코드를 작성하거나 수정한 뒤에는 커밋 전에 `pnpm format`(Prettier)과 `pnpm lint`를 실행해 포맷/린트 이슈를 정리한다. husky + lint-staged pre-commit 훅이 커밋 시 변경 파일에 대해 이를 자동 실행한다.

## 테스트 하네스 적용 기준

별도 요청이 없어도 아래 상황에 해당하면 자동으로 적용한다 (이슈 #11, [ARCHITECTURE.md](./docs/ARCHITECTURE.md) 참고).

- 새 기능을 시작하기 전에는 [docs/spec/TEMPLATE.md](./docs/spec/TEMPLATE.md)를 복사해 `docs/spec/<이슈번호>-<기능명>.md`로 스펙(입력/기대 동작/엣지케이스)을 먼저 정리한다.
- 입출력이 명확하고 부수효과 없는 순수 함수(좌표 변환 등, 기준은 ARCHITECTURE.md "TDD 적용 기준" 참고)는 테스트를 먼저 쓰고 구현한다(TDD).
- axios 기반 API 호출(VWorld 등) 로직을 추가/수정할 때는 MSW로 정상/에러 응답 등 엣지케이스를 테스트로 검증한다.
- Kakao Maps SDK(`kakao.maps.*`, `react-kakao-maps-sdk`)를 다루는 코드를 테스트할 때는 실제 SDK를 로딩하지 않고 ARCHITECTURE.md "Kakao Maps SDK 모킹 전략"에 따라 모킹한다.
- 코드 작성/수정을 마치면 `pnpm test`도 실행해 통과를 확인한다.
- E2E 테스트(Playwright 등)가 필요하다고 판단되는 시점(지도 기능 고도화, 회귀 검증 필요 등)이 오더라도 임의로 도입하지 않고, 먼저 사용자에게 제안해 동의를 받은 뒤 적용한다.

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

## GitHub 이슈 관리

이슈 등록/수정/상태변경은 `gh` CLI로 처리한다. 생성·수정·상태변경 같은 외부에 보이는 액션은 매번 사용자 확인을 받은 뒤 실행한다.

- **생성**: 사용자가 명시적으로 요청할 때만 등록한다 (작업 시작 시 자동 생성하지 않음).
- **라벨**: `bug`, `feature`, `chore`, `docs`, `in-progress` 를 사용한다. 저장소에 없으면 최초 1회 사전 안내 후 `gh label create`로 생성한다.
- **상태 변경**: 사용자가 "이슈 #N 작업 시작" 등으로 명시하면 `in-progress` 라벨을 부여한다. 이슈를 닫을 때는 항상 확인을 받는다.
- **브랜치 컨벤션**: `타입/이슈번호-설명` 형식을 쓴다. 타입은 `feature/`, `bug/`, `chore/`, `docs/` (예: `feature/12-kakao-map-init`). 현재 작업과 연결된 이슈 번호는 브랜치명에서 자동 인식하고, 인식할 수 없으면 대화 중 확인한다.
- **PR 연결**: 관련 이슈가 있는 PR은 설명에 `Closes #N`을 자동으로 추가한다 (세부 규칙은 필요 시 추가 논의).
- **PR 없이 직접 push하는 경우**: 커밋 메시지에 closing 키워드(`Closes #N` 등)를 쓰지 않는다. 작업 완료 후 "이슈 #N 닫을까요?" 확인을 받고 `gh issue close`로 처리한다.
- **브랜치 삭제**: PR 머지 후에도 브랜치(로컬/원격)를 자동으로 삭제하지 않는다. 사용자가 명시적으로 요청할 때만 삭제한다.

## 일별 작업 히스토리 로그

커밋 이력만으로는 특정 시점의 판단 배경(왜 이렇게 바꿨는지)을 파악하기 어려우므로, `docs/history/YYYY-MM-DD.md`에 하루 단위로 작업 이력을 타임라인으로 남긴다. 이 디렉터리는 `.gitignore` 처리되어 git으로 추적하지 않는다 (공개 저장소이므로 내부 메모 성격 유지).

- **기록 단위**: 사용자 요청 단위(하나의 작업)가 완료될 때마다 기록한다. 커밋 단위로 잘게 쪼개지 않는다.
- **기록 시점**: 확인 없이 자동으로 기록한다.
- **포맷**:
  ```
  ## HH:MM — <제목>
  - 이유: <왜 이 작업을 했는지>
  - 변경 내용: <무엇을/어떻게 바꿨는지>
  - 관련 이슈: #N (있는 경우)
  - 관련 커밋: <hash> (있는 경우)
  ```
- **Notion 동기화**: 개인 Notion 페이지("💾 작업 히스토리", Drone OpenSky 프로젝트 하위)에 날짜별 하위 페이지로 동기화할 수 있다. 토큰 사용 이슈로 자동 동기화하지 않고, 사용자가 명시적으로 요청할 때만 수행한다. 기본 대상은 오늘 날짜 파일이며, 날짜를 지정하면 해당 날짜 파일을 사용한다. 이미 해당 날짜의 하위 페이지가 있으면 로컬 파일 내용으로 완전히 덮어쓴다 (로컬 파일이 source of truth).

## 트러블슈팅 로그

디버깅, 원인 조사, 기술적 의사결정(예: 특정 방식이 왜 안 되는지 검토) 등 문제 해결 과정으로 판단되는 대화나 작업은 `docs/TROUBLESHOOTING.md`에 누적 기록한다. 일별 작업 히스토리 로그와 달리 이 파일은 git으로 추적한다 (동일한 문제를 겪을 수 있는 다른 사람에게 참고가 되는 공개 레퍼런스 성격).

- **기록 대상**: 단순 신규 기능 추가/구현이 아니라, 문제 원인을 찾거나("왜 안 되는지"), 여러 대안을 검토해 기술적 판단을 내린 경우.
- **기록 시점**: 확인 없이 자동으로 기록한다.
- **포맷**:
  ```
  ## YYYY-MM-DD HH:MM — <문제/주제>
  - 증상: <무엇이 문제였는지>
  - 원인: <근본 원인 또는 검토 결과>
  - 해결/결론: <어떻게 해결했는지 또는 어떤 판단을 내렸는지>
  - 관련 이슈/PR: <있는 경우>
  ```
