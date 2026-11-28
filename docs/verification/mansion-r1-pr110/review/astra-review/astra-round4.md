# Mansion R1 independent review, round 4

**PASS.** Both round-3 findings are closed. Open findings are **P0 0 · P1 0 · P2 0 · P3 0**, with zero new and zero carried over.

| Reviewed item | Verified value |
| --- | --- |
| Branch | `feat/mansion-rooms` |
| Head | `02246aaef51ebe45c5c0508fdd3ef09764ed64ef` |
| Tree | `7d6ba6d57c74132c2178a6e84b6f0ad8d573efc4` |
| Round-3 base | `b6365646a4f13c0eb21babbcbae953b19400b52b`, tree `94f60e007e1c51e3722407e2a70495a3605539c7` |
| Delta | `c64d87f` and `02246aa`, 11 files, +199/−41 |
| Authority | Tân, “Sửa thêm 1 vòng nhỏ”. The correction-6 plan matched the Git blob at `624c8da` and SHA-256 `5ae1eeeded2c429309d6537fb14900ccee5d97a98e538839729232bbe7605648`. |

## Closure

| Round-3 finding | Status | Evidence at the reviewed revision |
| --- | --- | --- |
| R3-01 · P2 carried from R2-01 · Migration marker written after another writer filled the slot | **Closed** | `packages/persistence/src/game-store.ts:14` requires both an empty destination and an absent marker. The memory adapter applies that rule synchronously before writing at `packages/persistence/src/memory-store.ts:21`. IndexedDB applies it after reading the slot and marker in the same read-write transaction at `packages/ui/src/indexeddb-store.ts:40`. Both store factories have removed the policy callback. |
| R3-02 · P3 new in round 3 · Damaged title checkpoint called empty | **Closed** | `packages/ui/src/CharacterLifeApp.svelte:28` records a distinct damaged state. `packages/ui/src/TitleScreen.svelte:40` disables Continue, line 41 reserves the empty label for an empty slot, and line 47 renders the damaged alert. Chromium showed “No local checkpoint” on the empty control. After removing the city row and marker while retaining the v15 metadata, reloading showed the exact damaged alert, disabled Continue, preserved the rows and removed the empty label. |

**Migration replay.** With the ordinary factory and an empty preliminary read, I replayed three intervening writes through each adapter. Intact v14 loaded as v15. V14 missing its city row returned the old-checkpoint message. V15 missing its city row returned the damaged-checkpoint message. In all six cases the injected rows survived, the marker stayed absent and the legacy backup was preserved. Chromium recorded one migration transaction and zero put, delete or clear operations for each variant. The three earlier Chromium cases with missing v14 metadata and empty, v13 or v15 legacy storage also passed. The cases are at `packages/ui/src/__tests__/v14-load.test.ts:125` and `tests/e2e/mansion-rooms.spec.ts:307`.

## Existing expectations

| Test | Why the edit preserves the original coverage |
| --- | --- |
| `packages/persistence/src/__tests__/game-store.test.ts:14` and `:37` | An occupied migration now returns the exact prior rows and leaves the marker absent. Under simulated write failure the occupied case returns those rows, while the empty case still attempts a write and rejects with the existing “Write aborted” expectation. Both cases still check the stored rows and marker. |
| `packages/ui/src/__tests__/character-life-session.test.ts:312`, `:315` and `:343` | An unmarked occupied slot now expects exactly zero marker puts. The tests still pin the newest loaded state, original rows and legacy bytes. A competing migration’s distinct marker value is still compared in full. |
| `tests/e2e/storage.spec.ts:118` and `:176` | Saving B during blocked migration leaves B intact and unmarked. In the marker-winner case, the second tab supplies C as its legacy candidate and migrates into a genuinely empty slot while the first tab’s read is held. The test verifies the winning marker and serialized C before resuming the reader. It then verifies the exact loaded state and revision, unchanged rows, marker and original legacy bytes, and one transaction with zero writes. I replayed all three branches, including the marker winner. |

## Scope and verification

- Inspected all 11 changed files. R3-01 accounts for the shared guard, adapters, factory wiring and storage tests. R3-02 accounts for the two title components and its Chromium case. The three existing-test diffs matched `existing-expectations-R3-01.diff` exactly. The scope and matcher audits passed. No new partial matcher, loosened assertion, removed case, skip, timeout, digest literal, fixture or catalog change appeared in the range. `git diff --check b6365646..HEAD` exited 0.
- Independently replayed the v14-load Vitest file **13/13**, the Mansion Chromium spec **15/15**, and the three interleavings from the storage Chromium spec **3/3**. Ports 4173 and 4174 were free before each run. The browser replay used the existing build through request interception. It also covered keyboard operation at 1280 and 1600, Reports, title and in-game imports, session-only exit and the detached v14 checkpoint. The diff leaves the previously reviewed game rules, capacity calculation, upgrade placement and catalog data intact.
- Recomputed all **78/78** evidence hashes and verified manifest coverage. The builder’s focused GREEN logs precede the fix commits and identify the round-3 base. The subsequent `delivery/fix-r3/R1.5-exact-head.txt` identifies the reviewed head and tree. Gates 1–7 each exited 0, with **154 architecture tests** and **3,501 unit tests**. The runner set `CI=1` for the full smoke, which logged **450/450**, exit 0, including all four new Chromium cases and the marker-winner case. Full-suite totals are from the builder’s exact-head run.

VERDICT: PASS
