# P6-A PR A — review fix round 2

PR #93, tanntran2000/Build-Settlement. Builder: Codex. Independent re-review at this head remains pending.

- Tested HEAD: `4afe92763856cc3f82445803298beacc7ccedf68`
- Tested tree: `8e95ed5e017bff02d4ff43d61789244ce2ff6519`
- Review base: `f1944ce047b59654f75365dfea4cc8a2f83dddec`; main base: `c4d3dc4fde78d004292f9038a4285cdd6f8186a7`.
- Finalized UTC: 2026-11-14T01:36:56.596Z. Local timezone: Asia/Bangkok.
- Binding [plan ba75ec8, correction 4](binding-plan-ba75ec8.md) and [spec v0.3](binding-spec-17e7aaf.md).

Owner Tân, 2026-11-14, verbatim: **"Allow validate.ts in PR A (Recommended)"**. Earlier plan approval **"Duyệt, giao Builder A"** and the other approvals remain preserved in the binding plan/spec.

## Findings and fixes

Finding 1 is the second fix attempt on the original F2. The first implementation in this round passed all new regressions and the affected suite; no third approach was started. isItemsState now accepts the form produced by the unchanged record rebuild:

- Root item-state keys follow the rebuild literal order.
- Instances use id, defId; storage wrappers use item, expiresWeek.
- Equipment slots enumerate in ascending instance-id order.
- Owners follow their lowest equipped id, with JavaScript's integer-like key enumeration preserved. Object.fromEntries reproduces the rebuild's enumeration, including numeric and prototype-named NPC ids.

All overwritten layers were checked against session-records.ts. Materials, Market offers and goals are retained by the rebuild, so their internal key order stays unchanged. No change was made to session-records.ts or item-command.ts. New tests verify both rejection of non-canonical forms and exact serialized bytes for canonical counterparts, reversed record input, and command results.

Finding 2: isCharacterLifeSessionState in character/validate.ts now checks equipped owners against the validated Player and actual NPC roster after profile validation. The society-only structural validator remains unchanged. The persistence checkpoint importer used by the UI refuses unknown owners, while the same shape with Player or a real NPC is accepted and round-trips exactly. No UI product file changed.

## RED and GREEN

| Finding | RED at f1944ce | GREEN |
|---|---|---|
| 1: rebuild order | 8 byte-identity failures; numeric/prototype-owner command control passes | 9/9 |
| 2: unknown owners | 4 failures: two core-boundary and two checkpoint-import assertions; real-owner controls pass | 6/6 |
| Combined | 12 failed, 3 passed, exit 1 | 15/15, exit 0 |
| Affected regression suite | — | 161/161 in 9 files, exit 0 |

Logs: [RED](review-red.txt), [GREEN](review-green.txt), [affected GREEN](affected-green.txt). Task-stage logs name their then-current committed baseline while the fixes were in the working tree. Final acceptance below covers the clean committed head.

## Scope, test inventory and immutable data

The round changes four files: items.ts, character/validate.ts, and two NEW persistence test files. No existing test was edited. [Fix-round inventory](existing-test-edits.md): **0 files / 0 hunks**. [Whole-PR inventory](whole-pr-existing-test-edits.md): **29 existing files / 38 hunks**, with file:line, before → after. [Inventory script](make-edit-inventory.mjs).

No golden or fixture regeneration ran. [Immutable check](immutable-check.txt), using [check-immutable.mjs](check-immutable.mjs), verifies **21 golden/v7/v8 fixture files byte-identically** against f1944ce, both committed and in the working tree. Three further pin/catalog files also have unchanged git blobs and content. Hash pins are unchanged. The first diagnostic compared a CRLF checkout of catalog-data.test.ts with its LF git blob; that measurement false positive is preserved in immutable-check-crlf-diagnostic.txt. The check was corrected to compare raw fixture bytes and normalize checkout line endings only for the three pin/catalog source files. No fixture, pin or catalog content was changed to satisfy it.

## Exact-head gates

All seven gates ran sequentially at the clean head above. In the same shell, CI was set to 1 and echoed before the complete smoke. One runner at a time; no side test/build run. No timeout was added or changed.

| Gate | Command | Result | Exit | Evidence |
|---|---|---|---|---|
| 1 | `git diff --check origin/main...HEAD` | PASS | 0 | [log](a4-gate-1.txt) |
| 2 | `npm run lint` | PASS | 0 | [log](a4-gate-2.txt) |
| 3 | `npm run typecheck` | PASS | 0 | [log](a4-gate-3.txt) |
| 4 | `npm run check:architecture` | PASS | 0 | [log](a4-gate-4.txt) |
| 5 | `npm run test:architecture` | PASS | 0 | [log](a4-gate-5.txt) |
| 6 | `npm test` | PASS | 0 | [log](a4-gate-6.txt) |
| 7 | `npm run build` | PASS | 0 | [log](a4-gate-7.txt) |
| Smoke | `CI=1 npm run test:smoke` | 350 passed (30.7m) | 0 | [log](a4-smoke.txt) |

Unit total: **2369/2369 in 114 files**. Architecture tests: **154/154**. Smoke had no failure or isolated rerun. Ports 4173/4174 were free [before](a4-ports-before.txt) and [after](a4-ports-after.txt).

## Bundle

| Asset | Main gzip baseline | Final gzip | Growth |
|---|---:|---:|---:|
| JS | 108.46 kB | 114.370 kB | +5.910 kB |
| CSS | 5.81 kB | 5.814 kB | +0.004 kB |

Total **120184 bytes gzip**, below 200,000. Main baselines are rounded. [Script](measure-bundle.mjs), [raw per-file results](bundle-measurement.json), [raw gzip artifact](bundle-raw.js.gz), [execution](a4-bundle-final.txt).

## Commits and handoff

```text
210b14b350565e296d422e31e0d57d7d7b17e58c fix(core): require item-table canonical key and equipment order
4afe92763856cc3f82445803298beacc7ccedf68 fix(core): reject unknown Character Life equipment owners
```

Both commits end with Co-authored-by: Codex <noreply@openai.com>. No push, PR creation, amend, force push or merge was performed. Git status is empty and there are no docs/ changes on the product branch. The assigned worktree is retained for Claude and Astra; no worktree/clone was created and no storage cleanup was performed.

Evidence remains local under local-drafts/p6a-prA/fix2 as requested. Claude commits evidence on the WP docs branch before G5. [Final state](final-state.txt); [SHA256SUMS.txt](SHA256SUMS.txt). All text is UTF-8; the manifest covers scripts and raw artifacts. This Builder handoff does not claim independent review approval.
