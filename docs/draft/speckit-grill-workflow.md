# Spec Kit + grill-me 통합 워크플로 (개인 프로젝트용)

> 작성일 2026-09-15 · 검증 대상 초안
> **확정안이 아님.** 집 프로젝트에서 이 문서를 근거로 교차검증하고 고도화하기 위한 출발점.
> 8절의 검증 체크리스트와 9절의 "반박해볼 결정들"을 반드시 같이 볼 것.

---

## 1. 검증된 사실 (specify 1.0.7.dev0 기준)

아래는 추측이 아니라 실제 설치·실행으로 확인한 내용. **버전에 따라 다르므로 집에서 먼저 재확인할 것.**

### 설치

```bash
brew install uv
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
uv tool update-shell        # ~/.local/bin 을 PATH에 등록
```

### 초기화

```bash
specify init <프로젝트명> --integration claude   # 새 디렉터리
specify init . --integration claude             # 현재 디렉터리
```

> ⚠️ 구버전 문서에 나오는 `--ai claude` 플래그는 **이 버전에 없다.** `--integration` 이다.

### 생성되는 구조

```
.claude/skills/speckit-*/     # 슬래시 커맨드 (skills 형태로 설치됨)
.specify/
  memory/constitution.md      # 프로젝트 원칙
  templates/                  # spec / plan / tasks / checklist 템플릿
  scripts/bash/               # check-prerequisites.sh 등
  workflows/                  # 번들 워크플로 (speckit: 전체 SDD 사이클)
  integrations/
```

### 사용 가능한 커맨드

슬래시 이름은 **하이픈**이다 (`/speckit.specify` 아님).

| 커맨드 | 역할 |
|---|---|
| `/speckit-constitution` | 프로젝트 원칙 수립 (1회) |
| `/speckit-specify` | 요구사항 → 스펙 |
| `/speckit-clarify` | (선택) 모호한 부분 구조적 질문 — **plan 전에** |
| `/speckit-plan` | 기술 설계 |
| `/speckit-checklist` | (선택) 요구사항 완성도 체크리스트 — plan 후 |
| `/speckit-tasks` | 의존성 순서 태스크 분해 |
| `/speckit-analyze` | (선택) 산출물 간 정합성 검사 — tasks 후, implement 전 |
| `/speckit-taskstoissues` | **tasks.md → GitHub Issues 변환** |
| `/speckit-implement` | 구현 실행 |
| `/speckit-converge` | 기존 코드베이스 평가 → 남은 작업을 태스크로 추가 |

### 확장·훅 시스템

`.specify/extensions.yml` 에 훅을 등록하면 각 커맨드 전후로 다른 커맨드를 자동 실행할 수 있다.

- 키 형태: `hooks.before_<command>` / `hooks.after_<command>`
  (확인된 실례: `hooks.before_taskstoissues`, `hooks.after_taskstoissues`)
- `optional: false` 면 자동 실행, `true` 면 안내만
- 번들 확장: `git`, `selftest` — `specify extension add <name>`

**→ 기존 하네스 테스트 워크플로를 물리는 지점이 여기다.** (6절)

---

## 2. 레이어 모델 — 누가 무엇을 담당하나

핵심은 **speckit이 grill-me를 대체하지 않는다**는 것. 담당 구간이 다르다.

| 레이어 | 도구 | 담당 | 산출물 |
|---|---|---|---|
| L0 | 메모장 | 백로그 inbox. 러프한 아이디어 적재 | 메모 |
| L1 | **grill-me** | 선별 + 문제 정의. "이거 진짜 필요한가 / 뭐가 진짜 문제인가" | 대화 (휘발) |
| L2 | **speckit** | 명세 + 설계 + 분해. "어떻게 / 무슨 순서로" | `specs/NNN-*/` |
| L3 | **GitHub Issues** | 실행 원장. 무엇이 남았나 | 이슈 |
| L4 | **하네스** | 구현 + 테스트 실행 | 코드, 테스트 결과 |

