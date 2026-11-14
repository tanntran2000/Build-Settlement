# P6-A PR C — C3 smoke HOLD

C1 and C2 are committed. Gates 1–7 pass at 8af03070496d8e41ae85fecaea2d29c4cc474811, tree 025cbcb04ad3f3722d0bbd4a1ae1165e4915bfc4; the full CI=1 smoke fails. **Do not send for G5.** The worktree is clean and ports are free. No product/test/timeout/threshold change was made after the smoke failure.

## Full smoke and required isolated reruns

Full run: **356 passed, 11 failed (43.3m), CI=1**. [smoke-full.txt](smoke-full.txt) has the complete output with HEAD/tree/UTC/exit. Each failed case was then run alone exactly once with CI=1 at the same clean head:

| Width | Test | Isolated exit | Log |
| --- | --- | ---: | --- |
| 1600 | life shell accessibility baseline | 1 | [smoke-rerun-1600-baseline.txt](smoke-rerun-1600-baseline.txt) |
| 1600 | long character and report content reflows | 1 | [smoke-rerun-1600-reflow.txt](smoke-rerun-1600-reflow.txt) |
| 1280 | life shell accessibility baseline | 1 | [smoke-rerun-1280-baseline.txt](smoke-rerun-1280-baseline.txt) |
| 1280 | long character and report content reflows | 1 | [smoke-rerun-1280-reflow.txt](smoke-rerun-1280-reflow.txt) |
| 375 | life shell accessibility baseline | 1 | [smoke-rerun-375-baseline.txt](smoke-rerun-375-baseline.txt) |
| 375 | long character and report content reflows | 1 | [smoke-rerun-375-reflow.txt](smoke-rerun-375-reflow.txt) |
| 320 | life shell accessibility baseline | 1 | [smoke-rerun-320-baseline.txt](smoke-rerun-320-baseline.txt) |
| 320 | long character and report content reflows | 1 | [smoke-rerun-320-reflow.txt](smoke-rerun-320-reflow.txt) |
| 375 | full-body placeholder preserves profile disclosure at 375px | 1 | [smoke-rerun-375-profile.txt](smoke-rerun-375-profile.txt) |
| 1280 | full-body placeholder preserves profile disclosure at 1280px | 1 | [smoke-rerun-1280-profile.txt](smoke-rerun-1280-profile.txt) |
| 320 | Large report at 320px keeps all six letters and stock ledger inside the page | 1 | [smoke-rerun-320-large-report.txt](smoke-rerun-320-large-report.txt) |

The existing comprehensive audits identify two product styling defects in EquipmentView: selected slot/section/filter buttons have neither font weight ≥600 nor a ≥3px border, and slot keyboard outlines against the doll background have contrast below 3:1. Reflow cases flag the selected-state cue too. Native-control text cases pass. The 14 targeted new-panel measurements pass, but do not replace the failing comprehensive accessibility checks. Raw failure measurements are indexed in smoke-failure-details.json and LOCAL-ONLY.json.

Proposed owner-directed fix, **not applied**: add a bold non-colour cue to selected EquipmentView buttons and use a locally darker focus token on the doll background. Keep every existing assertion, threshold, timeout, exact P1–P10 block and immutable byte. The existing failing tests provide the regression cases. A fix needs owner direction because the brief explicitly requires a HOLD after the isolated smoke reruns.

The following completion-era details are retained for the successful C1/C2 and gate work; C3 remains HOLD:

Additional blockers: the 320px large-text Quartermaster item table overflows (344px document / 320px viewport); two profile tests retain an all-tabs fallback expectation missed in Step 0; and ItemCard says Ledger of Plenty grants a research point while binding plan line 171 defines +5% post output. See [C3-HOLD.md](C3-HOLD.md) and [P11-profile-placeholder-proposal.md](P11-profile-placeholder-proposal.md) for bounded, unapplied proposals. Exact P11 needs owner approval; it is not among the 10 applied blocks. No model/data/pin change is proposed.

Isolation launcher disclosure: one initial diagnostic launch incorrectly selected four width variants because Windows stripped nested quotes. It was cancelled with Ctrl-C before any case was reported complete; both raw streams are retained as aborted-launch-*.raw.txt. All corrected selectors were then dry-listed to exactly one case each (isolation-selection-check.json). The table above records the completed isolated reruns, one per failed case. No timeout, threshold or product/test source changed.

# P6-A PR C — Builder completion evidence

C1/C2 complete; C3 HOLD. No push, PR creation or merge. Claude is Orchestrator/Tester; Astra's independent review follows this Builder handoff. Evidence is external to the product branch for Claude's docs-branch commit under AGENTS §6.

| Identity | Value |
| --- | --- |
| Repository | tanntran2000/Build-Settlement |
| Worktree | C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 |
| Branch | feat/p6a-item-ui |
| Base | 2c04321ba342871e6a858110ea2320a8e4df0d5d |
| Tested HEAD | 8af03070496d8e41ae85fecaea2d29c4cc474811 |
| Tested tree | 025cbcb04ad3f3722d0bbd4a1ae1165e4915bfc4 |
| Builder / UTC | Codex / 2026-11-14T10:52:06.013Z |
| Git status | Empty |
| Ports | 4173 and 4174 free at 2026-11-14T10:52:05.7535817Z |

## Commits

- ce612d2461993486cb7fa35c6463c4c2a57ea3fe feat(ui): equipment view and inventory
- 8af03070496d8e41ae85fecaea2d29c4cc474811 feat(ui): market, potions, item reports and lord health

Both commits carry Co-authored-by: Codex <noreply@openai.com>. C3 is verification only; it adds no product commit.

## RED / GREEN and resolved HOLDs

