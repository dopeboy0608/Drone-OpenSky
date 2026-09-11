# CLAUDE.md

## 프로젝트 목적 / 현재 범위

드론 비행 가능/제한/불가 구역을 실시간 지도 기반으로 제공하는 서비스. 현재 구현 범위는 Kakao Map 지도 뷰 위에 공공 API 데이터를 폴리곤으로 표시하는 것까지다. 필터, 로그인, DB, AI 추천, 커뮤니티 기능은 아직 범위 밖이다 (자세한 내용은 [ROADMAP.md](./ROADMAP.md), [ARCHITECTURE.md](./ARCHITECTURE.md#out-of-scope-future) 참고). 범위 밖 기능을 임의로 구현하지 않는다.

## 디렉터리 구조

```
src/
  components/
    Map/            # Kakao Map 초기화 및 컨테이너
    PolygonLayer/   # GeoJSON → Kakao Map Polygon 렌더링
  routes/           # TanStack Router 라우트 정의
  api/              # axios 클라이언트, TanStack Query 훅
  store/            # zustand 스토어
docs/draft/         # 장기 비전 초안 (참고용, 현재 범위 아님)
```

## 기술 스택

- React + TypeScript, 빌드 도구: rsbuild
- 패키지 매니저: pnpm (npm/yarn 명령 사용 금지)
- 지도: Kakao Map API
- 스타일: Tailwind CSS(레이아웃/spacing) + Ant Design(컴포넌트, theme token으로 커스터마이즈). Tailwind로 antd 내부 스타일을 직접 오버라이드하지 않는다.
- 상태 관리: zustand
- 라우팅: TanStack Router
- 데이터 조회: 기본은 TanStack Query 훅, 캐싱/재시도가 필요 없는 단발성 조회는 axios 직접 사용 가능. axios 인스턴스는 `api/` 아래에서만 생성한다.

## 금지 사항

- API 키를 코드에 하드코딩하지 않는다. `.env`의 `VITE_` 접두 환경 변수로 관리한다.
- 현재 범위(1단계) 밖의 기능(로그인, DB, AI 추천 등)을 별도 논의 없이 구현하지 않는다.
