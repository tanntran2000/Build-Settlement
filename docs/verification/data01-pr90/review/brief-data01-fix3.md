[Claude (Orchestrator/Tester) -> Builder] DATA-01 PR A fix round 3 (owner-approved exception) — base head ca137a888e92aeba4794239cc5f5cef48d0181d6

Owner approval (Tân, verbatim, 2026-11-12): "Sửa vòng 3". He approved this after Claude told him the fix adds one method to the GameStore port fixed by the plan. That port addition is the only approved deviation.

If your last reply was a HOLD, keep the HOLD and wait for Claude; otherwise implement.

## Finding (Astra review 3, P1)
character-life-session.ts:79 + indexeddb-store.ts:29. Migration is pending and the slot holds B. Tab A reads (no marker, records B). Tab B saves C. Tab A calls replaceSlot('main', B, [marker]); the adapter diffs C against B and writes B back: C is lost. The empty-slot branch has the same gap (a save landing between Tab A's empty read and its legacy write is overwritten by legacy A).

## Ruling (binding)
Add to `GameStore` in packages/persistence/src/game-store.ts:
`migrateSlot(slotId: string, candidate: StoredRecord[] | null, marker: StoredRecord): Promise<StoredRecord[] | null>`
Inside ONE readwrite transaction (IndexedDB) / one synchronous step (memory store):
1. If the marker already exists: write nothing.
2. Else if the slot currently has records (a meta row): write the marker only; leave every slot record untouched.
3. Else: write `candidate` (if non-null) and the marker.
Return the slot's records as they are at the end of that transaction (null when no meta row). Validate inputs like replaceSlot does. Emit `performance.mark('haven.store.write')` once per call, as replaceSlot does.

In readLocalCharacterLife: keep the queue, lazy legacy access, BLOCKED and memory fallback behaviour. Build `candidate` from legacy only when the preliminary read found no records (as now); then call migrateSlot and use ITS returned records for everything after. `invalid` (OLD) is reported only when the returned records are null; if another tab's save is returned, that save is used. No marker is written when legacy is unavailable and the slot is empty (unchanged F3 behaviour). replaceSlot is no longer used by migration.

## Tests (RED first, full list before any product edit)
- Memory store unit tests for migrateSlot cases 1–3.
- Checkpoint-service unit test that reproduces the interleave: a store wrapper lets another writer save C after the preliminary read and before migration; assert C survives exactly, marker written, legacy untouched. Same for the empty-slot branch (C saved after the empty read; legacy A must not overwrite C; read returns C).
- Browser test against the real IndexedDB adapter for the cross-tab case (two pages in one context, using the existing hold/release store-completion helpers or equivalent). If a faithful browser reproduction cannot be built without new test infrastructure beyond tests/e2e/storage.helpers.ts, HOLD and report instead of weakening it.
- Additive only: no existing test line, assertion, value, timeout, retry, worker or threshold changes.

## Rules
Same as the earlier rounds: one commit (or one per concern) with plan-style message, why-body, attribution last; one runner at a time; ports 4173/4174 free; anti-loop — if this cannot be closed cleanly, HOLD and report, do not iterate. No push, PR or merge. Only files already in the PR A allowlist.

## Gates
At the final HEAD, sequentially: gates 1–7 (diff-check, lint, typecheck, check:architecture, test:architecture, npm test, build), then `CI=1 npm run test:smoke`. Logs under C:/Users/Admin/.t3/local-drafts/data01-prA/fix3/.

## Reply (one message)
HEAD + git status; commits; RED/GREEN per test with log names; gate exits and counts; smoke total and duration; JS/CSS gzip; complete edit inventory (additive proof); anything read differently.
