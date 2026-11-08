# 스펙: 범례 패널 그룹별 on/off (#70)

## 배경/목적

#25의 범례 패널은 12종 개별 체크박스와 "전체 해제"만 제공해, 3색 그룹(불가/제한/가능)을 한 번에
켜고 끌 수 없다. 그룹 단위 컨트롤을 더해 조작 횟수를 줄인다.

## 입력

- **`setGroupZones(level, isVisible)`**: 스토어 액션. `level`은 `AIRSPACE_ZONE_CONFIGS`의 `level`.
- **`getGroupCheckState(typenames, visibility)`**: 순수 함수. 그룹 소속 typename과 현재 가시성에서
  `'all' | 'some' | 'none'`을 반환한다.
- **그룹 체크박스 클릭**: 패널의 각 그룹 헤더에 둔다.

## 기대 동작

- [ ] `setGroupZones(level, false)`는 해당 그룹 소속 typename만 모두 끈다. 다른 그룹은 그대로다.
- [ ] `setGroupZones(level, true)`는 해당 그룹 소속 typename만 모두 켠다.
- [ ] 키 집합은 바뀌지 않는다(새 키를 만들지 않는다).
- [ ] `getGroupCheckState`: 모두 켜짐 `'all'`, 모두 꺼짐 `'none'`, 섞임 `'some'`.
- [ ] 그룹 체크박스: `'all'`이면 체크, `'some'`이면 부분 선택(indeterminate), `'none'`이면 해제로 표시한다.
- [ ] 그룹 체크박스 클릭: `'all'`이면 그룹을 끄고, `'some'`/`'none'`이면 그룹을 켠다(antd 전체 선택 관례).
- [ ] 기존 개별 토글, "전체 해제/전체 선택", 지도 반영(`visibleZoneTypes`)은 동작이 그대로다.

## 엣지케이스

- [ ] 알 수 없는 `level`이면 상태를 바꾸지 않는다.
- [ ] 개별 토글로 그룹 안 일부만 꺼지면 그룹 체크박스가 부분 선택이 된다.
- [ ] 그룹 소속 typename 중 `visibility`에 없는 키가 있어도 오류 없이 꺼짐으로 취급한다.

## 범위 밖

- 멀티폴리곤 토글(#69, #28에 흡수), 상태 영속화, 색상/패턴 변경.

## 관련 이슈

#70, #25
