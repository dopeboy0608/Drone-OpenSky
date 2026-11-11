# 코드 스멜 학습 노트 (이슈 #51)

> 개인 학습용 정리. `src` 전체를 진입점 기준으로 조사해 찾은 코드 스멜의 **증상, 원인, 위험, 개선 방안**과 실제 적용 결과를 남긴다. 용어는 Martin Fowler의 _Refactoring_(2판) 카탈로그를 따른다.
>
> - 의존 그래프와 영향 반경: [`51-refactor-dependency-map.md`](./51-refactor-dependency-map.md)
> - 같은 내용을 탐색하기 쉽게 만든 아티팩트가 따로 있다(제목: 코드 스멜 학습 노트).

## 이 문서를 읽는 법

1. **요약 표**로 어떤 스멜이 어디에 있었는지 훑는다.
2. **스멜이 생기는 다섯 가지 원인**과 **안전하게 리팩터링하는 절차**는 이 프로젝트를 넘어 일반화되는 부분이다.
3. 관심 있는 항목은 **항목별 상세**에서 Before/After 코드와 함께 본다.
4. 코드 리뷰 때는 맨 아래 **셀프 체크리스트**를 쓴다.

## 요약 표

| #   | 상태       | 스멜                                           | 증상 한 줄                                                                   | 적용한 패턴                                                                            |
| --- | ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| P1  | 적용       | 중복 코드(같은 사실의 이중 정의) + 암묵적 결합 | 같은 12종을 두 구조로 정의하고, 키 순서가 숨은 의미를 가진다                 | Single Source of Truth, Replace Derived Variable with Query                            |
| P2  | 적용       | 중복 코드                                      | "켜진 typename" 판정식이 두 함수에 복사되어 있다                             | Extract Function(재사용), 합성                                                         |
| P3  | 적용       | 중복 코드(매직 넘버) + 암묵적 결합             | 타일 크기 256이 두 파일에 따로 있고, 서로 같아야 한다는 사실이 코드에 없다   | Extract 공유 상수, 제약을 테스트로 고정                                                |
| P4  | 적용       | 중복 코드                                      | 전국 조회와 클릭 지점 조회가 WFS 요청 파라미터를 복사해 쓴다                 | Extract Function                                                                       |
| P5  | 적용       | 긴 함수 / 변경 이유가 여럿                     | 쿼리 훅 하나가 정책, 토스트, 새로고침 분기, 안내문을 모두 가진다             | Extract Function, Extract Hook, Decompose Conditional, Replace Conditional with Lookup |
| P6  | 적용       | 긴 함수(합성 지점 컴포넌트)                    | MapView 안에 긴 인라인 핸들러와 중복된 panTo가 있다 (a만 적용)               | Extract Function, (b) Extract Hook                                                     |
| P7  | 적용       | 테스트하기 어려운 구조 + 주석 누적             | 부팅 코드가 모듈 최상단 부수효과라 테스트할 수 없고, 주석이 이어 붙어 있다   | Extract Function, 별칭 통일                                                            |
| P8  | 보류       | 변경 이유가 여럿                               | WMS 레이어 파일이 SDK 등록 규칙과 컴포넌트를 함께 가진다                     | Extract Module                                                                         |
| P9  | 보류       | 긴 함수                                        | findZoneTypeAtPoint가 취소 연결, 병렬 요청, 우선순위 소비를 한 함수에서 한다 | Extract Function                                                                       |
| P10 | 보류       | 긴 콜백, 흩어진 보조 상태                      | "마지막 요청만 반영" 장치가 useWmsZoneClick 안에 흩어져 있다                 | Extract Hook                                                                           |
| P11 | 보류       | 중복(사소)                                     | 토스트 지속 시간 상수와 개발 모드 판정이 여러 곳에 있다                      | Extract Variable                                                                       |
| D1  | 제안 안 함 | 전역 객체 의존                                 | 순수 기하 함수가 전역 kakao 객체에 의존한다                                  | Split Phase                                                                            |
| D2  | 제안 안 함 | 원시값 집착                                    | typename이 그냥 문자열이다                                                   | Replace Primitive with Object / Branded Type                                           |
| D3  | 제안 안 함 | 의미가 헷갈리는 이름                           | 이름이 비슷해 헷갈리는 두 상수                                               | Change Function Declaration (개명)                                                     |
| D4  | 제안 안 함 | 중복(아직 두 곳)                               | 두 메뉴 컴포넌트의 팝오버 버튼 구조가 같다                                   | Extract Component                                                                      |
| D5  | 제안 안 함 | 조회와 변경이 섞임                             | readZoneCache가 읽기와 삭제를 함께 한다                                      | Separate Query from Modifier                                                           |

적용 7개, 보류 4개(위험이 중간이거나 가치가 작아 이번에 하지 않음), 제안 안 함 5개(호환성이나 "세 번 규칙" 때문에 일부러 하지 않음).

## 스멜이 생기는 다섯 가지 원인

이 프로젝트에서 실제로 본 원인을 일반화한 것이다. 어느 것도 "실력 부족"이 아니라 정상적인 개발 속도에서 자연스럽게 생긴 결과다.

