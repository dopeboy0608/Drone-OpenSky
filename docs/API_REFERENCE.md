# API_REFERENCE

## 1단계 데이터 소스: VWorld(브이월드) 오픈 API

국토교통부 산하 공간정보 오픈플랫폼. WFS로 초경량비행장치공역, 비행제한/금지구역 등 항공 레이어를 제공한다.

- 발급: https://www.vworld.kr 에서 인증키 신청 (문의처 1661-0115).
- 인증 방식: 키 발급 시 등록한 **서비스 URL(Referer 도메인)** 기준으로 검증한다. 등록 도메인과 다른 곳에서 요청하면 요청 파라미터가 맞아도 `INCORRECT_KEY` 에러가 반환된다.
  - 로컬 개발용 키는 서비스 URL을 `http://localhost:3000`으로 등록해 발급받았다 (`.env`의 `VITE_VWORLD_API_KEY`). rsbuild dev 서버 기본 포트(3000)와 동일하게 맞춰야 한다.
  - 배포된 서비스(GitHub Pages, `https://dopeboy0608.github.io`)에서 쓸 키는 별도로 그 도메인으로 등록해야 한다. 즉 로컬 개발용 키와 운영 배포용 키를 다르게 관리해야 한다 (환경별 키 분리 방식은 배포 파이프라인 구성 시 결정 — [미확인 사항](#미확인-사항) 참고).
  - curl 등으로 직접 검증할 때는 `Referer` 헤더를 등록 도메인 값과 동일하게 지정해야 한다 (예: `curl -H "Referer: http://localhost:3000/" ...`). 브라우저에서 실행될 때는 브라우저가 Referer를 자동으로 보내므로 별도 처리가 필요 없다.
- 응답 포맷: WFS 요청 시 `application/json`(GeoJSON) 직접 지원 — 별도 변환 없이 사용 가능. 인증/요청 오류 시에는 HTTP 200과 함께 XML `ServiceExceptionReport`를 반환한다 (`src/api/vworldClient.ts`가 이를 감지해 reject 처리).
- 좌표계: EPSG:4326(WGS84), EPSG:5179(UTM-K) 등 파라미터로 선택 가능. Kakao Map은 WGS84 기준이므로 `EPSG:4326`으로 요청한다.

### 요청 예시 (실증 완료)

```
GET https://api.vworld.kr/req/wfs?
  SERVICE=WFS
  &REQUEST=GetFeature
  &TYPENAME=<레이어명>
  &SRSNAME=EPSG:4326
  &OUTPUT=application/json
  &BBOX=<minLng>,<minLat>,<maxLng>,<maxLat>
  &key=<발급받은 키>
```

- `key` 파라미터명은 소문자(`key`)다.
- `BBOX`는 `minLng,minLat,maxLng,maxLat` 순서(경도, 위도)이며 지도 이동 시 현재 뷰포트 범위로 채운다.

### 구역 유형(typename) 목록

VWorld 데이터 카탈로그의 "항공·공항" 카테고리 전체(`docs/draft/api_columns.png` 기준)와, 카테고리엔 없지만 기존에 확인된 임시비행금지구역까지 포함해 전수 조사했다. 아래 typename은 전부 `GET .../wfs?...&TYPENAME=<typename>&BBOX=124,33,132,43`(대한민국 전역)로 실제 호출해 HTTP 200 + 정상 GeoJSON 응답(`ServiceExceptionReport` 없음)을 확인했다.

| 상태      | typename                                                                           | 구역 유형              | 지오메트리   | 전역 조회 시 feature 수 |
| --------- | ---------------------------------------------------------------------------------- | ---------------------- | ------------ | ----------------------- |
| ✅ 검증됨 | `lt_c_aisuac`                                                                      | (UA)초경량비행장치공역 | Polygon      | 48                      |
| ✅ 검증됨 | `lt_c_aisaltc`                                                                     | 경계구역               | Polygon      | 8                       |
| ✅ 검증됨 | `lt_c_aisfldc`                                                                     | 경량항공기이착륙장     | Polygon      | 14                      |
| ✅ 검증됨 | `lt_c_aisrflc`                                                                     | 공중급유구역           | Polygon      | 6                       |
| ✅ 검증됨 | `lt_c_aisacmc`                                                                     | 공중전투기동훈련장     | Polygon      | 5                       |
| ✅ 검증됨 | `lt_c_aisctrc`                                                                     | 관제권                 | Polygon      | 53                      |
| ✅ 검증됨 | `lt_c_aismoac`                                                                     | 군작전구역             | Polygon      | 75                      |
| ✅ 검증됨 | `lt_c_aisdronezone`                                                                | 드론시범사업구역       | Polygon      | 8                       |
| ✅ 검증됨 | `lt_c_aisadzc`                                                                     | 방공식별구역           | Polygon      | 1                       |
| ✅ 검증됨 | `lt_c_aisprhc`                                                                     | 비행금지구역           | Polygon      | 15                      |
| ✅ 검증됨 | `lt_c_aisatzc`                                                                     | 비행장교통구역         | Polygon      | 15                      |
| ✅ 검증됨 | `lt_c_aisfirc`                                                                     | 비행정보구역           | Polygon      | 1                       |
| ✅ 검증됨 | `lt_c_aisresc`                                                                     | 비행제한구역           | Polygon      | 84                      |
| ✅ 검증됨 | `lt_l_aissearchl`, `lt_p_aissearchp`                                               | 수색비행장비행구역     | Line + Point | 1 + 8                   |
| ✅ 검증됨 | `lt_l_aisvfrpath`, `lt_p_aisvfrpath`                                               | 시계비행로             | Line + Point | 1 + 23                  |
| ✅ 검증됨 | `lt_c_aisdngc`                                                                     | 위험구역               | Polygon      | 32                      |
| ✅ 검증됨 | `lt_c_aistmac`                                                                     | 접근관제구역           | Polygon      | 55                      |
| ✅ 검증됨 | `lt_l_aisrouteu`                                                                   | 제한고도               | Line         | 250                     |
| ✅ 검증됨 | `lt_l_aiscorrid_ys`, `lt_l_aiscorrid_gj`, `lt_p_aiscorrid_ys`, `lt_p_aiscorrid_gj` | 한강회랑               | Line + Point | 4 + 1 + 11 + 6          |
| ✅ 검증됨 | `lt_l_aispath`                                                                     | 항공로                 | Line         | 285                     |
| ✅ 검증됨 | `lt_p_aishcstrip`                                                                  | 헬기장                 | Point        | 93                      |
| ✅ 검증됨 | `lt_c_aiscatc`                                                                     | 훈련구역               | Polygon      | 9                       |
| ✅ 검증됨 | `lt_c_aistemp`                                                                     | 임시비행금지공역       | Polygon      | 3                       |

### "항공·공항" 카테고리에 없는 지역기반 허가필요구역 후보 조사

드론 지도 옵션 스크린샷 기준, vworld "항공·공항" 카테고리에는 없지만 **특정 지역에서 비행 가능/불가능/허가필요를 직접 판단**할 수 있는 후보를 data.go.kr(공공데이터포털)에서 조사했다. (날씨 등 간접 요소는 제외.)

| 항목         | 결과                                                                                      | 근거                                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 국립자연공원 | ✅ vworld에 이미 존재 — 별도 API 불필요                                                   | vworld "환경생태" 카테고리에 국립(`lt_c_wgisnpgug`)/도립(`lt_c_wgisnpdo`)/군립(`lt_c_wgisnpgun`) 3개 레이어로 이미 서비스 중. 스크린샷엔 "국립자연공원" 하나로만 표시되어 3개 다 포함할지는 별도 결정 필요                                  |
| 문화재보호도 | 🔍 후보 확인 — [국토교통부_문화재보호도](https://www.data.go.kr/data/15057770/openapi.do) | 국토교통부(국가공간정보센터) 제공, 공간정보오픈플랫폼 LINK 방식 API, JSON+XML 응답. **개발·운영 모두 자동승인**이라 vworld보다 진입장벽 낮음. typename/엔드포인트는 활용신청 후 별도 문서(`DataAPI2.0` 스펙)로 제공 — 신청 전까지 확정 불가 |
| 장애물공역   | ❌ 공개 API 미발견                                                                        | data.go.kr/vworld 어디에도 없음. drone.onestop.go.kr(드론원스톱) 내부 지도 전용 레이어로 추정 — 별도 기관 문의 없이는 확보 어려움                                                                                                           |
| 사전협의구역 | ❌ 공개 API 미발견                                                                        | 위와 동일 — drone.onestop.go.kr 내부 전용으로 추정                                                                                                                                                                                          |

**참고**: drone.onestop.go.kr(드론 원스톱 민원서비스)는 지도 표시에 VWorld를 그대로 연계해서 쓰는 것으로 확인됨 — 즉 이 서비스가 보여주는 대부분의 레이어는 결국 vworld 소스다. 장애물공역/사전협의구역만 vworld·data.go.kr 어디에도 공개되어 있지 않아 별도 확보 경로가 필요하다.

### 비행금지/제한구역 보조 소스 (data.go.kr, 미결정)

vworld WFS(`lt_c_aisprhc`/`lt_c_aisresc`)와 별개로, 같은 원본 데이터를 공식 채널로 재확인하고 싶을 때의 보조 소스:

- [국토교통부_비행금지구역](https://www.data.go.kr/data/15101073/openapi.do) — 국가공간정보센터, OGC 표준 LINK API, JSON+XML. 개발단계 자동승인 / 운영단계 심의승인 필요
- [국토교통부_비행제한구역](https://www.data.go.kr/data/15101074/openapi.do) — 위와 동일 조건
- 두 API 모두 상세 요청 파라미터는 활용신청 후 제공되는 `DataAPI2.0(공간정보오픈플랫폼)_v1.0.hwp` 문서에서 확인 가능 (신청 전엔 페이지에 노출되지 않음)
- 항공정보도 WMS/WFS: 개발·운영 모두 자동승인. WMS는 이미지, WFS도 GML 위주라 파싱 비용이 vworld(JSON 직접 지원)보다 높음

위 28개 typename과 후보 항목 중 1단계 폴리곤 렌더링에 실제로 포함할 항목은 별도로 결정한다.

### 실제 응답 스키마 (typename별, `docs/API_REFERENCE.md` 작성 시점 실증)

공통: `geometry.type`은 `MultiPolygon`, 좌표는 `[lng, lat]` 순서(GeoJSON 표준).

**`lt_c_aisuac` (비행가능)**

```json
{
  "properties": {
    "ident_txt": "UA 31",
    "name_txt": "CHEONGNA",
    "uac_lbl_1": "(UA 31) CHEONGNA",
    "uac_lbl_2": "500FT HEI",
    "uac_lbl_3": "SFC"
  }
}
```

- `ident_txt`: 구역 식별 코드
- `name_txt`: 구역명
- `uac_lbl_2`: 고도 제한 표기 (예: `500FT HEI`)
- `uac_lbl_3`: 기준 고도 (예: `SFC` = 지표면)

**`lt_c_aisresc` (비행제한)**

```json
{
  "properties": {
    "restricted": "<FNT name='TW Cen MT' size='6'>...</FNT>",
    "res_lbl_1": "R75",
    "res_lbl_2": "10 000 AMSL",
    "res_lbl_3": "SFC"
  }
}
```

- `restricted`: 지도 라벨 렌더링용 HTML/폰트 마크업 문자열 — **폴리곤 스타일링/라벨에는 사용하지 말 것** (파싱 대상 아님, `res_lbl_*`를 대신 사용)
- `res_lbl_1`: 구역 코드 (예: `R75`)
- `res_lbl_2`: 상한 고도 (예: `10 000 AMSL`)
- `res_lbl_3`: 하한 고도 (예: `SFC`)

**`lt_c_aisprhc` (비행금지)**

```json
{
  "properties": {
    "prohibited": "<FNT name='TW Cen MT' size='8'>...</FNT>",
    "prh_lbl_1": "RK P73A",
    "prh_lbl_2": "UNL",
    "prh_lbl_3": "GND",
    "prh_lbl_4": "비행금지구역",
    "prh_typ": "1"
  }
}
```

- `prohibited`: `restricted`와 동일한 성격의 마크업 문자열 — 사용하지 않음
- `prh_lbl_1`: 구역 코드 (예: `RK P73A`)
- `prh_lbl_2`: 상한 고도 (예: `UNL` = 무제한)
- `prh_lbl_3`: 하한 고도 (예: `GND` = 지면)
- `prh_lbl_4`: 구역 유형 한글명 (`비행금지구역`)
- `prh_typ`: 내부 분류 코드 — 관측된 값은 `"1"`뿐이라 의미 미확인

### 응답 → Kakao Map 변환

VWorld WFS 응답(GeoJSON FeatureCollection)의 `geometry.coordinates`(`MultiPolygon`, `[lng, lat]` 순서)를 순회하여 Kakao Map `kakao.maps.LatLng(lat, lng)` 배열로 변환한 뒤 `kakao.maps.Polygon`에 전달한다. `MultiPolygon`이므로 폴리곤이 여러 개(ring)로 구성될 수 있음을 렌더링 로직에서 고려해야 한다.

## 미확인 사항

- 장애물공역, 사전협의구역의 공개 API 확보 경로 (data.go.kr/vworld 어디에도 없음 — drone.onestop.go.kr에 별도 문의 필요할 수 있음)
- 문화재보호도 API의 실제 요청 파라미터/typename (활용신청 후 제공되는 스펙 문서 확인 필요)
- 국립자연공원을 국립/도립/군립 3개 레이어 모두 포함할지, 국립(`lt_c_wgisnpgug`)만 포함할지
- 28개 typename 중 1단계 폴리곤 렌더링에 실제로 포함할 항목
- VWorld 키 발급 실제 승인 소요기간
- 각 레이어의 갱신 주기 및 데이터 신뢰도
- 로컬용/운영용 키를 환경변수로 분리 관리하는 방식 (예: `.env` vs GitHub Actions secrets)
- `prh_typ` 코드값의 의미 (관측 표본이 `"1"` 하나뿐)
