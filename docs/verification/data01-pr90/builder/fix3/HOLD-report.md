# DATA-01 PR A fix round 3 - HOLD

UTC: 2026-11-12T07:07:52.786Z  
HEAD: ca137a888e92aeba4794239cc5f5cef48d0181d6  
Tree: 721d2937e9f7dddb74d03c002ca0f260816162c7  
Git status --short: empty.

Owner approval recognized verbatim: "Sửa vòng 3". The approved port addition is not disputed. No product/test code has been edited; no commit, runner, push, PR or merge was started.

## Blocking instruction conflict

The round-3 brief says both:

> replaceSlot is no longer used by migration.

> Additive only: no existing test line, assertion, value, timeout, retry, worker or threshold changes.

It also says the port addition is the only approved deviation. Existing assertions explicitly require migration to call replaceSlot. At character-life-session.test.ts lines 63 and 160, the expected migration call is replaceSlot('main', [], [marker]). At lines 296-297, both parameterized fix2 F1 cases require a replaceSlot call with B plus the marker and inspect its WriteStats {put:0,deleted:0,unchanged:7}.

The approved migrateSlot returns records or null and supersedes this call. Keeping these assertions would require preserving the obsolete migration call solely to satisfy the spies. A clean implementation of the stated ruling needs equivalent assertion migration, which the explicit additive-only instruction currently forbids.

The source of this HOLD is the round-3 brief's additive-only constraint, not a skill approval requirement. The older plan correction 4 permits equivalent-storage test migrations generally, but I have not used it to override the newer explicit prohibition.

## Concrete minimal clarification needed

Permit equivalent-storage edits to the four existing lines 63,160,296,297. Exact BEFORE/AFTER proposals and invariants are in proposed-test-migrations.json. Add a migrateSlot spy without deleting the existing replaceSlot spy; assert replaceSlot was not called during migration. Retain existing slot equality, marker, legacy-byte, exact error and call-count assertions. Add adapter-level marker-only write checks to preserve the zero-data-write invariant rather than retaining an obsolete WriteStats return assertion. New GameStore test-double members can be added without changing old assertion lines.

No proposal has been applied. No assertion, value or setting has been removed or loosened.

## Planned RED coverage, not executed

1. Memory: marker already present -> no write; existing meta slot -> marker only; empty slot -> candidate plus marker; null candidate -> marker only/null return. Add invalid-input and failed-write preservation coverage consistent with replaceSlot.
2. Service: writer C lands after preliminary B read; C lands after preliminary empty read; invalid legacy must not force OLD when C is returned by the atomic operation. C and legacy bytes remain exact; marker is written.
3. Real IndexedDB: two pages with temporarily blocked legacy access leave migration pending; hold Tab A's completed preliminary read, save C from Tab B, release Tab A. Cover B and empty preliminary snapshots. Existing completion helpers can hold delivery without keeping a transaction alive. Observe Tab A writes inside the allowed storage.helpers.ts to require a marker-only write when C wins. This is a proposed faithful reproduction, not a claimed executed browser result.

## Execution inventory

- Product edits: none.
- Existing/new test edits: none.
- Commits: none.
- Fix3 RED/GREEN: not run.
- Gates 1-7: not run; exit codes/counts N/A.
- Fix3 smoke: not run; total/duration N/A.
- Fix3 gzip measurement: not run.
- Assigned worktree retained; storage reclaimed 0 bytes.

HOLD before product implementation. Claude needs to clarify that the four equivalent test migrations are allowed, or obtain that narrow exception. Until then the HOLD remains.
