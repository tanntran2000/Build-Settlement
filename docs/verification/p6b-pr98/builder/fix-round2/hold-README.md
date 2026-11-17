# PR #98 — Builder round 2 HOLD

**HOLD: the existing 60-week snapshot-restore test timed out. No fix-round2 commit, final gates, smoke or bundle refresh. No push, PR update or merge.**

HEAD ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37; committed tree a164cb535cb914ee19f6e027b97013479c08e786; five working paths are intentionally uncommitted. Base 43fcb9b856c66606230d6d7ba49140ae94cfaa00. Previous completed round-1 evidence remains under fix-round1/.

## Owner scope and implementation

Tân, 2026-11-17, verbatim: "Share it now (Recommended)". Binding plan: binding-plan-c00f9a3.md, correction 6. Exact approval recorded in fix-round2/owner-approval.json.

One pure resolveWorkshopOperation in packages/simulation/src/workshop-operation.ts now owns the original End Week operation prelude, including safe integer checks, tax/income timing, tile-order funding and Farm debits, extraction, same-week Herbs and Hospital consumption. It returns per-tile status/reason and the accounting effects. End Week applies those effects; UI imports the same function and formats the reason. The UI allocation copy is removed. No original-base test, fixture or pin changed.

## Actual checks

| Check | Result | Evidence |
|---|---|---|
| Direct-function RED | 9 expected missing-function failures; 158 passes | fix-round2/r2-red-unit.txt |
| Targeted GREEN | 303 passed, three files; six unchanged parity tests and nine no-order hashes | fix-round2/r2-green-unit.txt |
| Typecheck | exit 0, no errors/warnings | fix-round2/r2-green-typecheck.txt |
| Pre-commit full unit | 2934 passed, one timeout; 2935 total; exit 1 | fix-round2/r2-green-full-unit.txt |
| Isolated timeout measurement 1 | PASS, 1220 ms; CPU snapshot 100% | fix-round2/timeout-alone-1.txt |
| Isolated timeout measurement 2 | PASS, 1467 ms; CPU snapshot 10% | fix-round2/timeout-alone-2.txt |
| Isolated timeout measurement 3 | PASS, 1249 ms; CPU snapshot 42% | fix-round2/timeout-alone-3.txt |

Failure: packages/simulation/src/__tests__/society-renewable-support.test.ts:160, "preserves complete gameplay and assignments through sixty weeks of snapshot restores". Full run: 5488 ms against the unchanged 5000 ms limit. The isolated runs do not establish a quiet baseline. No competing test/build process was detected before them; raw CPU/top-process data are in each log.

HOLD source: the original PR C brief explicitly says "If any test times out, measure it alone three times and HOLD." This is a user binding rule, not a skill-generated approval requirement. No timeout, assertion or threshold was changed. Await Claude's ruling before any further product edit, commit or final gate run.

## Preserved state and bytes

All 86 protected golden/fixture/data/pin paths match base 43fcb9b856c66606230d6d7ba49140ae94cfaa00 in HEAD and the working tree (canonical Git text bytes). All existing-base simulation tests remain unchanged. The original Step 0 package SHA remains ff0bf9a602286768e96c007e27c679e67660d92ec6b152a3746a021f5773014b. See fix-round2/edit-inventory.json and fix-round2/no-order-regression.json.

The five uncommitted files are copied byte-for-byte under fix-round2/working-copy/, with raw/canonical SHA256 values in fix-round2/hold-summary.json. Recoverable full diff: fix-round2/working.patch. No worktree/clone or dependency install. No cleanup. Assigned worktree retained for resumption.

The top-level SHA256SUMS.txt is refreshed for this HOLD package; it covers every file except itself, including nested manifests. Historical final-head gate/smoke/bundle files belong to their recorded older heads and are not claimed for this uncommitted extraction.

Next: Claude reviews the timeout evidence and returns a resume ruling.