**grill-me는 speckit 앞에 둔다.** 러프한 메모를 `/speckit-specify` 에 바로 넣으면 *길지만 얕은* 스펙이 나온다. 분량에 속기 쉽다. grill로 한 번 조지고 나면 입력 품질이 올라가 결과가 확연히 달라진다.

---

## 3. 표준 플로우 (L 사이즈 기능)

```
메모장 항목
   │
   ▼
[L1] grill-me
   │   · 이 기능이 해결하는 실제 문제는?
   │   · 안 만들면 무슨 일이 생기나? (없으면 폐기)
   │   · 성공을 어떻게 측정하나?
   │   · 가장 작은 첫 버전은?
   ▼
   문제정의 3~5줄  ──────────┐
                            │  (grill 결과를 그대로 입력으로)
   ▼                        ▼
[L2] /speckit-specify  ← ───┘
   ▼
   /speckit-clarify        ← 모호점 해소 (권장)
   ▼
   /speckit-plan
   ▼
   /speckit-checklist      ← (선택) 요구사항 누락 점검
   ▼
   /speckit-tasks          → tasks.md (T001, T002... 의존성 순)
   ▼
   /speckit-analyze        ← (선택) spec/plan/tasks 정합성
   ▼
[L3] /speckit-taskstoissues → GitHub Issues 생성
   ▼
[L4] 하네스로 이슈 하나씩 구현 + 테스트
```

### 게이트 (다음 단계로 넘어가는 조건)

| 게이트 | 통과 조건 |
|---|---|
| grill → specify | 문제 정의 한 문단으로 쓸 수 있음. 못 쓰면 아직 grill 단계 |
| specify → plan | `[NEEDS CLARIFICATION]` 마커가 0개 |
| plan → tasks | 기술 선택에 "나중에 정함"이 없음 |
| tasks → issues | 태스크 하나가 한 세션에 끝나는 크기 |
| issues → 구현 | 이슈 본문만 읽고 착수 가능 (스펙 안 열어봐도 됨) |

---

## 4. 크기별 라우팅 — 과잉 의식 방지

**전부 speckit에 태우면 망한다.** 기능마다 브랜치 + `specs/NNN-*/` 폴더가 생긴다. 메모 20개를 다 넣으면 브랜치 20개다.

| 크기 | 기준 | 경로 |
|---|---|---|
| **S** | 30분 이내, 파일 1~2개, 판단 불필요 | 메모 → 이슈 직접 생성 → 구현. grill·speckit 전부 생략 |
| **M** | 한 세션, 설계 판단 약간 | grill → 이슈 → 구현. speckit 생략 |
| **L** | 여러 세션, 여러 파일, 설계 판단 필요 | 3절 전체 플로우 |

의심스러우면 **한 단계 낮게** 잡는다. 모자라면 올리면 되지만, 과한 의식은 되돌리기 어렵고 의욕을 깎는다.

---

## 5. GitHub Issue 연결

### `/speckit-taskstoissues` 실제 동작

확인된 사양:

- `tasks.md` 의 **태스크 1개 = 이슈 1개**
- 제목 형식 고정: `T001: <설명>` (`- [ ]`, `[P]`, `[US#]` 마커는 제거됨)
- 기존 이슈 제목에서 `T\d{3,}` 패턴을 스캔해 **중복 생성 방지** (재실행 안전)
- 열린/닫힌 이슈 모두 검사
- `git config --get remote.origin.url` 이 **GitHub URL이 아니면 중단**

### 전제조건 ⚠️

이 커맨드는 **GitHub MCP 서버의 `list_issues` 등을 사용한다.** `gh` CLI가 아니다.
집 환경에 GitHub MCP가 연결돼 있지 않으면 동작하지 않는다. **가장 먼저 확인할 것.**

MCP를 안 붙일 거면 대안:

```bash
# tasks.md → gh CLI 수동 브리지 (fallback)
grep -oE 'T[0-9]{3,} .*' specs/001-*/tasks.md | while read -r line; do
  id="${line%% *}"; desc="${line#* }"
  gh issue list --search "$id in:title" --state all --json number | grep -q '\[\]' \
    && gh issue create --title "$id: $desc" --label "spec:001" --body "spec: specs/001-*/spec.md"
done
```

