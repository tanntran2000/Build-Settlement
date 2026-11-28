# Mansion R1 independent review, round 3

**FAIL — HOLD for Tân under AGENTS.md §4.** Three of the four round-2 findings are closed. The three original cases of checkpoint overwrite are fixed, but R2-01 still permits a migration-marker write through an injected store. There is also one new title-screen copy defect.

| Severity | Carried over | New | Total |
| --- | ---: | ---: | ---: |
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 |
| P2 | 1 | 0 | 1 |
| P3 | 0 | 1 | 1 |

## Reviewed revision

| Item | Verified value |
| --- | --- |
| Branch | `feat/mansion-rooms` |
| HEAD | `b6365646a4f13c0eb21babbcbae953b19400b52b` |
| Tree | `94f60e007e1c51e3722407e2a70495a3605539c7` |
| Round-2 base | `b3d1278ee02e374f1c3cf1eceee48a0dc0fbcbf7`, tree `f3417d01d5176f50a488f1f2564767a15afe19b7` |
| Fix range | `b5fe15a`, `72290ae`, `d1005ee`, `84bfd66`, `b636564` · 15 files, +269/−64 |
| Authority | Tân, “Duyệt sửa vòng 2”. The reviewed plan matched the Git blob at `a32b543` and SHA-256 `bcbbf13e3ca94aa47d1f6914e946d9c30360ca0c0aa8a6677e2aad69a8a8b8a7`. |

## Round-2 closure

| Finding | Status at the reviewed head | Independent check |
| --- | --- | --- |
| R2-01 · Unreadable local slots | **Partially closed · carried P2** | Replayed all three real Chromium cases with the v14 metadata row missing and legacy localStorage empty, v13 or v15. Each showed the old-version message, disabled Continue, preserved all rows and legacy bytes, and recorded zero migration writes. A separate interleaving with surviving metadata still wrote the marker through both injected standard adapters. Details below. |
| R2-02 · Session-only Main menu and Quit | **Closed** | In Chromium, Main menu kept the player in the game with the session-only warning and an enabled Export. Explicit return reached the title, Quit showed the session-only warning, and Continue restored the built Bedroom. Export from the prompt included that Bedroom. The injected failed-factory test independently returned the exact save result with `volatile: true`. |
| R2-03 · Room-compatible beds | **Closed** | Replayed Guest Room / Single Bed and Bedroom / Guest Cot. Each contributed zero extra beds, failed the structure guard and returned `INVALID_SAVE_STATE` from the public decoder. Guest Room / Guest Cot gave capacity 2 and round-tripped. Validation, capacity and migration call the same `isMansionBedForRoom` predicate at `packages/core/src/mansion/invariants.ts:23`, `packages/core/src/mansion/rules.ts:36` and `packages/persistence/src/upgrade-v14.ts:66`. |
| R2-04 · Partial catalog diagnostics | **Closed** | The synchronous assertions use complete Error messages and the imported-schema cases compare the full `message` property at `packages/core/src/mansion/__tests__/catalog.test.ts:23`, `:30` and `:43`. Replayed a wrong-prefix diagnostic containing the full expected text. The current matcher rejected it. The expanded AST audit returned zero prohibited sites. |

## Open findings

### P2 · Carried over from R2-01 · An injected store can mark a v14 or unreadable slot during Continue

`packages/ui/src/character-life-session.ts:122` calls the injected store’s three-argument migration method after the preliminary read at line 96. The adapter’s in-transaction check permits the marker when a metadata row exists and the optional validation callback was omitted. Both public adapters have this behavior at `packages/persistence/src/memory-store.ts:22` and `packages/ui/src/indexeddb-store.ts:40`. The default browser construction at `packages/ui/src/character-life-session.ts:41` supplies the callback.

**Reproduction.** Start with no marker and an empty slot, supply a valid v15 legacy backup, and insert slot rows after the preliminary read but before the migration transaction. Use the ordinary store factory without the optional callback. This is the interleaving exercised by `packages/ui/src/__tests__/v14-load.test.ts:109`, with the metadata row retained.

| Incoming slot | Public load result | Independently observed writes |
| --- | --- | --- |
| Intact v14 | Success, upgraded in memory | Marker became `true` in the memory adapter and in Chromium IndexedDB. Slot rows preserved. |
| v14 with the city row missing | Old-version failure | Marker became `true` in the memory adapter. Slot rows preserved. |
| v15 with the city row missing | Damaged-checkpoint failure | Marker became `true` in the memory adapter and in Chromium IndexedDB. Slot rows preserved. |

