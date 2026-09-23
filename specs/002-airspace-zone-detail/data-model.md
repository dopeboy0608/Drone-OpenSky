# Phase 1 Data Model: 지도 표시 고도화 — 구역 세분화 표시

## Zone Group (기존, 확장)

`AirspaceZoneConfig`(기존 `types.ts`) — 변경 없음, `typenames` 배열만 확장.

| 필드          | 타입                                          | 설명                                                                       |
| ------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `level`       | `'prohibited' \| 'restricted' \| 'available'` | 3색 그룹(불가/승인후비행가능/승인불요). spec FR-001에 따라 값 종류는 유지. |
| `typenames`   | `string[]`                                    | 이 그룹에 속한 VWorld typename 목록. spec FR-002 매핑표대로 확장.          |
| `color`       | `string`                                      | 그룹 색상 (기존 값 유지)                                                   |
| `fillOpacity` | `number`                                      | 그룹 채우기 투명도 (기존 값 유지)                                          |
| `zIndex`      | `number`                                      | 그룹 우선순위 (기존 값 유지)                                               |

**typenames 확장 (spec FR-002 매핑, research.md 실증 반영)**:

- `prohibited`: `lt_c_aisprhc`(기존), `lt_c_aistemp`(신규), `lt_c_aisdngc`(신규)
- `restricted`: `lt_c_aisresc`, `lt_c_aisctrc`, `lt_c_aismoac`(기존) + `lt_c_aisaltc`, `lt_c_aisatzc`, `lt_c_aisfldc`, `lt_c_wgisnpgug`(신규)
- `available`: `lt_c_aisuac`(기존) + `lt_c_aisdronezone`(신규)

## Zone Type Label Map (신규)

typename → 한글 구역 종류 라벨의 정적 매핑. FR-007(클릭 시 정확한 구역 종류 표시)에 사용.

| typename            | 라벨                   |
| ------------------- | ---------------------- |
| `lt_c_aisprhc`      | 비행금지구역           |
| `lt_c_aistemp`      | 임시비행금지구역       |
| `lt_c_aisdngc`      | 위험구역               |
| `lt_c_aisresc`      | 비행제한구역           |
| `lt_c_aisctrc`      | 관제권                 |
| `lt_c_aismoac`      | 군작전구역             |
| `lt_c_aisaltc`      | 경계구역               |
| `lt_c_aisatzc`      | 비행장교통구역         |
| `lt_c_aisfldc`      | 경량항공기 이착륙장    |
| `lt_c_wgisnpgug`    | 국립자연공원           |
| `lt_c_aisuac`       | 초경량비행장치공역(UA) |
| `lt_c_aisdronezone` | 드론시범사업구역       |

## VWorldFeature (기존, 확장)

`types.ts`의 `VWorldFeature`에 클라이언트 태깅 필드 추가:

| 필드         | 타입                                                    | 설명                                                                                                                     |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `type`       | `'Feature'`                                             | 기존                                                                                                                     |
| `geometry`   | `{ type: 'MultiPolygon'; coordinates: number[][][][] }` | 기존                                                                                                                     |
| `properties` | `Record<string, unknown>`                               | 기존, VWorld 원본 응답 그대로                                                                                            |
| `zoneType`   | `string` (신규)                                         | `tagFeatureZoneType`이 typename 기준으로 주입하는 한글 구역 종류 라벨(위 표). VWorld 원본에는 없는 클라이언트 전용 필드. |

## 순수 함수: `tagFeatureZoneType`

- **입력**: `VWorldFeature[]`(태깅 전, VWorld 원본 그대로), `typename: string`
- **출력**: `VWorldFeature[]`(각 feature에 `zoneType` 필드가 채워진 배열)
- **동작**: `typename`을 Zone Type Label Map에서 조회해 모든 feature에 동일한 `zoneType` 값을 주입한다. 매핑에 없는 typename이 들어오면 에러를 던진다(설정 누락을 조기에 발견하기 위함 — 이번 스코프의 typename은 모두 매핑 테이블에 존재하므로 정상 경로에서는 발생하지 않는다).
- **위치**: `src/features/airspace/utils/tagFeatureZoneType.ts` (TDD 대상, research.md 참고)
