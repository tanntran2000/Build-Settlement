#!/usr/bin/env bash
# Alternate main and B3 head: build, then run the one smoke case alone with CI=1; record its duration.
cd C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 || exit 9
[ -z "$(git status --porcelain)" ] || { echo "dirty"; exit 8; }
for round in 1 2; do
  for rev in b184357 feat/p7b-acquisition-market; do
    git checkout -q "$rev" && echo "== round $round rev $rev $(git rev-parse --short HEAD) $(date -u +%FT%TZ)"
    npm run build >/dev/null 2>&1; echo "build exit=$?"
    CI=1 npx playwright test tests/e2e/character-life-navigation.spec.ts:225 --reporter=line 2>&1 | grep -E "passed|failed|timed out"
  done
done
git checkout -q feat/p7b-acquisition-market; echo "final: $(git rev-parse --abbrev-ref HEAD) $(git rev-parse --short HEAD)"; git status --short
