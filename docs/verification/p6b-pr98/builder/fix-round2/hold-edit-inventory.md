# PR C round-2 edit inventory — HOLD

Parent/HEAD: ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37; committed tree: a164cb535cb914ee19f6e027b97013479c08e786; base: 43fcb9b856c66606230d6d7ba49140ae94cfaa00. Five uncommitted fix paths; no final commit.

Original six P1–P3/X1–X3 edits remain exact; all existing-base simulation tests and all 86 immutable files remain unchanged. Six F1 parity cases remain byte-identical. Nine no-order hash assertions pass. The three new simulation paths are owner-approved in correction 6; index.ts adds only the public export.

- packages/simulation/src/index.ts
- packages/simulation/src/tile-trial-week.ts
- packages/simulation/src/workshop-operation.ts
- packages/ui/src/__tests__/crafting-view.test.ts
- packages/ui/src/items-view.ts

Raw source copies and working.patch are preserved under fix-round2/. Reproduce this dirty-snapshot immutable check: node C:/Users/Admin/.t3/local-drafts/p6b-prC/fix-round2/preserve-hold.mjs. The final clean-head verifier remains prepared with --mode final --approval <Step0 approval> --round2-approval <correction6 approval>; final mode has not run because the timeout HOLD prevents the commit.
