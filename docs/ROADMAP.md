# ROADMAP

## 0단계 — 개발 환경 셋업 ✅ (완료)

- rsbuild + React + TypeScript 스캐폴딩
- 스택 설치: antd, zustand, TanStack Router/Query, axios, Tailwind CSS
- react-kakao-maps-sdk 설치
- axios 인스턴스 + VWorld API 키 자동 주입 인터셉터 (`src/api/vworldClient.ts`)
- ESLint + Prettier 설정, husky + lint-staged pre-commit 훅
- `.env.example` 환경변수 템플릿
- TypeScript strict 모드 활성화
- Node 버전 고정 (`.nvmrc`, Node 24)

## 1단계 — 지도 뷰 + 폴리곤 오버레이 (현재 범위)

- Kakao Map 지도 뷰
- 공공 API → GeoJSON 변환 → 폴리곤 표시
- 데이터 소스 1개로 시작 (검증 후 확정)
- 반응형(모바일 웹) 대응 포함 — 화면 작업과 함께 진행
- TODO(2026-09-12): VWorld WFS API 호출부 작업 (개발키 발급·동작 확인 완료, `src/api/` 훅 구현 예정)

## 2단계 — 필터 기능 추가

- 구역별 표시 제어 (필터 패널)

## 3단계 — 사용자 로그인 + 마커 업로드

- Google OAuth 로그인
- 유저 메모/마커 업로드 (커뮤니티 기능)

## 4단계 — AI 기반 추천/분석 기능

## 5단계 — 수익모델 접목

- 프리미엄 기능, API 판매 등

---

2~5단계는 현재 구현 대상이 아니며, 착수 시점에 별도로 상세 계획을 논의한다.

## 인프라/배포 (단계 무관, 병행 트랙)

- GitHub Actions를 통한 배포
- 무료 인프라 + 도메인 사용 방식으로 결정 예정 (인프라 미확정)
- 기능 단계와 독립적으로 준비되는 대로 진행
- 아래는 `.github/workflows/` 워크플로우 초안이다. 인프라가 미확정이라 실제 파일로는 만들지 않고 문서로만 남긴다. 인프라 확정 시 이 내용을 기반으로 `.github/workflows/ci.yml`, `deploy.yml`을 작성한다.

### CI 워크플로우 초안 (`ci.yml`)

push/PR 시 lint + build 검증.

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Build
        env:
          VITE_KAKAO_MAP_API_KEY: ${{ secrets.VITE_KAKAO_MAP_API_KEY }}
          VITE_VWORLD_API_KEY: ${{ secrets.VITE_VWORLD_API_KEY }}
        run: pnpm build
```

### 배포 워크플로우 초안 (`deploy.yml`)

인프라(Vercel/Netlify/GitHub Pages 등) 확정 후 `on.push`로 바꾸고, `Deploy` 스텝을 실제 배포 액션으로 채운다. 지금은 실수 방지를 위해 `workflow_dispatch`(수동 실행)만 구상.

```yaml
name: Deploy

on:
  workflow_dispatch: {}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        env:
          VITE_KAKAO_MAP_API_KEY: ${{ secrets.VITE_KAKAO_MAP_API_KEY }}
          VITE_VWORLD_API_KEY: ${{ secrets.VITE_VWORLD_API_KEY }}
        run: pnpm build

      # TODO: 인프라 확정 후 배포 스텝 추가
      # 예) Vercel: vercel/actions, Netlify: netlify/actions,
      #     GitHub Pages: actions/upload-pages-artifact + actions/deploy-pages
      - name: Deploy (TODO)
        run: echo "배포 인프라 결정 후 이 스텝을 채운다"
```
