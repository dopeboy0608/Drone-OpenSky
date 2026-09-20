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

- 프론트엔드: GitHub Pages(`.github/workflows/deploy.yml`, push to master 시 자동 배포)와
  Cloudflare Workers 정적 자산(`wrangler.toml`, `wrangler deploy`로 수동 배포)에 동일 빌드를
  이중 배포한다. GitHub Pages는 서브경로(`GH_PAGES_BASE_PATH`), Workers는 루트 경로로 각각
  다르게 빌드해야 한다.
- API: VWorld WFS 프록시(CORS 우회 + 키 주입)는 Vercel 서버리스 함수
  (`server/api/vworld-api/[...path].ts`, 서울 리전 `icn1` 고정)로 배포한다 — VWorld가
  Cloudflare 등 해외 클라우드 엣지 IP를 차단해 Cloudflare Worker로는 불가능함을 확인했다
  (이슈 #16, 상세는 [ARCHITECTURE.md](./ARCHITECTURE.md), [TROUBLE_SHOOTING.md](./TROUBLE_SHOOTING.md) 참고).
- CI(lint/test 자동 검증)는 별도 트랙(이슈 #11)에서 진행 중이며 아직 워크플로우 파일은 없다.
