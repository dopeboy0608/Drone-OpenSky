# Drone-OpenSky

드론 비행 가능/제한/불가 구역을 실시간 지도 기반으로 제공하는 서비스

## 현재 구현 범위 (1단계)

- Kakao Map 기반 지도 뷰
- 공공 API 데이터를 GeoJSON으로 변환하여 폴리곤 오버레이로 표시

그 외 기능(필터, 로그인, 커뮤니티, AI 추천 등)은 [ROADMAP.md](./ROADMAP.md) 참고.

## 기술 스택

- React + TypeScript, 빌드 도구: rsbuild
- 패키지 매니저: pnpm
- 지도: Kakao Map API
- 스타일: Tailwind CSS + Ant Design
- 상태 관리: zustand
- 라우팅: TanStack Router
- 데이터 조회: axios + TanStack Query (역할 분리 기준은 [ARCHITECTURE.md](./ARCHITECTURE.md) 참고)

## 실행 방법

```bash
pnpm install
pnpm dev
```

### 환경 변수

`.env.example`을 복사해 `.env`를 만들고 키를 채웁니다.

```bash
cp .env.example .env
```

```
VITE_KAKAO_MAP_API_KEY=your_api_key
VITE_VWORLD_API_KEY=your_api_key
```

## 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 구조 및 데이터 흐름
- [ROADMAP.md](./ROADMAP.md) — 단계별 계획
- [API_REFERENCE.md](./API_REFERENCE.md) — 공공 API 연동 상세
- [CLAUDE.md](./CLAUDE.md) — AI 에이전트 작업 가이드
- [docs/draft/01.project-overview.md](./docs/draft/01.project-overview.md) — 초기 장기 비전 초안
