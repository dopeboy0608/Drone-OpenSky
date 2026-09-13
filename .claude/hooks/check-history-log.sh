#!/bin/bash
# Stop 이벤트 훅: 코드가 변경됐는데 오늘자 docs/history/YYYY-MM-DD.md가 갱신되지 않았으면 알림.
# docs/history/는 .gitignore 처리되어 커밋 훅으로는 감지할 수 없어 mtime 비교로 대신한다.
set -uo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$repo_root" || exit 0

today="$(date +%Y-%m-%d)"
hist_file="docs/history/${today}.md"

changed_files="$(git status --porcelain 2>/dev/null | sed -E 's/^...//' | grep -v '^docs/history/')"
if [ -z "$changed_files" ]; then
  exit 0
fi

mtime_of() {
  stat -f "%m" "$1" 2>/dev/null || stat -c "%Y" "$1" 2>/dev/null
}

latest_change_mtime=0
while IFS= read -r f; do
  [ -e "$f" ] || continue
  m="$(mtime_of "$f")"
  [ -n "$m" ] || continue
  if [ "$m" -gt "$latest_change_mtime" ]; then
    latest_change_mtime="$m"
  fi
done <<< "$changed_files"

if [ -f "$hist_file" ]; then
  hist_mtime="$(mtime_of "$hist_file")"
else
  hist_mtime=0
fi

if [ "$hist_mtime" -lt "$latest_change_mtime" ]; then
  echo '{"systemMessage": "⚠️ 코드가 변경됐는데 오늘자 작업 히스토리(docs/history/'"${today}"'.md)가 아직 갱신되지 않았습니다. 이번 작업 단위가 끝났다면 CLAUDE.md 규칙에 따라 기록을 남겨주세요."}'
fi
