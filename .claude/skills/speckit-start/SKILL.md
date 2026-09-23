---
name: speckit-start
description: spec-kit 경로로 정해진 이슈를 specify→(clarify)→plan→tasks→implement 순서로, 단계마다 사용자 확인을 받으며 진행하는 오케스트레이션 스킬. 보통 `issue-start`가 B 경로를 선택했을 때 호출하지만, spec-kit으로 바로 시작하고 싶을 때 직접 호출해도 된다.
argument-hint: 이슈 번호와 핵심 내용 (예: "이슈 #24: 지도 표시 고도화 — ...")
---

# speckit-start

spec-kit 5단계(`/speckit-specify`, `/speckit-clarify`, `/speckit-plan`, `/speckit-tasks`,
`/speckit-implement`)를 한 번에 쭉 밀어붙이지 않고, 각 단계 결과를 보여준 뒤 다음 단계로
넘어가기 전 사용자 확인을 받는다. #31, #24에서 실제로 이 패턴으로 진행했고 잘 맞았다.

## 사전 조건

- `.specify/`가 이 레포에 초기화돼 있어야 한다(스킵 없이 바로 실패하면 사용자에게 `specify init --here --integration claude` 안내).
- 브랜치/`in-progress` 라벨이 아직 없다면(주로 `issue-start`를 거치지 않고 이 스킬을 바로 호출한 경우) 먼저 CLAUDE.md "GitHub 이슈 관리" 컨벤션대로 만든다. `issue-start`를 거쳐 왔다면 이미 돼 있으니 다시 만들지 않는다.

## 절차

1. **Specify**: `Skill(skill: "speckit-specify", args: <이슈 번호와 내용>)`. 결과(spec 디렉터리, 체크리스트 통과 여부)를 짧게 보고한다.
   - 체크리스트에 `[NEEDS CLARIFICATION]`이 남아 있으면 `speckit-specify` 자체가 질문을 던지므로 그 답을 받아 반영한다.
   - 스펙 내용 중 판단이 필요한 부분(그룹 분류, 스코프 축소 등)은 스펙을 쓰는 도중이라도 사용자에게 먼저 확인한다 — #24처럼 spec.md 자체를 여러 라운드에 걸쳐 다듬어도 된다.
   - 완료 후: "계속 `/speckit-plan`으로 진행할까요?" 확인받는다.
2. **Plan**: 확인받으면 `Skill(skill: "speckit-plan")`. `plan.md`/`research.md`/`data-model.md`(필요시)/`quickstart.md`를 생성한다. Technical Context의 "Testing" 항목에서 이 기능 중 TDD 대상(ARCHITECTURE.md "TDD 적용 기준")과 수동 검증 대상을 명확히 구분해 적는다.
   - 완료 후: "계속 `/speckit-tasks`로 진행할까요?" 확인받는다.
3. **Tasks**: 확인받으면 `Skill(skill: "speckit-tasks")`. 태스크 개수, User Story별 분류, MVP 범위를 짧게 보고한다.
   - 완료 후: "계속 `/speckit-implement`로 진행할까요?" 확인받는다.
4. **Implement**: 확인받으면 `Skill(skill: "speckit-implement")`.
   - TDD 대상 함수는 실패하는 테스트 먼저 작성(red) → 구현(green) 순서를 지킨다.
   - 구현 후 `pnpm format` → `pnpm lint` → `pnpm test` → `pnpm build`를 실행해 통과를 확인한다.
   - 브라우저/실기기 확인이 필요한 태스크(Kakao 지도 렌더링, 클릭 인터랙션 등)는 이 세션에 브라우저 도구가 없다면 체크하지 않고 quickstart.md 절차를 사용자에게 안내한다 — 확인 없이 완료로 보고하지 않는다.
5. **완료 보고**: 변경 파일 요약, 자동 검증 결과, 남은 수동 검증 항목을 정리해 보고한다. **커밋/PR/머지는 자동으로 하지 않는다** — CLAUDE.md 규칙대로 사용자가 명시적으로 요청할 때만 진행한다.

## 하지 않는 것

- 사용자 확인 없이 다음 단계로 넘어가지 않는다(1~4단계 사이 매번 확인).
- 커밋을 스스로 트리거하지 않는다.
- `/speckit-clarify`, `/speckit-checklist`, `/speckit-analyze` 같은 선택적 스킬은 필요하다고 판단될 때만 제안하고, 기본 흐름에 강제로 끼워넣지 않는다.
