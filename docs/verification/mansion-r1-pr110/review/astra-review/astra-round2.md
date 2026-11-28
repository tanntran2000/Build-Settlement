# Mansion R1 independent review, round 2

**FAIL — 1 P1 and 3 P2 findings.** A Continue attempt can overwrite a damaged v14 city row before the player saves. All ten round‑1 findings received changes. Six are closed without a remaining finding. The outstanding cases concern storage preservation, Main menu saves, bed compatibility, and an assertion that accepts a partial diagnostic.

| Review target | Verified value |
| --- | --- |
| Branch | `feat/mansion-rooms` |
| Head | `b3d1278ee02e374f1c3cf1eceee48a0dc0fbcbf7` |
| Tree | `f3417d01d5176f50a488f1f2564767a15afe19b7` |
| Round‑1 comparison | `d306f686876aca47bd9f4176a366380aa56fc774`, tree `3b69492a313493bee86294be35ec7871550ccaf7` |
| Main base | `8d37d16ca24420987e6b1294257da13bcdefb5a2` |
| Changes | `d927b16`, `b163990`, `046633d`, `b3d1278`. 21 files, +478/−118. |
| Authority | Tân, “Duyệt sửa cả 10”. The binding plan matched the Git blob at `8e4dbbc` and SHA‑256 `39ed9147623dbf810d1f4abeeff1ffc2444a12296b0eed80623a14e002e80d03`. |

## Round‑1 closure

| Round 1 | Status at the reviewed head | Verification |
| --- | --- | --- |
| 1. Blocked IndexedDB on v14 Continue | Partial · R2‑02 | With IndexedDB blocked, the title showed the exact existing warning and enabled Continue. “Save locally” then reported session-only storage with an export instruction. The autosave handler also checks the volatile flag. Main menu discards it. |
| 2. Damaged v14 writes a marker | Partial · R2‑01 | Replayed both localStorage cases with the v14 city intact and the outer version missing or set to v15. Both refused with empty rows and an absent marker. A v14 city in IndexedDB with its metadata row missing still triggers migration. |
| 3. Inline v14 items in IndexedDB | Closed | The v14 row writer detached the items. Canonical rows rebuilt to the same state as a portable upgrade. Replacing the detached city collection with the original inline collection, even empty, produced `StoreRecordError` at `city:city`. Portable v14 JSON still loaded. |
| 4. Missing permanent starter rooms | Closed | The public decoder returned `INVALID_SAVE_STATE` for empty rooms, either starter missing, and swapped starter types. Both starters at level 3 were accepted. |
| 5. Suite admits a loaded intimate role | Closed | Imported a valid Concubine in Maids’ Quarters. Both `MOVE_TO_ROOM` and `MOVE_NPC_HOME` to room‑1 returned `SUITE_ROLE_ONLY` with identical input bytes afterward. The same room policy excludes the Suite from recruitment. |
| 6. Catalog validates against its own scalar schema | Closed | Replaced values at JSON module load. String `"8"` failed at `mansion.json#needsGraceWeeks` with “must be a safe integer”. Removing `arousalPerWeek` or `calibration.lightRoleStressRelief` produced “missing field” at the exact path. Required root and nested scalar keys now come from the schema. |
| 7. Data-only room and furniture IDs | Original extension works · R2‑03 | Added the builder’s Guest Room and Guest Cot in memory. The catalog loaded, `BUILD_ROOM` built the new type, and its cot provided the second bed. A cot from the wrong room also provided that bed. Roles and effect kinds remain closed. |
| 8. Twelve partial assertions | Original 12 replaced · R2‑04 | The twelve sites now compare complete values or named fields. The local-alert case checks exact text. A newly added schema test uses a substring matcher. The diff introduces no skip or timeout and removes no existing case. |
| 9. Society guard accepts malformed Mansion data | Closed | Replayed null Mansion, invalid room level, and unknown furniture against `isSocietyState`. All three returned false. Occupancy and building-level checks remain at the city/roster boundary. |
| 10. Missing browser integrations | Closed | Replayed both new integration cases in Chromium. A marked v14 slot rebuilt the NPCs and ordered/ready workshop items, preserved the stored rows, and recorded no write. A successful in-game v14 file import preserved the prior local checkpoint and recorded zero read-write transactions. |

## Open findings

### R2‑01 · P1 · Loading a damaged v14 slot can overwrite its city row

`packages/ui/src/character-life-session.ts:80` checks the nested city version only among rows returned by the store. `packages/ui/src/indexeddb-store.ts:24` returns null when the slot has no metadata row, even when the city row still explicitly says v14. The load then reaches `migrateSlot` at `packages/ui/src/character-life-session.ts:104`. Its read-write transaction can put both candidate records and the migration marker. The adapter’s metadata check predates this correction. Correction 4 item 2 requires preservation of an identifiable damaged v14 source.

I seeded real Chromium IndexedDB with canonical v14 rows, removed only the metadata row, cleared the migration marker, and reloaded the title. The remaining city identified itself as `tile-society-14` in every run.

| Legacy localStorage before reload | City version after reload | Marker after reload | Continue |
| --- | --- | --- | --- |
| Empty | v14 | Written | Disabled |
| Archived v13 fixture | **v13** | Written | Disabled |
| Valid v15 fixture | **v15** | Written | Enabled |

The v13 run is particularly consequential. Continue refused, yet the original v14 city row had already been replaced with an older city. The v14-preservation decision needs to see surviving slot rows before it treats the slot as empty or considers a legacy migration.

### R2‑02 · P2 · Main menu drops the session-only save result before Quit

