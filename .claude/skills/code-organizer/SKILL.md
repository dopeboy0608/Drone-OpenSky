---
name: code-organizer
description: Drone-OpenSky 프로젝트의 코드 정렬 규칙. import 구문 순서 + 컴포넌트 내부 훅/상태/이펙트 구조 정렬. "정렬해줘", "import 순서 정리", "코드 정렬", "훅 순서 정리" 등의 요청이나 `/code-organizer` 명시적 호출 시 트리거된다.
---

# Code Organizer

## 핵심 원칙

> **코드 내용(로직)은 절대 변경하지 않는다. 코드의 작성 위치(순서)만 변경한다.**
>
> - named import 내부 순서 변경 금지
> - 함수/변수 내부 구현 변경 금지
> - 그룹 경계가 모호한 경우 이동하지 않고 사용자에게 제안만 한다
> - **정렬 관련 블록 주석을 새로 추가하지 않는다. 사용자가 작성한 주석만 유지한다.**

---

## Part 1. Import 구문 정렬

### 정렬 순서

```
1. React / 외부 라이브러리 (react, axios, dayjs, react-kakao-maps-sdk, antd 등 node_modules 패키지)
   (빈 줄)
2. 전역 Providers / Store / Router / Query 훅
   (@tanstack/react-router, @/store/*, @/api/*)
   내부 순서: 라우터 → 전역 store → 전역 api 클라이언트/훅
   (빈 줄)
3. Feature 내부 모듈 (같은 도메인 또는 다른 도메인의 features/*)
   (@/features/*/components/*, @/features/*/hooks/*, @/features/*/queries/*, @/features/*/store/*)
   내부 순서: components → hooks → queries → store
   상대경로(../hooks/*, ../components/* 등)도 동일하게 이 그룹에 배치
   (빈 줄)
4. 공용 컴포넌트
   (@/components/*)
   (빈 줄)
5. 상수 / 타입 / 에셋
   내부 순서:
   a. 상수 (@/constants/*, @/features/*/constants)
   b. 타입 (@/types/*, @/features/*/types, import type)
   c. SVG·이미지 등 에셋 (@/assets/*)
```

### 주의사항

- `import type`은 그룹 5-b(타입)에 배치 (해당 그룹 내 일반 import 뒤)
- SVG·이미지 등 에셋은 항상 마지막
- 같은 feature 내부에서 상대경로로 import할 때도 그룹 3의 내부 순서(components → hooks → queries → store)를 따른다
- **named import 내부 순서는 변경하지 않는다**

### 예시

```typescript
import { useState } from 'react';
import axios from 'axios';

import { useAppStore } from '@/store/appStore';
import { apiClient } from '@/api/apiClient';

import { MapView } from '@/features/map/components/MapView';
import { useCurrentCenter } from '@/features/map/hooks/useCurrentCenter';
import { useAirspacePolygons } from '@/features/airspace/queries/useAirspacePolygons';

import { AppButton } from '@/components/AppButton';

import { DEFAULT_ZOOM_LEVEL } from '@/features/map/constants';
import type { MapCenter } from '@/features/map/types';
import mapPinIcon from '@/assets/icons/icon-map-pin.svg';
```

---

## Part 2. 컴포넌트 내부 구조 정렬

컴포넌트/커스텀 훅 내부에서 훅·상태·이펙트의 **선언 위치**를 아래 순서로 정렬한다.

### 전체 블록 순서

```
1a. Router / Store / Context      — 외부 환경 (라우터, 전역 상태, 컨텍스트)
1b. Providers / Hooks / Queries   — providers, 서버 데이터, 유틸 훅
2.  State (useState)              — 컴포넌트 로컬 상태
3.  Ref (useRef)                  — 렌더 비트리거 값 / DOM 참조
4.  공유 파생값·메모 함수·핸들러   — useMemo → useCallback → 일반 함수 (여러 effect/훅에서 참조)
5.  useLayoutEffect               — DOM 동기 측정/업데이트 (effect보다 먼저 실행)
6.  useEffect                     — 비동기 부수효과
    └─ 단일 effect 전용 핸들러/useMemo/useCallback은 해당 effect 바로 위 인접
```

> 각 블록 사이에는 **빈 줄 1줄**을 삽입한다.
> 1a와 1b는 빈 줄 없이 연속 배치한다 (같은 계층, 성격만 구분).
>
> 폼 상태(`useForm` 등)를 쓰는 컴포넌트가 생기면, State 블록 앞에 Form 블록을 추가하는 방식으로 이 규칙을 확장한다(현재 범위에는 폼이 없어 생략).

