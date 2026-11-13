#!/usr/bin/env bash
cd C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 || exit 9
echo "UTC start: $(date -u +%FT%TZ)"
echo "HEAD: $(git rev-parse HEAD)  tree: $(git rev-parse HEAD^{tree})"
echo "status:"; git status --short; echo "(end status)"
run(){ echo; echo "===== $* ====="; local s=$(date +%s); "$@"; local rc=$?; echo "===== exit=$rc  seconds=$(( $(date +%s)-s )) : $* ====="; return 0; }
run git diff --check origin/main...HEAD
run npm run lint
run npm run typecheck
run npm run check:architecture
run npm run test:architecture
run npm test
run npm run build
echo "UTC end: $(date -u +%FT%TZ)"
