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
  api/              # axios 클라이언트, TanStack Query 훅
  store/            # zustand 스토어
```

## 데이터 흐름

```
VWorld WFS API (EPSG:4326, GeoJSON)
  → PolygonLayer 컴포넌트 (geometry.coordinates → kakao.maps.LatLng[])
  → Kakao Map Polygon 오버레이
```

1단계 데이터 소스는 VWorld(브이월드) WFS API로 결정 (GeoJSON을 직접 반환해 별도 변환 없이 사용 가능). 상세는 [API_REFERENCE.md](./API_REFERENCE.md) 참고. 국토교통부 API(data.go.kr), 항공정보도 WMS/WFS는 2단계 이후 보조 소스로 검토.

## API 조회 규칙 (axios / TanStack Query)

- 서버 데이터 조회는 기본적으로 TanStack Query 훅으로 감싼다 (캐싱, 재시도, 로딩 상태 관리 필요).
- 캐싱/재시도가 필요 없는 단발성 조회는 axios를 직접 사용해도 된다.
- 두 경우 모두 axios 인스턴스(공통 클라이언트, 인터셉터)는 `api/` 아래에서만 생성한다.

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