1. **기능이 하나씩 덧붙는다(누적)** — 각 변경은 작고 합리적이었지만, 같은 함수나 파일에 분기와 상수가 계속 쌓였다. 예: `useAirspaceZoneQueries`(#37, #48, #68, #73), `MapView`, `index.tsx`.
2. **복사해서 한 줄만 바꾼다** — 가장 빠르고 안전해 보여서 사본이 생겼다. 예: `getVisibleTypenames`(#73), `fetchAirspaceZonesAtPoint`(#75).
3. **같은 사실을 두 번 표현한다** — 각 모듈이 자기 안에서 필요한 값을 선언했고, 둘이 같아야 한다는 제약이 코드에 없었다. 예: typename 두 정의, 타일 크기 256.
4. **순서나 타이밍에 의미가 숨는다** — 객체 키 삽입 순서처럼 언어가 우연히 보장하는 성질에 의미를 실었고, 이유는 주석에만 남았다.
5. **테스트하기 어려운 구조** — 진입점의 최상단 부수효과는 import하는 순간 실행되어 중요한 분기가 테스트 밖에 있었다.

## 안전하게 리팩터링하는 절차

이번 작업에서 실제로 지킨 순서다.

1. **특성 테스트를 먼저 쓴다** — 테스트가 없는 코드(`fetchAirspaceZones`, `constants`)는 고치기 전에 현재 동작을 고정했다. 리팩터링 전후에 같은 테스트가 통과하면 "같다"가 증명된다.
2. **한 번에 한 패턴, 작은 단계** — 항목마다 적용하고 `pnpm test`, `pnpm lint`, `npx tsc --noEmit`을 돌렸다. 실패하면 바로 직전 변경이 원인이다.
3. **호환은 "추가와 위임"으로 지킨다** — 기존 export는 그대로 두고 새 파일을 추가해 위임했다. 호출부와 `vi.mock` 경로를 건드리지 않았다. 적용 후 export 이름 목록을 전후로 비교해 확인했다.
4. **테스트가 못 닿는 곳은 다른 수단으로 확인한다** — 진입점과 별칭은 단위 테스트로 번들러 동작을 증명하지 못해 `pnpm build`를 함께 돌렸다.
5. **검사 도구의 한계를 안다** — 이전 단계(`code-organizer`)에서 "변경 전후 줄 집합이 같다"는 검사가 이펙트를 중간에서 자르는 편집 오류를 못 잡았고, 테스트와 린트가 잡았다. 한 가지 검사에 기대지 않는다.
6. **하지 않는 판단도 기록한다** — 공개 타입 변경, 개명, 세 번 규칙에 못 미치는 중복은 제안하지 않았다. 이유를 남기면 나중에 다시 판단할 수 있다.

## 항목별 상세

### P1. 같은 12종을 두 구조로 정의하고, 키 순서가 숨은 의미를 가진다

- **상태**: 적용
- **스멜**: Duplicated Code (중복 코드(같은 사실의 이중 정의) + 암묵적 결합)
- **대상**: `features/airspace/constants.ts`
- **패턴**: Single Source of Truth, Replace Derived Variable with Query

**증상**

구역 종류 12개(typename)가 `AIRSPACE_ZONE_CONFIGS`(그룹별 배열)와 `TYPENAME_ZONE_LABELS`(라벨 맵) 두 곳에 따로 적혀 있었다. 둘의 순서는 우연히 일치했고, 그 순서는 "위험도 우선순위"라는 의미를 가진 채 WMS 타일 쌓임과 클릭 판정에 쓰였다.

**Before**

```ts
export const AIRSPACE_ZONE_CONFIGS = [
  {
    level: 'prohibited',
    typenames: ['lt_c_aisprhc', 'lt_c_aistemp', 'lt_c_aisdngc'],
    color: '#FF4D4F' /* … */,
  },
  /* restricted 7종, available 2종 … */
];
export const TYPENAME_ZONE_LABELS: Record<string, string> = {
  lt_c_aisprhc: '비행금지구역',
  lt_c_aistemp: '임시비행금지구역',
  /* … 12종, 키 삽입 순서가 곧 우선순위 */
};
```

**원인**

- 구역 세분화 기능(#33)에서 기존 "그룹" 구조 옆에 라벨 맵이 덧붙었다. 각자 필요해서 따로 선언했고, 서로를 파생시킬 이유가 그때는 보이지 않았다.
- 나중에 WMS 기능(#72~#75)이 "객체 키 순서 = 우선순위"라는 성질을 읽어 쓰기 시작했다. 그 의미는 주석에만 있었고 구조로는 표현되지 않았다.

**무엇이 위험한가**

한쪽만 고치면 그룹 체크박스, 개별 체크박스, 클릭 판정이 서로 다른 12종을 보게 된다. 선언 순서를 바꾸면 타일 쌓임과 클릭 우선순위가 아무 오류 없이 함께 바뀐다.

**개선 방안**

우선순위 순서의 표(`ZONE_TYPES`) 하나를 단일 출처로 두고, 두 export를 그 표에서 파생한다. 이름·값·순서는 그대로다. 변경 전에 현재 값과 순서를 고정하는 특성 테스트를 먼저 만들었다.

**After**

```ts
const ZONE_TYPES = [
  { typename: 'lt_c_aisprhc', label: '비행금지구역', level: 'prohibited' },
  { typename: 'lt_c_aistemp', label: '임시비행금지구역', level: 'prohibited' },
  /* … 위험도 순 12종 */
] as const satisfies readonly { typename: string; label: string; level: AirspaceZoneLevel }[];

export const AIRSPACE_ZONE_CONFIGS: AirspaceZoneConfig[] = LEVEL_STYLES.map((style) => ({
  ...style,
  typenames: ZONE_TYPES.filter((zone) => zone.level === style.level).map((zone) => zone.typename),
}));
export const TYPENAME_ZONE_LABELS: Record<string, string> = Object.fromEntries(
  ZONE_TYPES.map((zone) => [zone.typename, zone.label]),
);
```

**결과**: 적용. 테스트 +5(특성 테스트: 값, 순서, 그룹과 라벨의 순서 일치). 소비하는 12개 파일은 수정하지 않았다.

**검증**: 특성 테스트가 리팩터링 전후 모두 통과. export 이름 목록 동일.

**배운 점**: 같은 사실을 두 번 쓰고 있다면 하나를 파생으로 만든다. 순서가 의미를 가진다면 "객체 키 순서" 같은 우연에 맡기지 말고 순서 있는 자료구조로 드러내고 이유를 적는다.

### P2. "켜진 typename" 판정식이 두 함수에 복사되어 있다

- **상태**: 적용
- **스멜**: Duplicated Code (중복 코드)
- **대상**: `features/airspace/utils/getVisibleZoneTypes.ts`, `features/airspace/utils/getVisibleTypenames.ts`
- **패턴**: Extract Function(재사용), 합성

**증상**

`isVisible && typename in TYPENAME_ZONE_LABELS` 판정과 `Object.entries(...).filter(...)` 흐름이 두 함수에서 똑같고, 마지막 `map`만 달랐다.

**Before**

```ts
// getVisibleZoneTypes
Object.entries(visibility)
  .filter(([typename, isVisible]) => isVisible && typename in TYPENAME_ZONE_LABELS)
  .map(([typename]) => TYPENAME_ZONE_LABELS[typename]);
// getVisibleTypenames (같은 filter, map만 다름)
Object.entries(visibility)
  .filter(([typename, isVisible]) => isVisible && typename in TYPENAME_ZONE_LABELS)
  .map(([typename]) => typename);
```

**원인**

- 범례 토글(#25)에서 `getVisibleZoneTypes`가 먼저 생겼다. WMS 필터(#73)에서 같은 판정이 필요해지자 복사한 뒤 마지막 변환만 바꿨다. 복사가 가장 빠른 길이었다.

**무엇이 위험한가**

판정 규칙이 바뀌면(예: 새 typename 허용, 순서 정책) 한쪽만 고쳐지기 쉽다. 그러면 폴리곤 모드와 타일 모드가 서로 다른 구역을 켜진 것으로 본다.

**개선 방안**

`getVisibleZoneTypes`가 `getVisibleTypenames`의 결과를 받아 라벨로 바꾸게 한다. 판정은 한 곳에만 둔다.

**After**

```ts
export const getVisibleZoneTypes = (visibility: Record<string, boolean>): Set<string> =>
  new Set(getVisibleTypenames(visibility).map((typename) => TYPENAME_ZONE_LABELS[typename]));
```

**결과**: 적용. 기존 단위 테스트 2개가 그대로 통과(동작과 삽입 순서 동일).

**검증**: 두 함수의 기존 테스트, export 동일.

**배운 점**: "복사해서 한 줄만 바꾼 함수"는 두 번째 사본이 생기는 순간이 합칠 시점이다. 변환(map)만 다르면 앞단을 재사용해 합성한다.

### P3. 타일 크기 256이 두 파일에 따로 있고, 서로 같아야 한다는 사실이 코드에 없다

- **상태**: 적용
- **스멜**: Duplicated Code (중복 코드(매직 넘버) + 암묵적 결합)
- **대상**: `features/airspace/components/AirspaceWmsLayer.tsx`, `features/airspace/utils/buildWmsTileUrl.ts`
- **패턴**: Extract 공유 상수, 제약을 테스트로 고정

**증상**

카카오 Tileset의 `width/height`와 WMS 요청의 `WIDTH/HEIGHT`가 각각 `TILE_SIZE = 256`으로 선언돼 있었다. 둘은 반드시 같아야 하지만 둘을 잇는 코드가 없었다.

**Before**

```ts
// AirspaceWmsLayer.tsx
const TILE_SIZE = 256;
new kakao.maps.Tileset({ width: TILE_SIZE, height: TILE_SIZE, /* … */ });
// buildWmsTileUrl.ts
const TILE_SIZE = 256;
WIDTH: String(TILE_SIZE), HEIGHT: String(TILE_SIZE),
```

**원인**

- WMS 타일(#72)에서 "타일 등록"과 "URL 만들기"를 서로 다른 파일로 나눠 만들었고, 각 파일이 자기 안에서 크기를 선언했다. 두 파일이 같은 크기를 가정한다는 사실은 머릿속에만 있었다.

**무엇이 위험한가**

한쪽만 바꾸면 서버가 그린 이미지가 타일 칸에 늘어나거나 줄어든다. 줌에 따라 흐려지거나 어긋나 보일 뿐 오류가 나지 않아 원인 찾기 어렵다.

**개선 방안**

`buildWmsTileUrl.ts`가 `WMS_TILE_SIZE`를 export하고 `AirspaceWmsLayer`가 그것을 import한다. 두 값이 같다는 사실은 테스트 두 개로 고정했다.

**After**

```ts
// buildWmsTileUrl.ts
export const WMS_TILE_SIZE = 256;
// AirspaceWmsLayer.tsx
import { WMS_TILE_SIZE, buildWmsTileUrl } from '@/features/airspace/utils/buildWmsTileUrl';
new kakao.maps.Tileset({ width: WMS_TILE_SIZE, height: WMS_TILE_SIZE /* … */ });
```

**결과**: 적용. 테스트 +2(WIDTH/HEIGHT가 상수와 같다, Tileset 크기가 상수와 같다). `buildWmsTileUrl.ts`에 export가 하나 **추가**됐다(제거 없음).

**검증**: 추가된 테스트 2개, 기존 테스트 통과.

**배운 점**: "이 두 값은 같아야 한다"는 제약이 있으면 상수 하나로 묶는다. 그럴 수 없으면 테스트로라도 제약을 코드에 남긴다.

### P4. 전국 조회와 클릭 지점 조회가 WFS 요청 파라미터를 복사해 쓴다

- **상태**: 적용
- **스멜**: Duplicated Code (중복 코드)
- **대상**: `features/airspace/api/fetchAirspaceZones.ts`, `features/airspace/api/fetchAirspaceZonesAtPoint.ts`
- **패턴**: Extract Function

**증상**

두 함수 모두 `SERVICE`, `REQUEST`, `TYPENAME`, `SRSNAME`, `OUTPUT`이 같고 `BBOX`(와 `signal`)만 달랐다. 같은 8줄 요청 블록이 두 파일에 있었다.

**Before**

```ts
// fetchAirspaceZones.ts
vworldClient.get('/wfs', {
  params: {
    SERVICE: 'WFS',
    REQUEST: 'GetFeature',
    TYPENAME: typename,
    SRSNAME: 'EPSG:4326',
    OUTPUT: 'application/json',
    BBOX: KOREA_BBOX,
  },
});
// fetchAirspaceZonesAtPoint.ts — 같은 블록 + signal, BBOX만 계산값
```

**원인**

- 클릭 안내(#75)를 만들 때 기존 전국 조회 함수를 복사해 BBOX만 바꾸는 것이 가장 빨랐다. 두 함수가 "같은 서비스의 같은 요청"이라는 사실은 사본이 생기며 흐려졌다.

**무엇이 위험한가**

SRSNAME이나 BBOX 축 순서(경도,위도) 같은 서버와의 계약이 한쪽에서만 바뀌면 두 조회의 좌표 해석이 어긋난다. 오류 없이 엉뚱한 위치를 받아 온다.

**개선 방안**

공통 내부 함수 `requestAirspaceFeatures(typename, bbox, signal?)`를 새 파일에 두고, 두 공개 함수는 시그니처를 유지한 채 위임한다.

**After**

```ts
export const fetchAirspaceZones = (typename: string): Promise<VWorldFeatureCollection> =>
  requestAirspaceFeatures(typename, KOREA_BBOX);

export const fetchAirspaceZonesAtPoint = (typename, { lat, lng }, signal?) =>
  requestAirspaceFeatures(typename, [lng - d, lat - d, lng + d, lat + d].join(','), signal);
```

**결과**: 적용. `fetchAirspaceZones`는 직접 테스트가 없어서 **변경 전에** MSW로 요청 파라미터를 고정하는 특성 테스트 3개를 먼저 추가했다.

**검증**: 특성 테스트가 리팩터링 전후 모두 통과, `findZoneTypeAtPoint` 테스트가 모킹하는 모듈 경로는 그대로.

**배운 점**: 테스트가 없는 코드를 고칠 때는 현재 동작을 고정하는 특성 테스트(characterization test)를 먼저 쓴다. 그러면 "같다"를 눈이 아니라 테스트가 증명한다.

### P5. 쿼리 훅 하나가 정책, 토스트, 새로고침 분기, 안내문을 모두 가진다

- **상태**: 적용
- **스멜**: Long Function / Divergent Change (긴 함수 / 변경 이유가 여럿)
- **대상**: `features/airspace/queries/useAirspaceZoneQueries.ts`
- **패턴**: Extract Function, Extract Hook, Decompose Conditional, Replace Conditional with Lookup

**증상**

한 훅 안에 (1) 쿼리 옵션(캐시 켬/끔에 따른 분기가 5곳), (2) 에러 토스트 이펙트와 ref, (3) 새로고침 정책 3분기, (4) 안내문 조합이 섞여 있었다. 같은 조건 `isCacheEnabled`가 반복됐다.

**Before**

```ts
staleTime: isCacheEnabled ? STALE_TIME_MS : Infinity,
refetchOnWindowFocus: isCacheEnabled,
refetchInterval: isCacheEnabled ? STALE_TIME_MS : false,
/* … 같은 훅 안에 toast ref + useEffect, refreshStaleZones 3분기, 안내문 조합 … */
```

**원인**

- 기능이 하나씩 덧붙었다. 24시간 캐시(#37), IndexedDB 저장(#48), 캐시 온오프와 갱신 정책(#68), WMS 모드 조회 중단(#73). 각 변경은 작았지만 같은 함수에 분기를 하나씩 더했다.

**무엇이 위험한가**

한 가지를 바꾸려고 읽어야 하는 범위가 훅 전체다. 세 옵션이 서로 어긋나면(예: 만료는 없는데 주기 재조회만 켜짐) 전국 50MB를 의도치 않게 반복해서 받는다.

**개선 방안**

`getCachePolicy(isCacheEnabled)`가 세 옵션을 한 객체로 돌려주고, 에러 토스트는 `useZoneErrorToasts` 훅으로, 안내문은 `formatFreshMessage`로 뺐다. 훅의 경로·export·반환 타입은 그대로다.

**After**

```ts
const getCachePolicy = (isCacheEnabled: boolean): CachePolicy =>
  isCacheEnabled
    ? { staleTime: STALE_TIME_MS, refetchOnWindowFocus: true, refetchInterval: STALE_TIME_MS }
    : { staleTime: Infinity, refetchOnWindowFocus: false, refetchInterval: false };

/* 쿼리 옵션 */ ...getCachePolicy(isCacheEnabled),
useZoneErrorToasts(results, message);
```

**결과**: 적용. 기존 훅 테스트 2개 파일과 `MapView.test`가 그대로 통과. antd 내부 경로 import를 피하려고 메시지 타입은 `ReturnType<typeof AntdApp.useApp>`에서 얻었다.

**검증**: 테스트 통과, tsc 통과, export 동일.

**배운 점**: 같은 조건으로 값을 여러 개 고르고 있으면 "정책 객체" 하나로 묶는다. 한 함수가 변경 이유를 여러 개 가질 때(옵션, 알림, 새로고침) 이유별로 나눈다.

### P6. MapView 안에 긴 인라인 핸들러와 중복된 panTo가 있다 (a만 적용)

- **상태**: 적용
- **스멜**: Long Function (긴 함수(합성 지점 컴포넌트))
- **대상**: `features/map/components/MapView.tsx`
- **패턴**: Extract Function, (b) Extract Hook

**증상**

`MapView`가 주소 검색 선택과 현재 위치 이동 핸들러를 JSX 안에 인라인으로 가졌고, `panTo(new kakao.maps.LatLng(...))`가 두 곳에서 반복됐다. 이 파일은 의존 그래프에서 팬아웃 20의 합성 지점이다.

**Before**

```ts
<AddressSearch onSelectCandidate={({ lat, lng }) => {
  hasSetInitialCenterRef.current = true;
  kakaoMapInstance?.panTo(new kakao.maps.LatLng(lat, lng));
  showSearchMarker({ lat, lng });
}} />
```

**원인**

- 지도 위 기능이 하나씩 붙었다(주소 검색 #26, 현재 위치 #35~#39, 표시 방식 #71, 클릭 안내 #75). 컴포넌트는 각 기능을 연결하는 자리라 JSX에 짧은 핸들러가 계속 인라인으로 추가됐다.

**무엇이 위험한가**

JSX가 길어져 레이아웃과 동작이 한 덩어리가 된다. 같은 `panTo` 코드가 둘이라 지도 이동 방식을 바꿀 때 한 곳을 놓치기 쉽다.

**개선 방안**

(a) 핸들러를 이름 있는 함수로 빼고 `panToPosition`으로 중복을 없앴다. (b) 필터·선택·클릭을 하나의 훅으로 옮기는 안은 위험이 중간이라 이번에는 하지 않았다.

**After**

```ts
const panToPosition = ({ lat, lng }: MapPosition) => {
  kakaoMapInstance?.panTo(new kakao.maps.LatLng(lat, lng));
};
const handleSelectCandidate = ({ lat, lng }: SearchCandidate) => { /* 주석 보존 */
  hasSetInitialCenterRef.current = true;
  panToPosition({ lat, lng });
  showSearchMarker({ lat, lng });
};
<AddressSearch onSelectCandidate={handleSelectCandidate} />
```

**결과**: (a) 적용, (b) 보류. `MapView.test`가 두 핸들러의 `panTo` 호출을 이미 검증하고 있어 그대로 통과했다.

**검증**: 기존 `MapView.test` 통과.

**배운 점**: 합성 컴포넌트는 커지기 쉽다. 먼저 위험이 낮은 "이름 붙이기"부터 하고, 구조를 옮기는 큰 변경은 따로 승인받아 나눠서 한다.

### P7. 부팅 코드가 모듈 최상단 부수효과라 테스트할 수 없고, 주석이 이어 붙어 있다

- **상태**: 적용
- **스멜**: Hard to Test (부수효과가 최상단에 있음) (테스트하기 어려운 구조 + 주석 누적)
- **대상**: `index.tsx`, `App.tsx`
- **패턴**: Extract Function, 별칭 통일

**증상**

`index.tsx`는 import하는 즉시 실행되어 "캐시 꺼짐이면 하이드레이션을 건너뛴다"는 중요한 결정을 테스트할 방법이 없었다. 네 문장이 한 줄 주석으로 이어 붙어 있었고, `App.tsx`와 `index.tsx`만 상대 경로 import를 썼다.

**Before**

```ts
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  // … 네 문장이 한 줄로 이어진 주석 …
  const hydration = useAirspaceCacheSettingStore.getState().enabled ? hydrateAirspaceCache(queryClient) : Promise.resolve();
  hydration.finally(() => root.render(<StrictMode><App /></StrictMode>));
}
```

**원인**

- IndexedDB 캐시(#48)와 캐시 온오프(#68)가 같은 자리에 하이드레이션 분기를 덧붙였다. 주석도 기능이 바뀔 때마다 뒤에 문장을 이어 붙였다. 진입점은 보통 "한 번 실행되는 코드"라 테스트 대상으로 여겨지지 않는다.

**무엇이 위험한가**

하이드레이션 분기가 틀려도 테스트가 잡지 못한다. 캐시를 켠 채 하이드레이션 전에 렌더하면 불필요한 50MB 요청이 먼저 나간다.

**개선 방안**

`bootstrap(rootEl)` 함수를 새 파일로 빼서 import해도 실행되지 않게 하고 세 가지 동작을 테스트로 고정했다(TDD). 주석은 내용 변경 없이 문장별로 나눴고, import는 `@/` 별칭으로 통일했다.

**After**

```ts
// index.tsx
const rootEl = document.getElementById('root');
if (rootEl) {
  bootstrap(rootEl);
}
// bootstrap.tsx — export const bootstrap = (rootEl: HTMLElement) => { /* 동일 로직 */ };
```

**결과**: 적용. 테스트 +3(루트 생성, 캐시 꺼짐이면 하이드레이션 없이 렌더, 켜짐이면 하이드레이션 후 렌더). 실제 `pnpm build`로 번들러가 `@/` 별칭과 CSS import를 처리하는지 확인했다.

**검증**: 신규 테스트 3개, 빌드 성공. 진입점은 단위 테스트만으로는 번들러 동작을 증명하지 못해 빌드를 함께 돌렸다.

**배운 점**: 최상단 부수효과는 함수로 감싸야 테스트할 수 있다. 단위 테스트가 닿지 못하는 영역(번들러, 별칭)은 빌드 같은 다른 수단으로 확인한다.

### P8. WMS 레이어 파일이 SDK 등록 규칙과 컴포넌트를 함께 가진다

- **상태**: 보류
- **스멜**: Divergent Change (변경 이유가 여럿)
- **대상**: `features/airspace/components/AirspaceWmsLayer.tsx`
- **패턴**: Extract Module

**증상**

컴포넌트 파일에 Tileset 등록, 슬롯 규칙(4개씩), 전역 SDK 접근이 함께 있다.

**Before**

```ts
// AirspaceWmsLayer.tsx: registerWmsTileset, getRegisteredMapTypeId, SLOT_INDEXES … + 컴포넌트
```

**원인**

- WMS 제약(INVALID_RANGE)을 해결하며(#73) 한 파일에 슬롯 로직이 쌓였다.

**무엇이 위험한가**

컴포넌트를 읽을 때 SDK 등록 세부까지 함께 읽어야 한다.

**개선 방안**

등록·슬롯 규칙을 `utils/wmsTilesets.ts`로 옮기고 컴포넌트는 이펙트만 남긴다. 파일이 늘고 이동이 일어나는 변경이라 효과 대비 이득이 작아 이번에는 하지 않았다.

**After**

```ts
// 제안: utils/wmsTilesets.ts 에서 MAX_LAYERS_PER_REQUEST, SLOT_INDEXES, registerWmsTileset 등을 export
```

**결과**: 보류(선택 항목). 위험은 낮다.

**배운 점**: 스멜이 있어도 "읽는 데 실제로 방해되는가"와 변경 비용을 비교해 우선순위를 정한다.

### P9. findZoneTypeAtPoint가 취소 연결, 병렬 요청, 우선순위 소비를 한 함수에서 한다

- **상태**: 보류
- **스멜**: Long Function (긴 함수)
- **대상**: `features/airspace/api/findZoneTypeAtPoint.ts`
- **패턴**: Extract Function

**증상**

약 50줄 안에 AbortSignal 합치기, 요청 시작, 우선순위 순서로 결과 소비가 있다.

**Before**

```ts
// 바깥 취소와 안쪽 취소를 합치고, 요청을 settle로 감싸고, 순서대로 await하며 조기 반환
```

**원인**

- 클릭 지연 개선(조기 확정, 요청 취소)을 같은 함수에 차례로 넣었다.

**무엇이 위험한가**

취소 처리와 우선순위 로직이 섞여 있어 한쪽을 고칠 때 다른 쪽의 타이밍을 깨뜨리기 쉽다.

**개선 방안**

`linkAbortSignals`, `startPointQueries`, `pickByPriority`로 나눈다. 취소 순서는 미묘해서 위험이 중간이다. 테스트 17케이스가 있어 안전망은 있지만 이번 1차에서는 제외했다.

**After**

```ts
// 제안: 세 개의 작은 함수와 이를 조합하는 본문
```

**결과**: 보류.

**배운 점**: 비동기 취소처럼 타이밍이 중요한 코드는 구조 변경 위험이 높으므로 안전망(테스트)을 충분히 확인한 뒤 따로 한다.

### P10. "마지막 요청만 반영" 장치가 useWmsZoneClick 안에 흩어져 있다

- **상태**: 보류
- **스멜**: Long Function / Temporary Field (긴 콜백, 흩어진 보조 상태)
- **대상**: `features/airspace/hooks/useWmsZoneClick.ts`
- **패턴**: Extract Hook

**증상**

요청 ID ref, AbortController ref, pending 상태, finally 정리가 한 콜백 안에 얽혀 있다.

**Before**

```ts
// latestRequestIdRef, abortControllerRef, pendingPosition, finally 분기
```

**원인**

- 지연 개선 과정에서 "이전 응답 무시", "이전 요청 취소", "조회 중 표시"를 차례로 얹었다.

**무엇이 위험한가**

이 장치를 이해하려면 콜백 전체를 읽어야 한다.

**개선 방안**

`useLatestRequest`처럼 "새 요청 시작, 최신인지 확인" 훅으로 뺀다. 다른 곳에서 쓸 일이 아직 없어 이번에는 하지 않았다.

**After**

```ts
// 제안: const { begin } = useLatestRequest(); const { isLatest, signal } = begin();
```

**결과**: 보류.

**배운 점**: 패턴이 한 곳에서만 쓰이면 서둘러 추상화하지 않는다(재사용이 생길 때).

### P11. 토스트 지속 시간 상수와 개발 모드 판정이 여러 곳에 있다

- **상태**: 보류
- **스멜**: Duplicated Code (사소함) (중복(사소))
- **대상**: `useAirspaceZoneQueries.ts`, `useWmsZoneClick.ts`, `api/vworldClient.ts`
- **패턴**: Extract Variable

**증상**

`ERROR_TOAST_DURATION_SECONDS = 3`이 두 파일에, `MODE === "development"` 비교가 한 파일에 두 번 있다.

**Before**

```ts
const ERROR_TOAST_DURATION_SECONDS = 3; // 두 파일에 각각
```

**원인**

- 각 기능이 자기 파일에 필요한 상수를 선언했다.

**무엇이 위험한가**

값이 어긋나도 눈에 띄지 않는 정도의 영향이다.

**개선 방안**

공유 상수 파일로 합치거나 `isDevelopment` 변수로 뺀다. 가치가 작아 해당 파일을 건드릴 때 함께 한다.

**After**

```ts
// 제안: src/constants/toast.ts, const isDevelopment = import.meta.env.MODE === "development"
```

**결과**: 보류.

**배운 점**: 사소한 중복은 그 파일을 다른 이유로 열 때 함께 정리한다. 일부러 새 파일을 만들 만큼은 아니다.

### D1. 순수 기하 함수가 전역 kakao 객체에 의존한다

- **상태**: 제안 안 함
- **스멜**: Global Data / 전역 의존 (전역 객체 의존)
- **대상**: `multiPolygonToKakaoPaths.ts`, `polygonCentroid.ts`
- **패턴**: Split Phase

**증상**

GeoJSON 좌표를 변환하는 순수 계산인데 `kakao.maps.LatLng`를 만들고 읽는다. 폴리곤 레이어는 이를 다시 일반 객체로 되돌린다.

**Before**

```ts
GeoJSON → new kakao.maps.LatLng → 다시 { lat, lng }
```

**원인**

- 카카오 `Polygon`에 넘길 값을 만든다는 목적에서 곧바로 SDK 객체를 썼다.

**무엇이 위험한가**

테스트에 카카오 모의가 필요하고, 변환이 한 번 더 일어난다.

**개선 방안**

일반 객체 버전을 추가하고 기존 함수를 래퍼로 남긴다. 다만 폴리곤 `path` 참조 안정성(렌더 성능, #47)에 영향이 있고 공개 함수 변경이 따라 별도 이슈로 다루길 권했다.

**After**

```ts
// 제안: multiPolygonToPaths(coords): {lat,lng}[][][] 추가, 기존은 위임
```

**결과**: 제안하지 않음(호환성·성능 위험).

**배운 점**: 스멜을 알아도 공개 인터페이스나 성능 계약을 건드린다면 별도 작업으로 분리한다.

### D2. typename이 그냥 문자열이다

- **상태**: 제안 안 함
- **스멜**: Primitive Obsession (원시값 집착)
- **대상**: `features/airspace 전반(13개 파일)`
- **패턴**: Replace Primitive with Object / Branded Type

**증상**

구역 종류 식별자가 `string`이고 `Record<string, string>`으로 다뤄져, 알 수 없는 키를 컴파일러가 막지 못한다. 런타임에서 `in` 검사로 막는다.

**Before**

```ts
export const TYPENAME_ZONE_LABELS: Record<string, string>;
```

**원인**

- 처음에는 외부 API가 주는 문자열 그대로 썼다.

**무엇이 위험한가**

오타가 있어도 컴파일되고 런타임에 조용히 무시된다.

**개선 방안**

유니온 타입으로 좁히면 공개 타입이 바뀌어 13개 파일에 파급된다. 이번 작업의 "공개 인터페이스 유지" 제약에 어긋나 제안하지 않았다.

**After**

```ts
// 가능한 형태: type AirspaceTypename = typeof ZONE_TYPES[number]["typename"]
```

**결과**: 제안하지 않음(공개 타입 변경).

**배운 점**: 타입을 좁히면 좋지만 변경 범위가 넓다. 호환성 제약이 있을 때는 별도 주기에 한다.

### D3. 이름이 비슷해 헷갈리는 두 상수

- **상태**: 제안 안 함
- **스멜**: Mysterious Name (의미가 헷갈리는 이름)
- **대상**: `features/airspace/constants.ts`
- **패턴**: Change Function Declaration (개명)

**증상**

`AIRSPACE_ZONE_LABELS`(그룹 → 라벨)와 `TYPENAME_ZONE_LABELS`(typename → 라벨)는 이름이 비슷하지만 키가 다르다.

**Before**

```ts
AIRSPACE_ZONE_LABELS vs TYPENAME_ZONE_LABELS
```

**원인**

- 기능이 순서대로 추가되며 앞의 이름을 따라 지었다.

**무엇이 위험한가**

잘못된 쪽을 쓰면 라벨 대신 `undefined`가 나온다.

**개선 방안**

개명은 export 이름 변경이라 호환성에 어긋난다. 대신 설명 주석만 추가하는 안이 가능하다.

**After**

```ts
// 제안: 이름은 두고 JSDoc으로 키 종류를 명시
```

**결과**: 제안하지 않음(공개 이름 변경).

**배운 점**: 좋은 이름은 처음 짓는 순간이 가장 싸다. 이미 널리 쓰이는 이름은 바꾸는 비용이 크다.

### D4. 두 메뉴 컴포넌트의 팝오버 버튼 구조가 같다

- **상태**: 제안 안 함
- **스멜**: Duplicated Code (3회 미만) (중복(아직 두 곳))
- **대상**: `AirspaceCacheMenu.tsx`, `AirspaceRenderModeMenu.tsx`
- **패턴**: Extract Component

**증상**

원형 아이콘 버튼 + 왼쪽으로 열리는 팝오버 구조가 두 컴포넌트에 같다.

**Before**

```ts
<Popover trigger="click" placement="left" …><Button shape="circle" … /></Popover> ×2
```

**원인**

- 같은 UX 규칙(모바일에서 화면 밖으로 나가지 않기)을 두 번 따랐다.

**무엇이 위험한가**

규칙이 바뀌면 두 곳을 같이 고쳐야 한다. 지금은 둘뿐이라 영향이 작다.

**개선 방안**

세 번째가 생기면 공통 컴포넌트로 뺀다("세 번 규칙", Rule of Three). 지금은 추상화의 비용이 더 크다.

**After**

```ts
// 제안(나중): <ControlPopoverButton icon title ariaLabel>{content}</ControlPopoverButton>
```

**결과**: 제안하지 않음(세 번 규칙).

**배운 점**: 처음 한 번은 그냥 쓰고, 두 번째는 참고, 세 번째에 추상화한다. 너무 이른 추상화는 잘못된 추상화를 낳는다.

### D5. readZoneCache가 읽기와 삭제를 함께 한다

- **상태**: 제안 안 함
- **스멜**: Query와 Command가 섞임 (조회와 변경이 섞임)
- **대상**: `features/airspace/cache/airspaceCacheStore.ts`
- **패턴**: Separate Query from Modifier

**증상**

읽다가 손상·버전 불일치를 만나면 해당 항목을 지우고 `null`을 돌려준다.

**Before**

```ts
readZoneCache: 읽기 → (실패 시) 삭제 → null
```

**원인**

- 손상된 값이 계속 파싱 비용만 든다는 이유로 읽는 김에 정리했다.

**무엇이 위험한가**

"읽기"가 저장소를 바꾸는 부수효과를 가진다.

**개선 방안**

삭제를 별도 함수로 빼면 호출 쪽이 두 단계를 알아야 해 오히려 복잡해진다. IndexedDB 오류 처리 경로도 건드려야 해 가치가 낮다.

**After**

```ts
// 제안 없음
```

**결과**: 제안하지 않음(가치 대비 위험).

**배운 점**: 원칙(조회와 변경 분리)에도 예외가 있다. 호출 쪽 단순함이 더 중요하면 의도적으로 섞는다. 그 이유를 주석으로 남긴다.

## 셀프 체크리스트

코드를 쓰거나 리뷰할 때 던지는 질문이다.

- [ ] 이 값이나 규칙이 코드 다른 곳에도 적혀 있는가? (적혀 있다면 한쪽을 다른 쪽에서 파생시킬 수 있는가)
- [ ] 이 순서·타이밍·키 삽입 순서에 의미가 있는가? 그 의미가 구조로 드러나 있는가, 주석에만 있는가?
- [ ] 이 함수나 파일은 몇 가지 이유로 바뀌는가? 이유별로 나눌 수 있는가?
- [ ] 같은 조건이 여러 군데에서 반복되는가? (정책 객체로 묶을 수 있는가)
- [ ] 복사해서 한 줄만 바꾼 코드가 있는가? 두 번째 사본이 생겼는가?
- [ ] 이 코드를 테스트할 수 있는가? 안 된다면 부수효과가 최상단에 있는가?
- [ ] 고치기 전에 현재 동작을 고정하는 테스트가 있는가?
- [ ] 이 변경은 공개 인터페이스를 바꾸는가? 바꾼다면 별도 작업으로 분리해야 하는가?

## 용어집

- **Duplicated Code (중복 코드)**: 같은 구조나 같은 사실이 두 곳 이상에 있다. 한쪽만 고쳐지는 순간 어긋난다. 가장 흔하고 가장 먼저 찾는 스멜이다.
- **Long Function (긴 함수)**: 한 함수가 너무 길거나 여러 일을 한다. 읽는 범위가 커지고 고칠 때 의도치 않은 곳을 건드린다.
- **Divergent Change (변경 이유가 여럿)**: 한 모듈이 서로 무관한 여러 이유로 자주 바뀐다. 이유별로 모듈을 나눈다.
- **Primitive Obsession (원시값 집착)**: 도메인 개념을 문자열·숫자 같은 원시값으로만 표현한다. 검증이 흩어지고 오타를 컴파일러가 못 막는다.
- **Mysterious Name (헷갈리는 이름)**: 이름이 의도를 드러내지 못한다. 가장 싼 리팩터링이지만 널리 쓰인 뒤에는 비싸다.
- **Extract Function / Extract Hook**: 덩어리 코드에 이름을 붙여 함수(React에서는 커스텀 훅)로 뺀다. 의도가 이름으로 드러난다.
- **Decompose Conditional**: 복잡한 조건과 분기를 이름 있는 함수로 나눈다.
- **Replace Conditional with Lookup Table**: 같은 조건으로 값을 고르는 분기를 표(객체)로 바꾼다. 이 프로젝트에서는 `getCachePolicy`가 해당한다.
- **Single Source of Truth (단일 출처)**: 같은 사실은 한 곳에서만 정의하고 나머지는 거기서 파생한다.
- **Characterization Test (특성 테스트)**: 고치기 전에 "지금 어떻게 동작하는가"를 있는 그대로 고정하는 테스트. 맞는 동작인지가 아니라 달라지지 않음을 증명한다.
- **Rule of Three (세 번 규칙)**: 중복이 세 번째 나타날 때 추상화한다. 두 번째까지는 참고만 한다.
- **Zero Side-effect Refactoring**: 구조만 바꾸고 관찰 가능한 동작과 공개 인터페이스는 바꾸지 않는다. 새 파일 추가와 위임으로 호환을 지킨다.

## 이 작업의 결과 (2026-11-11)

- 적용: P1~P7 (P6은 (a)만). 보류 4개, 제안 안 함 5개.
- 테스트 238개 → 251개(+13: 특성 테스트와 신규 동작 테스트). `pnpm lint`, `npx tsc --noEmit`, `prettier --check`, `pnpm build` 통과.
- 공개 인터페이스: export 이름 목록을 전후로 비교해 제거·개명이 없음을 확인했다. 추가된 것은 `WMS_TILE_SIZE`(상수), `requestAirspaceFeatures`, `bootstrap`뿐이다.
- 코드 변경은 커밋하지 않았다(요청 시에만 커밋).
