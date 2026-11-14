# P6-A PR A review fix round 1 — Builder evidence

PR: #93 (tanntran2000/Build-Settlement). Builder: Codex. Independent re-review at this new head remains pending.

- Tested HEAD: `f1944ce047b59654f75365dfea4cc8a2f83dddec`
- Tested tree: `a2456278c9cccf837ef0041cba44ed1f9e7ac7fc`
- Main base: `c4d3dc4fde78d004292f9038a4285cdd6f8186a7`; review base: `b31dc0268279abcb29483d372cd17d156fa825f0`
- UTC finalized: 2026-11-13T18:14:58.550Z. Local timezone: Asia/Bangkok.
- Binding plan: [09d46d0](binding-plan-09d46d0.md); [spec v0.3](binding-spec-17e7aaf.md); [AGENTS.md](AGENTS-at-fix1.md).

## Review findings and implementation

Source: [Astra review](https://app.t3.codes/threads/82f1d24c-48b3-45c2-816a-f3148433510a/mcp%3A94caacb1-f51f-4c8b-be73-fe7bd70decd9), thread `mcp:94caacb1-f51f-4c8b-be73-fe7bd70decd9`. Its verdict at b31dc02 is FAIL, with two P2s; it explicitly limits itself to a partial independent review. This evidence does not turn that verdict into approval.

F1: createWorldSession now replaces the empty item state using the validated real session seed after setting worldSeed. The existing no-argument createSocietyState default remains 2026. New tests exercise createWorldSession and the real Character Life New Game path: seeds 0 and 42 differ, and each seed repeats exactly.

F2: isItemsState rejects non-ascending inventory, consumable and storage instance ids, and empty equipped entries for either Player or NPC. Existing commands already sort returned items and remove an emptied equipment entry; new tests verify this and exact serialized bytes through reversed record order.

## RED and GREEN

| Check | RED | GREEN |
|---|---|---|
| F1 | Two different-seed assertions fail with identical Markets; repeatability checks pass | 4/4 |
| F2 | Five non-canonical shapes are wrongly accepted | 8/8, including mixed-location byte round trip and command sequence |
| Combined new regressions | 7 failed, 5 passed, exit 1 | 12/12, exit 0 |
| Affected regression suite | Seed expectation check: 3 failed, 41 passed | 129/129 across 9 files, exit 0 |
| v8 fixture generators | Existing generators reused | 55/55, exit 0 |
| Golden generation | One additional generation authorized by correction 3 | 4/4, exit 0 |

Logs: [RED](review-red.txt), [GREEN](review-green.txt), [seed expectations](seed-existing-red.txt), [affected GREEN](affected-green.txt), [fixture generation](fixture-generation.txt), [golden generation](golden-generation.txt). Pre-commit task logs name their then-current HEAD and tree; those task checks ran with working-tree edits. The final clean-head gates below cover the committed result.

## Fixture and golden path diff

The existing make-catalog-golden.ts generator ran once in fix1. Its previous file was preserved as [catalog-golden-b31dc02.json](catalog-golden-b31dc02.json). All three golden seeds and all ten v8 fixture envelopes were compared structurally against git blobs at b31dc02. Only `city.society.items.market.*.defId` changed. All other gameplay, summary and envelope fields are equal. The standalone new-game.json is byte-identical; nine Character Life fixtures have seeded Markets. The v7 fixtures have no changes in fix1.

The product commit includes `packages/simulation/src/__tests__/fixtures/review-fix1-path-diff.ts` and its .txt output. [Exact-head replay](final-path-diff.txt); [committed output copy](review-fix1-path-diff-committed.txt).

## Existing tests and hash pins

Additional inventory: **3 existing test files, 5 hunks**, each listed file:line, before → after in [existing-test-edits.md](existing-test-edits.md). The setup, matchers and non-item expected fields stay unchanged. Whole-PR inventory: **29 existing test files, 38 hunks** in [whole-pr-existing-test-edits.md](whole-pr-existing-test-edits.md). [Inventory script](make-edit-inventory.mjs).

No hash pin changed in fix1. [hash-pins.txt](hash-pins.txt) retains the whole-PR old → new values and Decision 9 reasons, in UTF-8.

## Exact-head gates

All seven gates ran sequentially at the clean head above, followed in the same PowerShell by setting CI=1, echoing CI=1 and running the full smoke. One runner at a time; no side test or build runs. No timeout was added or changed.

| Gate | Command | Result | Exit | Evidence |
|---|---|---|---|---|
| 1 | `git diff --check origin/main...HEAD` | PASS | 0 | [log](a4-gate-1.txt) |
| 2 | `npm run lint` | PASS | 0 | [log](a4-gate-2.txt) |
| 3 | `npm run typecheck` | PASS | 0 | [log](a4-gate-3.txt) |
| 4 | `npm run check:architecture` | PASS | 0 | [log](a4-gate-4.txt) |
| 5 | `npm run test:architecture` | PASS | 0 | [log](a4-gate-5.txt) |
| 6 | `npm test` | PASS | 0 | [log](a4-gate-6.txt) |
| 7 | `npm run build` | PASS | 0 | [log](a4-gate-7.txt) |
| Smoke | `CI=1 npm run test:smoke` | 350 passed (31.3m) | 0 | [log](a4-smoke.txt) |

Unit total: **2354/2354 across 112 files**. Architecture tests: **154/154**. Smoke had no failure or isolated rerun. Ports 4173/4174 were free [before](a4-ports-before.txt) and [after](a4-ports-after.txt).

The earlier verification at 3403814 passed gates 1–5 and was deliberately stopped before gate 6 after the edit inventory exposed an incidental EOF-only hunk in society.test.ts. That hunk was reverted in a new commit. The earlier logs are preserved under [verification-3403814](verification-3403814/STOPPED.txt). All seven gates and smoke were then rerun at the final head; no test failure or timeout caused that restart.

A complete run at d7866ce then passed all seven gates and all 350 smoke tests (31.2m). The final UTF-8 check caught a PowerShell Tee-Object encoding mistake in the committed path-diff output: UTF-16LE instead of UTF-8. The text was preserved exactly and re-encoded in a new commit, f1944ce. No gameplay or test source changed. The complete prior run is preserved under [verification-d7866ce](verification-d7866ce/RESTART-REASON.txt). All seven gates and the full smoke were repeated at f1944ce; the table above reports that final run. The strict UTF-8 preflight passed before the repeat began.

## Bundle measurement

| Asset | Main gzip | Final gzip | Growth |
|---|---:|---:|---:|
| JS | 108.46 kB | 114.196 kB | +5.736 kB |
| CSS | 5.81 kB | 5.814 kB | +0.004 kB |

Total: **120010 bytes gzip**, below 200,000. Main values are rounded baselines from the plan. [Measurement script](measure-bundle.mjs), [raw per-file results](bundle-measurement.json), [raw gzip artifact](bundle-raw.js.gz), [execution log](a4-bundle-final.txt).

## Commits and handoff

```text
fbc9ae63464702dfc125f758747e49538021870d fix(core): draw the initial Market from the session seed
ee5447ab3df1fb2624fd1b3437d4f6f48416e139 fix(core): reject non-canonical item collections
340381490fafc41debc1ee5b5a9605ce2e1aa6c0 test: refresh item Markets and verify the review fixture diff
d7866ce66a738cf023875cfa85de20e5e8fdce31 test: preserve the original society test file ending
f1944ce047b59654f75365dfea4cc8a2f83dddec chore: encode the review path-diff output as UTF-8
```

Every fix1 commit ends with `Co-authored-by: Codex <noreply@openai.com>`. No amend, force push, push, PR creation or merge was performed. Git status is empty, and the product diff contains no docs/ files. The assigned worktree is retained for Claude and Astra; no worktree or clone was created and no storage cleanup was performed.

Owner decision for correction 3 (Tân, 2026-11-13), verbatim: **"Allow session.ts in PR A (Recommended)"**. Earlier approved decisions are preserved verbatim in the binding plan and spec, including **"Approve both"**, **"Duyệt v0.2"**, **"Duyệt, giao Builder A"**, **"Add end copy to PR A (Recommended)"**, **"Allow additive shape edits (Recommended)"** and **"Allow, extend correction 2 (Recommended)"** (twice).

Evidence remains local under local-drafts/p6a-prA/fix1 as requested. Claude must commit this evidence on the WP docs branch before G5; product commits contain only approved source, test and fixture changes. [Final state](final-state.txt). [SHA256SUMS.txt](SHA256SUMS.txt) covers this package, including scripts and raw artifacts.