### 순서 근거

| 블록                            | 왜 이 위치인가                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Router / Store / Context        | 컴포넌트 외부에서 주입되는 환경값. 가장 먼저 선언해야 아래 블록들이 참조 가능  |
| Providers / Hooks / Queries     | providers·유틸 훅·서버 데이터. 외부 환경 다음, 로컬 상태 선언 전에 위치        |
| useState                        | 컴포넌트가 소유하는 로컬 상태. ref보다 먼저 — 렌더를 트리거하는 값이 중심      |
| useRef                          | 렌더를 트리거하지 않는 "조용한 상태". state와 같은 레이어지만 성격이 달라 분리 |
| 공유 useMemo·useCallback·핸들러 | effect가 deps로 참조하기 전에 선언되어야 함. "값 계산 → 부수효과" 흐름         |
| useLayoutEffect                 | 브라우저 paint 전 동기 실행. useEffect보다 먼저 실행되므로 앞에 배치           |
| useEffect                       | 렌더 후 비동기 부수효과. 생명주기 순(mount → 단일 deps → 복합 deps)            |

---

### 블록 내부 개행 규칙

블록 사이 개행(1줄)과 별개로, **블록 내부에서도 아래 조건에 해당하면 개행으로 분리**한다.

| 조건                              | 예시                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| **다른 대상을 제어하는 ref 세트** | 지도 컨테이너 ref → 빈 줄 → 별도 오버레이 ref                |
| **멀티라인 구조분해 훅**          | 멀티라인으로 여러 값을 구조분해하는 훅은 훅마다 빈 줄로 분리 |
| **성격이 다른 단순 훅 묶음**      | 단일라인 훅은 같은 성격끼리 묶고, 성격이 바뀌면 빈 줄        |
| **맥락이 다른 state 그룹**        | 지도 중심좌표 state 묶음 → 빈 줄 → 모달 제어 state 묶음      |

---

### 블록 1a. Router / Store / Context

라우터, 전역 스토어, Context 구독을 묶는다.
전역 선언 → 모듈 단위 선언 순.

```typescript
const router = useRouter();
const appStore = useAppStore();
const theme = useContext(ThemeContext);
```

### 블록 1b. Providers / Hooks / Queries

providers, 유틸 훅, 서버 데이터 훅(query)을 묶는다.
1a와 빈 줄 없이 연속 배치한다.
내부 순서: providers → 유틸 훅 → queries

```typescript
const [loading, error] = useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_API_KEY });
const center = useCurrentCenter();

const { data: polygons } = useAirspacePolygons();
```

---

### 블록 2. State

맥락별로 연관된 state끼리 인접하게 배치한다.

**state 초기값 const**는 해당 state 바로 위에 인접 배치한다.

**그룹화 기준 (우선순위 순)**

1. 개발자가 작성한 주석이 있으면 그 경계를 우선 적용
2. 주석이 없으면 AI가 코드 맥락(네이밍, 함께 쓰이는 handler/effect)을 읽고 의미적으로 판단
3. 그룹 경계가 모호하면 이동 대신 사용자에게 제안만 한다

```typescript
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const [center, setCenter] = useState(DEFAULT_CENTER);

const [isLegendOpen, setIsLegendOpen] = useState(false); // ← 맥락이 달라 빈 줄로 분리
```

---

### 블록 3. Ref

`useRef`는 렌더를 트리거하지 않는 값이다. 용도와 무관하게 한 블록으로 묶는다.
`ref.current` 구조분해 파생값은 해당 ref 바로 아래에 인접 배치한다.
같은 대상을 제어하는 ref 세트끼리 묶고, 다른 대상이면 빈 줄로 분리한다.

- DOM 참조 (`mapContainerRef`)
- mutable flag (`isFirstFetchRef`)
- 함수 ref (`handleResizeRef`)

---

### 예외 규칙. 블록 간 의존이 발생하는 경우

**기본 규칙**: 선언 종류에 따라 정해진 블록에 배치한다.
**예외 규칙**: 다른 블록의 값을 **참조하거나 인자로 전달해야 하는 경우**, 의존하는 블록 중 가장 마지막 블록 직후에 배치한다.

이 예외 규칙은 선언 종류를 가리지 않고 동일하게 적용된다.