### 이슈 폭증 주의

태스크 30개면 이슈 30개다. 개인 프로젝트에선 소음이 된다. 완화책:

- `/speckit-tasks` 결과를 **먼저 사람이 읽고 합칠 것은 합친 뒤** taskstoissues 실행
- 기능 단위 라벨(`spec:001`)을 붙여 필터 가능하게
- 또는 taskstoissues를 쓰지 않고, **기능당 이슈 1개 + 본문에 체크리스트**로 운영 (9절 대안 B)

---

## 6. 하네스 연결 지점

기존 테스트/구현 워크플로를 speckit에 물리는 방법 두 가지.

### (A) 훅으로 자동 연결

`.specify/extensions.yml`:

```yaml
hooks:
  after_taskstoissues:
    - extension: local
      command: my.harness.sync      # → /my-harness-sync 로 호출됨 (점→하이픈 변환)
      description: 생성된 이슈를 하네스 큐에 등록
      optional: false               # false면 자동 실행, true면 안내만
```

> 훅 이름은 `before_<command>` / `after_<command>` 패턴.
> **확인된 실례는 `taskstoissues` 뿐이므로, 다른 커맨드의 훅 지원 여부는 해당 `SKILL.md` 를 직접 grep해서 확인할 것.**
> `grep -rl 'extensions.yml' .claude/skills/`

### (B) 느슨하게 분리 (권장 출발점)

speckit은 **이슈 생성까지만** 하고 손 뗀다. 그 뒤는 기존 하네스가 GitHub Issue를 입력으로 받아 독립적으로 돈다.

- 장점: 둘 중 하나가 바뀌어도 다른 쪽이 안 깨짐. 디버깅 쉬움
- 단점: 수동 트리거 한 번
- **먼저 B로 2~3개 기능 돌려보고, 반복되는 수동 단계가 명확해지면 그때 A로 승격**

### `/speckit-implement` 를 쓸 것인가

기존 하네스가 이미 테스트 워크플로를 갖고 있다면 **`/speckit-implement` 는 쓰지 않는 쪽을 권한다.** 구현 주체가 둘이 되면 테스트 규약이 갈린다. speckit은 L2(설계·분해)에서 끊는 게 깔끔하다.

---

## 7. 단일 진실 공급원 규칙

레이어가 5개라 같은 정보가 여러 곳에 생긴다. 충돌 시 우선순위를 미리 정해둔다.

1. **무엇을 왜 만드나** → `specs/NNN-*/spec.md` 가 정본
2. **어떻게 만드나** → `specs/NNN-*/plan.md` 가 정본
3. **무엇이 남았나** → **GitHub Issues 가 정본** (`tasks.md` 아님)
4. **프로젝트 원칙** → `.specify/memory/constitution.md` 가 정본

> `tasks.md` 는 이슈를 만들고 나면 **스냅샷**이 된다. 진행 상태는 이슈에서만 관리하고 `tasks.md` 체크박스는 갱신하지 않는다. 두 곳을 다 관리하려 들면 반드시 어긋난다.

메모장은 L0 inbox 전용. **항목이 스펙이 되는 순간 메모에서 지운다.**

---

## 8. 집에서 할 교차검증 체크리스트

### 8.1 사전 확인 (10분)

- [ ] `specify check` → Claude Code `available` 인가
- [ ] **GitHub MCP 서버가 연결돼 있는가** (`/speckit-taskstoissues` 전제조건)
- [ ] `git remote -v` 가 GitHub URL인가
- [ ] 기존 하네스 커맨드가 `.claude/` 에 있는데, `specify init --here` 가 덮어쓰지 않는가
      → **반드시 커밋된 상태에서 실행하고 `git status` 로 확인**

### 8.2 파일럿 (기능 2개)

1. `/speckit-constitution` 1회 — 테스트 규약, 기술 제약, 코드 스타일 명시
2. 메모에서 **L 사이즈 1개** 골라 3절 전체 플로우 완주
3. 메모에서 **M 사이즈 1개** 골라 grill만 거쳐 이슈 직행
4. 둘의 **실제 소요 시간과 결과 품질을 비교**