| Task | RED | GREEN |
| --- | --- | --- |
| C1 | Six unit failures; three browser failures on missing views/actions | Six unit passes, zero UI typecheck diagnostics, successful build; all three browser cases pass in owner-authorized attempt 4 |
| C2 | Six new unit failures; valid-fixture browser RED has thirteen failures and one existing Claim pass | 168 targeted unit passes (12 item views + 156 existing letter cases); zero UI typecheck diagnostics/build pass; all 17 item browser cases pass |
| C3 | Verification only | Gates 1–7 pass; full smoke fails, isolated once per failure; HOLD |

C1's first two browser attempts each passed two and failed the post-effect setup. Owner allowed exactly attempt 3 (Farm); management 61 / +2% / +80 milli-Wheat / visible 0.08 passed, then the test failed its Planning-only export precondition. Owner allowed exactly attempt 4: real NEXT_WEEK expected session, UI Plan next week and exact export equality; all three passed. Historical HOLD reports/logs/snapshots are retained and superseded by those permissions and the final green evidence. No threshold or timeout was changed. C1's RED Destroy case reached the existing 60 s limit waiting for the absent button.

The initial C2 RED exposed an invalid new Hospital fixture and an overbroad report audit of the old horizontally scrolling Census table. The new fixture follows the existing two-worker Luminary rule; final report audits target the new item Details. No existing test was changed for those corrections. The item action contrast failure was fixed in ItemCard's scoped styles. Both targeted item browser GREEN runs passed; the later full smoke exposes additional EquipmentView accessibility defects.

## Exact-head gates

| Gate | Command | Exit |
| --- | --- | ---: |
| 1 | git diff --check origin/main...HEAD | 0 |
| 2 | npm run lint | 0 |
| 3 | npm run typecheck | 0 |
| 4 | npm run check:architecture | 0 |
| 5 | npm run test:architecture | 0 |
| 6 | npm test | 0 |
| 7 | npm run build | 0 |
| Smoke | echo CI=%CI% && npm run test:smoke -- --output=C:/Users/Admin/.t3/local-drafts/p6a-prC-playwright/final-smoke | 1 |

Unit total: **2488 passed**. Architecture tests: **154 passed**. Smoke: **CI=1, 356 passed / 11 failed (43.3m); 11 isolated reruns**. Each gate .txt contains full output and HEAD/tree/UTC/exit at the top; final-gates.ps1 runs them sequentially and starts smoke in the same shell after printing CI. Raw streams are also retained.

## Approved tests and immutable data

[edit-inventory.md](edit-inventory.md) contains all exact before/after blocks, with machine-readable applied line numbers in edit-inventory.json. Count: **10 blocks in 3 existing e2e files**, exactly P1–P10. verify-step0.mjs --implemented confirms exact text and rejects any extra existing-test change. [immutable-and-inventory.txt](immutable-and-inventory.txt) records exit 0 at the final head.

All **61 golden/fixture/catalog/pin files** retain both their base Git blob ids and original working-byte SHA-256. No golden/fixture regeneration or hash-pin change occurred. final-scope.json lists all 17 allowed changed files; there are no product docs, dependency changes, skipped tests or timeout edits.

## Bundle and visuals

[measure-bundle.mjs](measure-bundle.mjs) measures production JS/CSS with node:zlib gzipSync. [bundle/measurement.json](bundle/measurement.json) records exact bytes, hashes and the base comparison; [bundle/raw/](bundle/raw/) contains the actual gzip artifacts. Main is independently reproduced in C1-RED-build.txt at 116.52 kB JS + 5.81 kB CSS. Final: 124.92 kB JS + 6.65 kB CSS = **131.57 kB gzip**, below the 200 kB budget. Growth: +8.40 kB JS, +0.84 kB CSS. [bundle/comparison.html](bundle/comparison.html) is the chart.

Fourteen targeted new-panel accessibility measurements cover seven views at 1280 and 1600. accessibility-summary.json links the raw JSON and source script; the final smoke records actual keyboard traversal.

1280px PNGs:

- [death-letter-1280.png](screenshots/death-letter-1280.png)
- [equipment-1280.png](screenshots/equipment-1280.png)
- [market-1280.png](screenshots/market-1280.png)
- [materials-1280.png](screenshots/materials-1280.png)
- [potions-1280.png](screenshots/potions-1280.png)
- [quartermaster-items-1280.png](screenshots/quartermaster-items-1280.png)
- [steward-items-1280.png](screenshots/steward-items-1280.png)
- [temporary-storage-1280.png](screenshots/temporary-storage-1280.png)

## Owner decisions — Tân, 2026-11-14, verbatim

| Decision | Quote |
| --- | --- |
| Assignment | "Giao Builder C" |
| Existing tests | "Approve the 10 edits (Recommended)" |
| Four UI scope additions | "Allow these 4 files (Recommended)" |
| Buy integration in C2 | "Move the buy e2e to C2 (Recommended)" |
| Attempt 3 | "Allow the Farm fix (Recommended)" |
| Attempt 4 | "Allow this Planning fix (Recommended)" |

Binding plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-b5ec12c.md, correction 8; binding-inputs.json records source hashes. Original Step 0 search and approved drafts are retained. Work followed the inline executing-plans/TDD approach; explicit user scope, HOLD, evidence and no-subagent instructions took precedence over skill defaults. Author self-review was performed; no independent-review verdict is claimed.

## Manifest and local-only artifacts

All text evidence is UTF-8. SHA256SUMS.txt covers every file recursively except that top-level manifest itself, including any nested manifests and binary PNG/gzip artifacts. Large Playwright artifact folders stay outside this evidence folder; LOCAL-ONLY.json lists every file with size and SHA-256. The assigned worktree is retained for Claude/Astra; nothing was deleted or reclaimed.