`packages/ui/src/TileManagement.svelte:244` saves, checks only `success`, and exits at line 247. The title clears its error and can offer Quit, whose message at `packages/ui/src/TitleScreen.svelte:34` says “You can close this tab now.” This is a separate save entry point from the corrected manual Save and autosave handlers.

In Chromium with IndexedDB blocked, I continued a v14 game, built a Bedroom through the room panel, chose Main menu, then Quit. There was no title alert after Main menu. Quit displayed the close-tab message. After reload, Continue reopened the original checkpoint with zero Bedrooms. In a second run, week 6 before Main menu reopened as week 1. Surface the volatile result where the player leaves gameplay, while Export is still available, or carry that information through the title and Quit path.

The original injected-dependency probe also still gets `{ success: true, replaced: false }` from a known fallback store because `packages/ui/src/character-life-session.ts:64` only returns `volatile` for default dependencies. The browser reproduction above used the default path and independently establishes the player-facing issue.

### R2‑03 · P2 · The reader counts incompatible bed furniture in a data-defined residence

`packages/core/src/mansion/invariants.ts:21` counts any piece marked `addsBed` against a room’s extra-bed allowance. `packages/core/src/mansion/rules.ts:31` counts the same pieces toward occupancy regardless of their compatible rooms. The migration placer already checks the bed’s `fitRooms` at `packages/persistence/src/upgrade-v14.ts:66`. Spec §8 limits the shipped Single Bed to Bedrooms.

Using the exact Guest Room/Guest Cot definitions introduced by the new extension test, I imported a complete v15 checkpoint with two occupants in each of these configurations.

| Room | Added piece | Piece’s catalog fit | Decoder | Beds |
| --- | --- | --- | --- | ---: |
| Guest Room | Guest Cot | Guest Room | Accepted | 2 |
| Guest Room | Single Bed | Bedrooms only | **Accepted** | 2 |
| Bedrooms | Guest Cot | Guest Room only | **Accepted** | 2 |

The shipped catalog masks the discrepancy because only Bedrooms accept extra beds. The first catalog-only extension exposes it through the playable checkpoint reader. Apply the same bed-compatibility rule to validation, capacity, and migration. Ordinary furniture’s fit bonus is separate from this bed restriction.

### R2‑04 · P2 · The new diagnostic assertion accepts a substring

`packages/core/src/mansion/__tests__/catalog.test.ts:43` uses `rejects.toThrow('mansion.json#' + path + ':')`. Vitest treats a string passed to this matcher as a substring. I ran the installed matcher with the deliberately incorrect message `wrong prefix mansion.json#needsGraceWeeks: wrong diagnostic`. The assertion passed, exit 0. This new partial matcher violates the explicit round‑2 criterion and can miss a regressed diagnostic. Compare the complete error message for each of the three cases. The evidence audit at `delivery/fix-r1/review-contracts.cjs` checks only the names `toMatchObject` and `stringContaining`.

## Regression and evidence checks

- **Scope and content.** All 21 changed paths fall within R1 and correction 4. The scope, approved-byte, digest-literal, and fixture-projection checks each exited 0. No SHA‑256 literal changed. Removing only the new behavior metadata reproduced the complete round‑1 catalog. The shipped content remains 8 room types, 8 roles, 16 furniture pieces, the Decision 3 fixed values, and TRIAL placeholders.
- **Upgrade and state.** All 90 archived Character Life files from v1–v13 returned `INCOMPATIBLE_SAVE`. All nine v14 life fixtures upgraded and compared equal to their originals after projecting out the new fields and restoring the ruleset. All nine v15 life fixtures loaded. A 30-resident, level‑3 v14 Mansion with a reversed roster produced **10 + 10 + 4/4/2**. At saved week 35, grace ended at 43. Repeat conversion gave identical output, the source retained its bytes, and all old fields including Gold, Money and stats compared equal. The separate golden comparison covered the tenth, city-only fixture.
- **Commands, UI and alerts.** The reviewed command paths retain clone-before-mutation, the whole-Mansion limit, city cap, room-required entry, household cleanup, and safe handling of `died`. The shared recruitment calculation selected Maids’ Quarters with nine usable beds and excluded the Suite. The keyboard build, upgrade and move cases passed at **1280 and 1600**. The title import opened the existing Reports view from the Throne Room. Both import surfaces displayed the exact old/damaged messages on the tested decoder failures and preserved the active state. UI actions still use the dispatcher.
- **Builder runs.** `delivery/fix-r1/R1.5-exact-head.txt` identifies the reviewed head and tree. Gates 1–7 ran in order and each exited 0, including **154 architecture tests** and **3,494 unit tests across 160 files**. The runner set `CI=1` before smoke. The log records **442/442** in one Chromium worker over 40.5 minutes, exit 0, plus 4% starting CPU, top processes, zero listeners on 4173/4174 and keep-awake. The targeted RED/GREEN evidence distinguishes the two originally absent browser cases from failing product behavior. Every one of the **26** files in the recursive evidence manifest matched its SHA‑256, with complete membership.
- **Independent execution.** Verified both ports were free before runtime checks. The focused Playwright checks used isolated Chromium data and intercepted requests to serve the existing build from disk. Its JS/CSS filenames match the exact-head build log. Six existing browser case bodies ran with their original assertions, including the two new integrations. The blocked-storage case and damaged-slot variants were exercised directly. Counterexample probes exited 0 when they observed the outcomes above. Full smoke totals are from the builder’s log. The assigned checkout was retained for follow-up. Storage reclaimed was 0 bytes.

VERDICT: FAIL
