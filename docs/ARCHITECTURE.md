# ARCHITECTURE

## 현재 구현 범위 (1단계)

지도 뷰 위에 공공 API에서 받아온 구역 데이터를 폴리곤으로 표시하는 것까지가 범위다. 필터, 로그인, DB, 커뮤니티 기능은 포함하지 않는다.

## 구조 개요

```
src/
  components/
    Map/            # Kakao Map 초기화 및 컨테이너
    PolygonLayer/   # GeoJSON → Kakao Map Polygon 렌더링
  routes/           # TanStack Router 라우트 정의 (현재는 단일 라우트)
  api/              # axios 클라이언트(client.ts), API 호출 유틸 함수
  store/            # zustand 스토어
```

지도 렌더링은 `react-kakao-maps-sdk`를 사용한다.

프론트엔드(`src/`)와 별개로, 저장소 루트에 배포 관련 디렉터리가 있다: `server/`(VWorld relay용 Vercel 서버리스 함수, 이슈 #16), `wrangler.toml`(Cloudflare Workers 정적 자산 배포 설정). 둘 다 `src/`의 프론트엔드 빌드 대상이 아니라 별도 배포 단위다.

## 기술 스택

- React + TypeScript, 빌드 도구: rsbuild
- 패키지 매니저: pnpm
- 지도: Kakao Map API (`react-kakao-maps-sdk`)
- 스타일: Tailwind CSS(레이아웃/spacing) + Ant Design(컴포넌트, theme token으로 커스터마이즈)
- 상태 관리: zustand
- 라우팅: TanStack Router
- 데이터 조회: axios (역할 분리 기준은 아래 [API 조회 규칙](#api-조회-규칙-axios--tanstack-query) 참고)

## 데이터 흐름

```
VWorld WFS API (EPSG:4326, GeoJSON)
  → PolygonLayer 컴포넌트 (geometry.coordinates → kakao.maps.LatLng[])
  → Kakao Map Polygon 오버레이
```

1단계 데이터 소스는 VWorld(브이월드) WFS API로 결정 (GeoJSON을 직접 반환해 별도 변환 없이 사용 가능). 상세는 [API_REFERENCE.md](./API_REFERENCE.md) 참고. 국토교통부 API(data.go.kr), 항공정보도 WMS/WFS는 2단계 이후 보조 소스로 검토.

## API 조회 규칙 (axios / TanStack Query)

- 서버 데이터 조회는 기본적으로 axios를 직접 사용한다. 호출 로직은 컴포넌트/훅에 인라인으로 두지 않고 API 호출 유틸 함수로 만들어 사용한다.
- 캐싱, 재시도, 백그라운드 리페치 등 TanStack Query의 기능이 필요하다고 판단되면 임의로 도입하지 않고 먼저 사용자에게 제안해 동의를 받은 뒤 적용한다.
- 두 경우 모두 axios 인스턴스(공통 클라이언트, 인터셉터)는 `api/` 아래에서만 생성한다.
- VWorld(지역/구역 조회) API 호출은 `src/api/vworldClient.ts`의 `vworldClient`를 사용한다. dev에서는 요청 인터셉터가 `VITE_VWORLD_API_KEY`를 자동으로 붙이지만, 프로덕션은 Vercel 서버리스 함수(`server/api/vworld-api/[...path].ts`, 이슈 #16)가 `VWORLD_API_KEY` 환경변수를 서버 사이드에서 주입하므로 호출부에서 키를 직접 넘기지 않는다. 이 함수는 서울 리전(`server/vercel.json`의 `regions: ["icn1"]`)에 고정 배포해 VWorld의 CORS 중계(+ 해외 클라우드 IP 차단 우회)를 겸한다 (상세: [TROUBLE_SHOOTING.md](./TROUBLE_SHOOTING.md)). 프론트엔드는 GitHub Pages + Cloudflare Workers(정적 자산 전용, `wrangler.toml`)에 이중 배포한다.
- 향후 게시글 등록 등 별도 DB/API 서버가 추가되면 `src/api/` 아래에 그 서버 전용 axios 인스턴스 파일(예: `communityClient.ts`)을 따로 만든다. VWorld 클라이언트와 혼용하지 않는다.

## TDD 적용 기준

이슈 #11(테스트 하네스)에서 정의. 아래 기준으로 TDD 적용 대상을 구분한다.

- **TDD 대상**: 입출력이 명확하고 부수효과가 없는 순수 함수. 테스트를 먼저 쓰고 구현한다.
  - 대표 사례: VWorld GeoJSON 응답의 `geometry.coordinates`(`MultiPolygon`, `[lng, lat]` 순서)를
    `kakao.maps.LatLng[][]`로 변환하는 함수 (예정 위치: `src/features/airspace/utils/`).
    입력(좌표 배열)과 기대 출력(LatLng 배열)이 고정돼 있고 네트워크·DOM 의존이 없어
    TDD로 다루기 좋은 첫 대상이다.
  - typename별 properties(예: `prh_lbl_*`, `res_lbl_*`)에서 라벨/고도 정보를 정규화하는
    함수가 생기면 마찬가지로 TDD 대상.
- **TDD 대상 아님**: React 컴포넌트, 커스텀 훅(geolocation 등 부수효과 중심), axios
  인터셉터처럼 외부 상태·환경에 의존하는 코드. 이런 코드는 `docs/spec/`(SDD 템플릿)으로
  먼저 스펙을 정리하고, 필요 시 사후에 통합/컴포넌트 테스트로 검증한다.

## Kakao Maps SDK 모킹 전략

`react-kakao-maps-sdk`의 `useKakaoLoader`는 실제로 `<script>` 태그를 주입해 Kakao SDK를
비동기 로딩한다. jsdom 테스트 환경에서는 이 스크립트가 로딩되지 않아 그대로 두면
`loading` 상태에서 멈추고, 전역 `kakao`도 존재하지 않는다. 테스트 대상에 따라 다르게
접근한다.

- **순수 로직 테스트** (예: GeoJSON coordinates → `kakao.maps.LatLng[][]` 변환 함수):
  실제 SDK를 흉내낼 필요 없이, 테스트 대상이 실제로 쓰는 `kakao.maps.*` API만 최소로
  구현한 목을 전역에 심는다. `src/test/mocks/kakaoMaps.ts`의 `installKakaoMapsMock()` /
  `uninstallKakaoMapsMock()`을 각 테스트의 준비/정리 단계에서 호출한다. 새 API가
  필요해지면 이 파일에 필요한 만큼만 추가한다(SDK 전체 재현 금지).
- **컴포넌트 테스트** (예: `MapView`처럼 `useKakaoLoader`/`Map`/`Polygon`을 쓰는 컴포넌트):
  `vi.mock('react-kakao-maps-sdk', ...)`으로 모듈 자체를 대체해 `useKakaoLoader`가
  즉시 `[false, undefined]`(로딩 완료)를 반환하게 하고, 사용하는 컴포넌트(`Map`,
  `Polygon` 등)는 테스트에서 검증하기 쉬운 단순 컴포넌트(예: `data-testid`가 있는
  `div`)로 대체한다. 아직 이런 컴포넌트 테스트 대상이 없어 공용 목 파일은 만들지
  않았다 — 실제로 필요해지면 테스트별로 `vi.mock`을 작성하고, 반복되면
  `src/test/mocks/react-kakao-maps-sdk.tsx`로 뽑아 공유한다.

## 스타일링 규칙 (Tailwind / Ant Design)

- 레이아웃, spacing, 반응형은 Tailwind로 처리한다.
- 컴포넌트 자체 룩(버튼, 인풋 등 antd 컴포넌트의 내부 스타일)은 antd theme token으로 커스터마이즈한다.
- Tailwind로 antd 컴포넌트 내부를 직접 오버라이드하지 않는다.
- Kakao Map 컨테이너 크기는 뷰포트에 맞춰 반응형으로 처리한다 (모바일 웹 대응).

## Out of scope (future)

아래 항목은 현재 범위에 포함되지 않는다. 별도 논의 없이 구현하지 않는다.

- DB 연동 (Firebase/Supabase 등)
- Google OAuth 로그인
- AI 기반 추천/분석 모듈
- 커뮤니티 기능 (유저 메모/마커)
