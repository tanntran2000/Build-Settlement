#!/usr/bin/env bash
set -u
cd /c/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 || exit 1
evidence=/c/Users/Admin/.t3/local-drafts/p6a-prB/fix1
head=$(git rev-parse HEAD)
tree=$(git rev-parse 'HEAD^{tree}')
test -z "$(git status --porcelain=v1)" || exit 1
test "$(git rev-parse origin/main)" = 5e9674e31fb017f730dced4178514ebbfe1dbf24 || exit 1
run_gate() {
  local name="$1" command="$2" utc code started elapsed
  utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  started=$SECONDS
  printf 'Starting %s at %s\n' "$name" "$utc"
  test "$(git rev-parse HEAD)" = "$head" || exit 1
  test "$(git rev-parse 'HEAD^{tree}')" = "$tree" || exit 1
  test -z "$(git status --porcelain=v1)" || exit 1
  eval "$command" > "$evidence/$name.raw.txt" 2>&1
  code=$?
  elapsed=$((SECONDS-started))
  {
    printf 'HEAD=%s\nTREE=%s\nUTC=%s\nEXIT=%s\nELAPSED_SECONDS=%s\nCOMMAND=%s\n\n' "$head" "$tree" "$utc" "$code" "$elapsed" "$command"
    cat "$evidence/$name.raw.txt"
  } > "$evidence/$name.txt"
  tail -n 20 "$evidence/$name.txt"
  if test "$code" -ne 0; then
    printf 'HOLD: %s exited %s. No later runner was started.\n' "$name" "$code"
    exit "$code"
  fi
}
run_gate gate-0-ports 'powershell.exe -NoProfile -File C:/Users/Admin/.t3/local-drafts/p6a-prB/fix1/check-ports.ps1'
run_gate gate-1-diff 'git diff --check origin/main...HEAD'
run_gate gate-2-lint 'npm run lint'
run_gate gate-3-typecheck 'npm run typecheck'
run_gate gate-4-check-architecture 'npm run check:architecture'
run_gate gate-5-test-architecture 'npm run test:architecture'
run_gate gate-6-unit 'npm test'
run_gate gate-7-build 'npm run build'
run_gate smoke-ports 'powershell.exe -NoProfile -File C:/Users/Admin/.t3/local-drafts/p6a-prB/fix1/check-ports.ps1'
export CI=1
run_gate smoke $'echo "CI=$CI"\nCI=1 npm run test:smoke'
run_gate final-ports 'powershell.exe -NoProfile -File C:/Users/Admin/.t3/local-drafts/p6a-prB/fix1/check-ports.ps1'
run_gate bundle-final 'node C:/Users/Admin/.t3/local-drafts/p6a-prB/fix1/measure-bundle.mjs --capture'
printf 'PASS: seven gates, CI=1 smoke, free final ports and bundle measurement at %s.\n' "$head"
