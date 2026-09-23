# Phase 0 Research: 지도 표시 고도화 — 구역 세분화 표시

## 신규 typename의 실제 응답 스키마 확인

VWorld WFS에 신규 7개 typename을 각 1건씩 실제 호출해(`BBOX=124,33,132,43&maxFeatures=1`, 2026-09-23) `properties` 구조를 확인했다. `docs/API_REFERENCE.md`에는 typename 존재 여부만 기록돼 있고 신규 7종의 실제 스키마는 없었으므로, 여기서 보강한다.

| typename            | 구역 종류           | 확인된 속성 예시                                                                 |
| ------------------- | ------------------- | -------------------------------------------------------------------------------- |
| `lt_c_aisaltc`      | 경계구역            | `alt_lbl_1`="A811"(코드), `alt_lbl_2`="1 000 AGL"(상한), `alt_lbl_3`="SFC"(하한) |
| `lt_c_aisatzc`      | 비행장교통구역      | `atm_lbl_1`="Jochiwon ATZ"(명칭), `atm_lbl_2`/`atm_lbl_3`=고도                   |
| `lt_c_aisfldc`      | 경량항공기 이착륙장 | `fld_label`="공주 경항공기 이착륙장"(한글명), `fld_lbl_1`="Airfield"(구분)       |
| `lt_c_aisdngc`      | 위험구역            | `dng_lbl_1`="D14"(코드), `dng_lbl_2`/`dng_lbl_3`=고도                            |
| `lt_c_aisdronezone` | 드론시범사업구역    | `name`="고흥 (Goheung)", `lateral`/`vertical`=반경·고도 설명                     |
| `lt_c_aistemp`      | 임시비행금지구역    | `prh_lbl_1`=null(표본에선 코드 없음), `notam`="A)RKRR B)2501311500 C)2504301459" |
| `lt_c_wgisnpgug`    | 국립자연공원(국립)  | `park_name`="월출산"                                                             |

**Decision**: FR-007(클릭 시 정확한 구역 종류 확인)은 각 feature의 `properties`를 파싱하지 않고, **typename → 한글 구역 종류 라벨의 정적 매핑 테이블**로 해결한다(예: `lt_c_aisdngc` → "위험구역"). `AIRSPACE_ZONE_LABELS`처럼 이미 존재하는 정적 라벨 매핑 패턴과 동일한 접근이다.

**Rationale**: typename별 속성 필드명이 제각각(`alt_lbl_1`, `atm_lbl_1`, `dng_lbl_1`, `name`, `park_name` 등)이라 공통 파싱 로직을 만들면 오히려 복잡도만 늘어난다. 반면 "이 폴리곤이 정확히 무슨 구역 종류인가"(FR-007이 요구하는 최소 수준)는 typename만 알면 결정되는 정적 정보라, 매핑 테이블이 가장 단순하고 안전하다.

**Alternatives considered**:

- **속성에서 실제 이름/코드까지 함께 노출**(예: "위험구역 · D14", "경량항공기 이착륙장 · 공주 경항공기 이착륙장"): 정보량은 늘지만 typename마다 어떤 필드를 대표값으로 쓸지 개별 매핑이 필요해 복잡도가 커진다. FR-007의 최소 요구사항(구역 종류 구분)을 넘어서는 범위라 이번 이슈에서는 제외하고, 필요성이 확인되면 후속 이슈(#27과 통합 검토)로 미룬다.
- **`res_lbl_1`/`prh_lbl_1` 같은 코드 필드를 신규 typename에도 요구**: `lt_c_aisatzc`(명칭만 존재), `lt_c_aisdronezone`(코드 개념 자체가 없음)처럼 애초에 짧은 코드가 없는 typename이 있어 일관 적용이 불가능함을 확인 — 기각.

## 기존 구조에서 zoneType 태깅 위치

**Decision**: `useAirspaceZoneQueries.ts`의 `fetchZoneGroup`이 typename별로 `fetchAirspaceZones(typename)`을 호출하는 시점에, 각 typename의 응답 feature 배열에 `tagFeatureZoneType(features, typename)`(신규 순수 함수)을 적용해 `zoneType` 필드를 주입한 뒤 그룹으로 병합한다.

**Rationale**: 그룹 병합(`Promise.all` + `flatMap`) 이후에는 어떤 feature가 어떤 typename에서 왔는지 구분할 수 있는 정보가 사라진다. 병합 _이전_ 시점(typename 단위)에 태깅해야 손실 없이 각 feature의 정확한 구역 종류를 유지할 수 있다.

**Alternatives considered**:

- **`AirspacePolygonLayer`에서 typename을 역추정**: properties 필드 패턴(`dng_lbl_*` 있으면 위험구역 등)으로 추정하는 방식은 필드명이 겹치거나 없는 경우(예: `lt_c_aisdronezone`은 `*_lbl_*` 패턴이 아예 없음) 오탐 위험이 있어 기각.

## 구역번호 라벨(FR-003) 범위 재확인

`docs/API_REFERENCE.md`에서 이미 확인한 `prh_lbl_1`(비행금지)/`res_lbl_1`(비행제한)만 spec FR-003의 "구역 식별 번호" 요건을 만족한다. 이번 조사에서 확인한 신규 7종 중 `alt_lbl_1`(경계구역), `dng_lbl_1`(위험구역)도 유사한 코드 형식(`A811`, `D14`)을 갖지만, spec FR-003은 비행금지/제한구역으로 범위를 명시적으로 한정했으므로 이번 구현에서는 확장하지 않는다. 필요성이 확인되면 후속 이슈에서 확장 검토.