### 8.3 판정 질문

각각에 예/아니오로 답할 것.

- 생성된 `spec.md` 가 grill-me 대화보다 **더 나은 결정**을 내리게 했나? (분량이 아니라 결정)
- `tasks.md` 의 태스크가 **그대로 이슈로 쓸 만한 크기**였나?
- 이슈 본문만 보고 착수 가능했나, 아니면 `spec.md` 를 매번 열었나?
- `plan.md` 를 **구현 중에 실제로 다시 읽었나?** 안 읽었다면 plan 단계는 낭비다
- 전체 의식(ceremony) 시간이 절약된 시간보다 적었나?

### 8.4 실패 신호 — 보이면 축소하라

- 스펙 쓰는 시간이 구현 시간보다 길다
- `tasks.md` 와 이슈 상태가 어긋나기 시작한다 (7절 규칙 위반)
- 이슈가 너무 잘아서 하나씩 닫는 게 귀찮다 → 태스크 합치기
- 생성된 스펙에 "TBD", "추후 결정"이 남아 있다 → `/speckit-clarify` 를 건너뛴 것
- `specs/` 폴더는 쌓이는데 구현은 안 된다 → **가장 위험한 신호. 즉시 S/M 경로로 회귀**

---

## 9. 반박해볼 결정들

이 문서가 임의로 정한 것들. 집에서 grill-me로 이 문서 자체를 심문할 때 쓸 목록.

| # | 내린 결정 | 근거 | 대안 |
|---|---|---|---|
| A | grill-me 를 specify **앞**에 배치 | 입력 품질이 스펙 품질을 지배 | `/speckit-clarify` 가 그 역할을 충분히 하면 grill 생략 가능 |
| B | 태스크 1개 = 이슈 1개 (도구 기본값) | `taskstoissues` 기본 동작 | **기능당 이슈 1개 + 본문 체크리스트.** 개인 프로젝트엔 이쪽이 나을 수 있음 |
| C | `/speckit-implement` 미사용 | 하네스와 구현 주체 이원화 방지 | 하네스를 speckit 훅으로 흡수하고 implement 사용 |
| D | GitHub Issues 가 진행상태 정본 | 기존 플로우 유지 | `tasks.md` 정본 + 이슈는 미러 |
| E | S/M/L 3단 라우팅 | 과잉 의식 방지 | 전부 speckit 통일 (일관성 ↑, 오버헤드 ↑) |
| F | 훅(A) 대신 느슨한 분리(B)로 시작 | 초기 디버깅 용이 | 처음부터 훅으로 완전 자동화 |

**특히 B를 먼저 검증할 것.** 개인 프로젝트에서 이슈 30개는 관리 대상이 아니라 소음이 되기 쉽다.

---

## 10. 집에서 첫 세션 실행 순서

```bash
# 1. 프로젝트 준비 (기존 레포면 반드시 커밋 후)
cd ~/projects/<내프로젝트>
git status                                  # clean 확인

# 2. spec-kit 설치
specify init . --integration claude
git status                                  # 덮어쓴 파일 없는지 확인
git add .specify .claude && git commit -m "chore: add spec-kit scaffolding"
```

그 다음 Claude Code 안에서:

```
/speckit-constitution        # 1회. 테스트 규약·기술 제약 명시
```

이어서 이 문서를 근거로 교차검증:

```
이 문서(~/Documents/speckit-grill-workflow.md)를 읽고,
9절의 결정 A~F를 grill-me로 하나씩 심문해줘.
내 프로젝트 구조와 기존 하네스 워크플로를 근거로,
동의/반대와 그 이유를 대라.
```

---

## 부록: 한 장 요약

```
메모장 ──grill-me──> 문제정의 ──specify/clarify/plan/tasks──> tasks.md
                                                                 │
                                          taskstoissues          ▼
                                                          GitHub Issues
                                                                 │
                                                            하네스 구현/테스트

S: 메모 → 이슈 → 구현
M: 메모 → grill → 이슈 → 구현
L: 위 전체
```
