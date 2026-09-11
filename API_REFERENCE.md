# API_REFERENCE

## 1단계 데이터 소스: VWorld(브이월드) 오픈 API

국토교통부 산하 공간정보 오픈플랫폼. WFS로 초경량비행장치공역, 비행금지/제한구역, 관제권 등 항공 레이어를 제공한다.

- 발급: https://www.vworld.kr 에서 인증키 신청 (문의처 1661-0115). 승인 소요기간은 문서상 명확하지 않아 실제 신청 후 확인 필요.
- 응답 포맷: WFS 요청 시 `application/json`(GeoJSON) 직접 지원 — 별도 변환 없이 사용 가능.
- 좌표계: EPSG:4326(WGS84), EPSG:5179(UTM-K) 등 파라미터로 선택 가능. Kakao Map은 WGS84 기준이므로 `EPSG:4326`으로 요청한다.
- 사용 레이어(예정): 비행금지구역, 비행제한구역, 초경량비행장치공역 중 1단계는 하나만 선정해 폴리곤 렌더링 파이프라인을 검증한다.

### 요청 예시 (초안, 실제 키 발급 후 검증 필요)

```
GET https://api.vworld.kr/req/wfs?
  SERVICE=WFS
  &REQUEST=GetFeature
  &TYPENAME=<레이어명>
  &SRSNAME=EPSG:4326
  &OUTPUT=application/json
  &KEY=<발급받은 키>
```

### 응답 → Kakao Map 변환

VWorld WFS 응답(GeoJSON FeatureCollection)의 `geometry.coordinates`를 순회하여 Kakao Map `kakao.maps.LatLng` 배열로 변환한 뒤 `kakao.maps.Polygon`에 전달한다.

## 보류 중인 후보 (2단계 이후 검토)

- **국토교통부 비행금지구역/비행제한구역 API (data.go.kr)**: 개발단계는 자동승인, 운영 전환 시 별도 심의승인 필요. 공식성 보강용 보조 소스로 후보.
- **항공정보도 WMS/WFS (국토교통부_항공정보도, data.go.kr)**: 개발·운영 모두 자동승인이라 진입장벽은 낮으나 WMS는 이미지, WFS도 GML 위주라 파싱 비용이 더 든다.

## 미확인 사항

- VWorld 키 발급 실제 승인 소요기간
- 각 레이어의 갱신 주기 및 데이터 신뢰도
