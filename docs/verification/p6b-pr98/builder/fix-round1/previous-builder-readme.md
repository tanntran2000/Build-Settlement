# P6-B PR C — Builder evidence

**C1–C3 complete. Local branch ready for Claude/Tester and Astra review. No push, PR or merge.**

Tested HEAD: `09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f`. Tree: `0ae12c7f62462fb14090a61c788a998f00a031ca`. Base: `43fcb9b856c66606230d6d7ba49140ae94cfaa00` (merged PR B #97). Branch: `feat/p6b-crafting-ui`. Status empty. Ports 4173/4174 free. Builder Codex, 2026-11-15.

Owner decisions, verbatim:

1. Tân, 2026-11-15: "Giao Builder C".
2. Tân, 2026-11-15: "Approve P1–P3 and X1–X3 (Recommended)".

Approval covers the exact frozen step0-proposed-edits.json SHA256 `ff0bf9a602286768e96c007e27c679e67660d92ec6b152a3746a021f5773014b`; recorded in owner-approval.json. Binding plan: binding-plan-6ff7e4f.md, correction 5; spec: binding-spec-cd1b18a.md.

## Commits and behaviour

- `75ccc69faaf40102ad217f22debf555c508be0b8` — feat(ui): workshop panel and brewing.
- `09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f` — feat(ui): crafting hints and report rows.
- Both commits end with `Co-authored-by: Codex <noreply@openai.com>`. Smithy recipes/cards, queue/capacity, held fee, Cancel and ready outputs; Hospital/Drug Store Buy/Brew tabs; keyboard/focus paths; material hints; complete conditional Quartermaster tables and strict visible parser.

Design ruling: crafting reports use full-width letters to keep the output table readable at PC widths. This costs vertical scrolling; legacy report layout and letter order remain. No unresolved blocker/deferred minor in the author self-review. Independent review remains pending.

## RED and GREEN

| Task | RED before product edits | GREEN |
|---|---|---|
| C1 | 64 new unit failures; valid-fixture e2e 4 missing-UI failures | 64 new units; 232 units with old item/report compatibility; 4/4 e2e |
| C2 | 78 unit failures / 65 passes; corrected-modal e2e 6 missing hint/report failures / 6 panel passes; additional PC header RED 2 failures | 311 compatibility units; 16/16 e2e including readability, 1280/1600 audit, 320/375 reflow and parser; UI typecheck 0 errors/warnings |

All original runs are retained, including the new fixture workforce correction, roving-tab test correction, keyboard-modality probe correction and material-versus-wearable oracle correction. No existing assertion value, threshold or timeout was loosened. No test timeout occurred in task or final runs. See progress.md and c1-*/c2-*.txt for full commands, outputs, exits and UTC.

## Scope and immutability

**6 approved edits; 11 changed paths.** P1–P3 only in the existing e2e helper; X1–X3 only in the two extra product files. See edit-inventory.md/.json and the frozen literal proposal. Final verifier PASS: all 155 existing test files plus the helper, exact restricted-file bytes and 86 immutable paths. Golden/fixture/pin changed set `[]`; no regeneration. See c3-final-inventory-immutable.txt, immutable-baseline.json and hash-pin-changes.md.

## Final quiet-machine gates

Gate-start CPU load **3%**, 8 logical processors. Full CPU/top-process/current-process counters and empty competing test/build job list are in c3-quiet-machine.txt and each gate header. One runner at a time; no delegated review job. Tested HEAD/tree above on every result.

| Gate | Result | Seconds | Log |
|---|---|---:|---|
| gate1-diff-check | PASS (exit 0) | 0.061 | gate1-diff-check.txt |
| gate2-lint | PASS (exit 0) | 13.733 | gate2-lint.txt |
| gate3-typecheck | PASS (exit 0) | 30.079 | gate3-typecheck.txt |
| gate4-check-architecture | PASS (exit 0) | 6.152 | gate4-check-architecture.txt |
| gate5-test-architecture | PASS (exit 0) | 42.352 | gate5-test-architecture.txt |
| gate6-unit | PASS (exit 0) | 62.097 | gate6-unit.txt |
| gate7-build | PASS (exit 0) | 20.939 | gate7-build.txt |
| c3-smoke-ci1 | PASS (exit 0) | 2066.916 | c3-smoke-ci1.txt |
| bundle-measurement | PASS (exit 0) | 0.194 | bundle-measurement.txt |
| c3-final-inventory-immutable | PASS (exit 0) | 37.198 | c3-final-inventory-immutable.txt |

Totals: **2911 unit tests / 127 files**, **154 architecture tests**, **386 full smoke cases, CI=1**, all pass. Gates 1–7 ran in order; CI echo and CI=1 smoke ran in the same PowerShell process. No smoke rerun, failed smoke case, timeout measurement or gate retry was required.

## Bundle, accessibility and owner screenshots

Production gzip: **JS 136.58 kB**, **CSS 7.15 kB**, combined **143.73 kB < 200 kB**. Reported main baseline: JS 132.14 / CSS 6.74 kB; byte deltas 4442 JS / 412 CSS. Baseline is the supplied rounded report, not a new build of main. Script measure-bundle.mjs; full per-file bytes/gzip/SHA in bundle-results.json; raw JS/CSS under bundle-artifacts/ with nested SHA256SUMS.txt.

Accessibility: 14 raw measurements in accessibility/, summarized in accessibility-summary.md/.json; every new desktop panel at 1280/1600 and new-panel reflow at 320/375 passed. Five actual 1280×1000 screenshots under screenshots/: smithy-queue, brew-tab, drug-store-brew, quartermaster-rows, steward-quartermaster. See screenshot-gallery.html for a preview. All refreshed in the final-head full smoke.

## Reproduce and verify

From the assigned worktree:

```powershell
node C:/Users/Admin/.t3/local-drafts/p6b-prC/verify-edit-inventory.mjs --mode final --approval C:/Users/Admin/.t3/local-drafts/p6b-prC/owner-approval.json
node C:/Users/Admin/.t3/local-drafts/p6b-prC/refresh-sha256.mjs --verify
```

run-c3-gates.ps1 records the actual gate procedure and requires -ExpectedHead. Do not repeat the legacy-backup label without preserving its existing backup. All local evidence is UTF-8. SHA256SUMS.txt covers every file except itself, including nested manifests; independent sha256sum -c verification is recorded after finalization. See LOCAL-ONLY.md for trace/output and legacy artifact locations.

No docs/ file is on the product branch. This local package must later be committed on the WP docs branch with exact-head evidence and independent verdicts under AGENTS.md §6 before G5. The assigned worktree remains for review; no cleanup/reclaimed storage.