A Continue attempt records migration as complete. Subsequent reads consult that marker before considering the legacy backup. Correction 5 item 1 expressly prohibits a marker write for these sources. The P2 rating reflects the narrower impact than round 2’s P1 overwrite: the original browser cases pass, the ordinary browser factory supplies the guard, and the residual write changes migration state while preserving the checkpoint rows. This is the same preservation requirement, so it counts once as carried over.

### P3 · New · The title calls a damaged local slot empty

`packages/ui/src/CharacterLifeApp.svelte:27` maps a damaged current slot to the same title state used for an empty slot. Line 28 also sets the correct damaged alert. `packages/ui/src/TitleScreen.svelte:41` renders “No local checkpoint” for that state.

**Reproduction.** Put v15 rows with metadata present and the city row missing in Chromium IndexedDB, remove the migration marker, then open the normal title screen. Continue was disabled. Both “No local checkpoint” and the exact damaged-checkpoint alert were visible at once. The player receives contradictory information about whether a checkpoint exists. The rows survive and the damage classification is correct. This presentation defect appears on the newly corrected damaged-current-row path.

## Scope, recovery and regression evidence

- **Scope and test integrity.** Compared all 15 paths with the R1 scope and correction 5. The changes implement room compatibility, slot preservation, the session-only exit path or their tests. The scope audit reproduced the exact substitutions in the two existing test files. The range contains no changed catalog data, fixtures, goldens or SHA-256 literals. No removed test case, softened assertion, new skip or timeout was found. `git diff --check b3d1278..HEAD` exited 0.
- **Three earlier test expectations.** At `packages/ui/src/__tests__/character-life-session.test.ts:241`, corruption of a current city row now expects DAMAGED under 2A and still checks the exact original records. At line 196 the injected fallback expects the added `volatile: true` field and still checks the loaded state. At `tests/e2e/storage.spec.ts:43` the blocked-storage flow checks the exact warning and explicitly returns to the title before running its existing alert, Continue and state checks. Each change follows its approved behavior.
- **Recovery at b636564.** The only changed file after `84bfd66` was `packages/ui/src/TileManagement.svelte`. At line 241, damaged in-game Continue prepends the existing “left unchanged” feedback to the damaged classification. At lines 256 and 343 the prompt mounts its contents only while open, so a closed dialog no longer duplicates the normal save notice. Compared both smoke logs by exact test identity. All 23 failures at `84bfd66` passed at the reviewed head. Their four files — `home-robbery.spec.ts`, `purse.spec.ts`, `tile-local-checkpoint.spec.ts` and `world-session.spec.ts` — are byte-identical to round 2. The separate recovery run recorded 32 passes. The three original storage cases and the volatile exit case also passed independently after recovery.
- **Save and game rules.** All 90 archived v1–v13 Character Life files returned `INCOMPATIBLE_SAVE`. All nine v14 files upgraded and compared equal to their original states after projecting out the R1 fields and restoring the version. All nine v15 files loaded. The level-3, 30-resident test reproduced **10 + 10 + 4/4/2**, deterministic placement, unchanged source and complete old-field equality, including Gold, Money and stats. The saved week plus eight determines grace. Shipped catalog pins remain 8/8/16. The exact-head unit evidence also covers the starter-room requirements, room/role/training and needs shape, atomic command refusals, Suite exclusion, 5A placement and free count, detached item rows and the loaded `died` case. The keyboard flows at 1280 and 1600, Reports, and title/in-game import classification passed in the Chromium replay.
- **Independent runs.** Checked ports 4173 and 4174 before the proof runs. Individual Vitest files passed: catalog 9/9, v14 upgrade 15/15, Character Life checkpoint 63/63. Replayed all 11 cases from the single Mansion Playwright spec in isolated Chromium contexts, routing the existing built assets directly without starting a server. Asset names matched the exact-head build log. The additional injected-store and damaged-title probes ran separately.
- **Builder evidence.** Independently recomputed every hash in `delivery/fix-r2/SHA256SUMS.txt`. All 94 entries matched and covered the delivered files. `R1.5-exact-head.txt` identifies the checked head and tree, zero listeners and 0% host CPU at start. Gates 1–7 each exited 0, with 154 architecture tests and 3,498 unit tests. The gate runner sets `CI=1` for smoke. The first full run recorded 423 passes and 23 failures, exit 1. The final full run recorded 446/446, exit 0. These full-run totals are from the verified builder logs.

VERDICT: FAIL
