[Claude (Orchestrator/Tester) -> Builder] DATA-01 PR A: independent review FAIL — fix round 1 (head 9fbf27e)

Astra (independent Reviewer) returned FAIL on 9fbf27e. Claude accepts all four findings. They are bugs inside the approved plan's scope (Decisions 5–7, A1 contract line 222, correction 4b); no plan decision changes. Same worktree and branch, same rules as your original brief (TDD order, mechanical-only test edits, one runner, anti-loop HOLD after 2 failed fixes, no push/PR/merge). Ports 4173/4174 are free; Claude's runner is stopped.

## Findings to fix

1. **P1: a pending save can bring a fallen checkpoint back.** `saveLocalCharacterLife` awaits `store.read` then starts a separate `replaceSlot`. Ordering Save(read) → End Week fall → `clear` → late `replaceSlot` restores the pre-fall session. Fix: run every checkpoint operation (read, save, clear) through one module-level queue in `character-life-session.ts`, in invocation order (a promise chain; a failed op must not break the chain). RED: a unit test with a store whose `read` is held on a deferred promise: start save, start clear, release read → after both settle, `store.read('main')` is null and only the marker remains.

2. **P1: Continue and Main menu accept stale results.** `continueLocally()` passes the revision at completion, so a Planning command made while the read is pending is overwritten. `mainMenu()` calls `onexit()` after its save even if the player acted meanwhile, losing those changes. Fix: capture `state.revision` (and an `importRead`-style ticket if one exists) at invocation; after the await, drop the result if superseded. Main menu: if the revision changed during the save, do not exit (show nothing new; the player can press Main menu again). RED: unit or e2e test holding the store read/write, dispatching a Planning command, releasing → the newer state stays, and Main menu does not exit.

3. **P2: temporarily blocked localStorage is marked migrated forever.** If `window.localStorage` throws while IndexedDB works, `legacy: null` is cached and the marker is written, so a legacy save that becomes readable later is never migrated. Fix: tell "legacy storage unavailable" apart from "key absent"; when unavailable, do not write the marker (retry next read/boot); do not cache the unavailable state forever. RED: deps with a legacy whose `getItem` throws → read → no marker; then legacy readable with a valid save → read migrates it.

4. **P2: `recordsToSession` does not enforce the A1 contract (plan line 222: "throws StoreRecordError(ref) on bad shape").** A `meta` whose `rulesetId`/`revision`/`phase` disagrees with the city is ignored; a malformed object-valued city is returned. Fix: validate the city/world record shapes and the meta ↔ city consistency before returning; throw `StoreRecordError('meta:session' | 'city:city' | 'world:outside')`. Keep the approved old-ruleset path (old-ruleset records still decode so the read refuses with today's message). RED: one case per ref. Also strengthen the round-trip fixture test to assert `success === true` on both serializer results before comparing text (strengthening only).

## Order

For each finding: full RED list first, run and record RED, then implement, then GREEN. After all four: typecheck, `npm test`, build, the e2e specs touched (by name), then the A4 gates 1–7 and `CI=1 npm run test:smoke` at the final HEAD. One commit per finding with a why body and your attribution last.

## Reply (one message)

Final HEAD/tree and clean status; commits; RED/GREEN counts and log names per finding; each gate's exit code and counts; smoke total and duration; JS/CSS gzip; every edited existing test line (file:line before → after, invariant kept); anything you read differently. Logs under C:/Users/Admin/.t3/local-drafts/data01-prA/fix1/.
If your last reply was a HOLD, keep the HOLD; otherwise implement.