```typescript
const mapContainerRef = useRef<HTMLDivElement>(null);

// state + ref 둘 다 참조 → 마지막 의존 블록(Ref) 직후
const { isMapReady } = useMapReadyCheck({
  containerRef: mapContainerRef,
  center,
});
```

**적용 예시 (종류별)**

| 케이스                                                | 기본 블록 | 예외 배치 위치                      |
| ----------------------------------------------------- | --------- | ----------------------------------- |
| hook이 state·ref를 인자로 받음                        | 블록 1b   | 마지막 의존 블록 직후               |
| ref.current 구조분해 파생값                           | —         | ref 블록 내 해당 ref 바로 아래 인접 |
| state 초기값 const                                    | —         | 해당 useState 바로 위 인접          |
| 블록 1b 내부에서 hook A 반환값을 hook B가 인자로 받음 | 블록 1b   | 블록 1b 내부에서 A → B 순서 유지    |

---

### 블록 4. 공유 파생값·메모 함수·핸들러

**여러 useEffect/커스텀 effect 훅에서 참조되는** 값·함수를 effect 블록 전체 상단에 배치한다.

- 순서: `useMemo` → `useCallback` → 일반 핸들러 함수
- 단일 effect에서만 참조되는 경우는 이 블록이 아니라 해당 effect 바로 위에 배치 (블록 6 참고)

```typescript
const visiblePolygons = useMemo(() => polygons.filter((p) => p.isVisible), [polygons]);
const handleLegendToggle = useCallback(() => setIsLegendOpen((prev) => !prev), []);
```

---

### 블록 5. useLayoutEffect

DOM 측정·동기 업데이트가 필요한 경우. 브라우저 paint 전 동기 실행되므로 useEffect 앞에 배치한다.
정렬 순서는 useEffect와 동일한 생명주기 순 (`[]` → 단일 deps → 복합 deps).

---

### 블록 6. useEffect (+ 전용 핸들러/memo/callback 인접 배치)

**정렬 순서: 생명주기 순**

1. `[]` — mount only (초기화)
2. 단일 deps — 특정 state 하나에 반응
3. 복합 deps — 여러 state에 반응

**단일 effect 전용 핸들러/useMemo/useCallback** 은 해당 effect 바로 위에 인접 배치한다.

- 여러 effect에서 공유되는 경우 → 블록 4로 이동
- 단일 참조인 경우만 해당 effect 바로 위에 붙인다

```typescript
// mount
useEffect(() => {
  init();
}, []);

// 단일 deps — handleCenterChange는 이 effect에서만 참조
const handleCenterChange = () => { ... };
useEffect(() => {
  handleCenterChange();
}, [center]);
```

---

### 전체 구조 예시

```typescript
export const MapView = () => {
  const [loading, error] = useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_API_KEY });
  const center = useCurrentCenter();

  const { data: polygons } = useAirspacePolygons();

  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const visiblePolygons = useMemo(() => polygons?.filter((p) => p.isVisible) ?? [], [polygons]);
  const handleLegendToggle = () => setIsLegendOpen((prev) => !prev);

  useEffect(() => {
    init();
  }, []);

  // ... render
};
```

---

## 체크리스트 (정렬 전 확인)

- [ ] 코드 내용(로직) 변경 없이 위치만 이동하는가?
- [ ] named import 내부 순서를 건드리지 않았는가?
- [ ] 정렬 관련 블록 주석을 새로 추가하지 않았는가?
- [ ] Router/Store/Context(1a)와 Providers/Hooks/Queries(1b)가 올바르게 구분되었는가?
- [ ] state 초기값 const가 해당 useState 바로 위에 인접 배치되었는가?
- [ ] ref.current 구조분해가 해당 ref 바로 아래 인접 배치되었는가?
- [ ] 같은 대상의 ref 세트끼리 묶고, 다른 대상과 빈 줄로 분리했는가?
- [ ] 멀티라인 구조분해 훅은 훅마다 빈 줄로 분리했는가?
- [ ] 블록 간 의존이 있는 경우 예외 규칙(마지막 의존 블록 직후)이 적용되었는가?
- [ ] 그룹 경계가 모호한 state는 이동 대신 사용자에게 제안했는가?
- [ ] 공유 핸들러/memo/callback과 단일 전용을 올바르게 구분했는가?
- [ ] useLayoutEffect가 useEffect 앞에 배치되었는가?
- [ ] 각 블록 사이 빈 줄 1줄이 삽입되었는가? (1a↔1b 제외)
