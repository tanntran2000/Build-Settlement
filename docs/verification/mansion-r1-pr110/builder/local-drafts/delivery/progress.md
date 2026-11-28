# R1 ledger — binding-plan-257c48e.md
Base 8d37d16ca24420987e6b1294257da13bcdefb5a2. Owner: "Duyệt 1A 2A 4B 5A".
R1.1 → R1.2: common ruleset, defaults and full readers; conversion uses saved week and validates each exact shape.
R1.1 → R1.3 → R1.4: shared room catalog, capacity and refusal rules; UI uses commands.
Ruling: use the assigned isolated checkout and the requested delivery directory for evidence. R1.5 establishes the complete branch gate. Orchestrator and Astra own post-delivery testing and independent review.
R1.1 Ruling: omit the two approved withNpcs spans that dereference optional life. Core typecheck passed with the approved shared room seeder intact. Existing fixture callers can opt into it directly.
R1.1 HOLD: generated-NPC fixture checks pin v14 digests at npc-generator.test.ts:24–27. The four v15 digests require owner approval under Correction 1. Core/fixture run had 1074 passed, 4 failed; focused rerun had 48 passed, same 4 failed.
Correction 2 verified byte-identical to plan commit 7d02236. Owner: "Duyệt A".
Task R1.1: complete at 21ebd564b1072fdd04fb349c723fe02bfa1ea196. 1078/1078 core/fixture/golden tests, with all four old and new digests reproduced by projection-proof.cjs.
Task R1.2: complete at 42ee9cfa0440a27f605afc9f7af7ae384026d3e5. 19 RED, 496/496 persistence/load tests after implementation, and persistence typecheck passed.
R1.2 Ruling: browser load unit tests live under the UI package to preserve TypeScript rootDir and package boundaries. The synthetic full Mansion first uses a Hall with 50 beds, then projects the old resident placement.
R1.3 HOLD: the crafting replay test pins three full-city v14 digests outside the approved inventory and projects old state at line 43. Proof verifies both historical projections and identical report/item streams. The unchanged no-estate upkeep control separately needs a product validator fix. R1.3 and the drafted R1.4 tests remain uncommitted.
Correction 3 verified byte-identical to plan commit a512455. Owner: "Duyệt A + luật".
Task R1.3: complete at dc66904415ff5a797da34b88870e41c374e05b1d. All 1261 simulation/acquisition-view tests and simulation typecheck passed. The unchanged no-estate control now passes as a city-only simulation, while a Mansion occupant requires the estate.
R1.4 Ruling: correct the new browser fixture to use makeLifeWithNpcs so the RED failure reaches the missing Mansion panel. The corrected RED run failed those three cases and passed the alert control.
Task R1.4: complete at d306f686876aca47bd9f4176a366380aa56fc774. 752 UI unit tests passed and svelte-check found zero errors and zero warnings. Six final keyboard/import/browser cases passed after the locator correction and keyboard-selectable placeholders.
R1.4 Ruling: keep the empty room option selectable to allow resetting the draft and consistent Home/ArrowDown navigation when multiple rooms are available; the command button remains disabled until a valid room is picked.
R1.5 gate run started on d306f686876aca47bd9f4176a366380aa56fc774 (tree 3b69492a313493bee86294be35ec7871550ccaf7).
Task R1.5: complete at d306f686876aca47bd9f4176a366380aa56fc774, tree 3b69492a313493bee86294be35ec7871550ccaf7. Gates 1–7 exit 0. 154 architecture tests, 3479 unit tests and 439 Chromium smoke tests passed. Push exit 0 and ls-remote matched the same head.
