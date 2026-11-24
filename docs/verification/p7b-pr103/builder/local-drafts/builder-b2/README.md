# P7-B B2 Builder HOLD

**Status: HOLD after B2.1 RED.** Correction 7 authorizes the Step 0 packet byte for byte and one invented name replacement. The approved packet contains implementation blockers that require additional byte changes. I missed these issues during Step 0 because the prototype replay transpiled code without TypeScript diagnostics and did not parse the composed test imports.

| Work item | Result |
| --- | --- |
| Workspace | `feat/p7b-npc-generator`, HEAD `f73595b449db84b988d44a44cd33620efca9ecad`, tree `fd04e1f2d7f6f47270a2e7ac82d18b68729a6372`. Fetched `origin/main` at the same SHA. Final porcelain is empty. Ports 4173 and 4174 are free. |
| Pinned evidence | Correction 7, both byte inventories, Step 0 HOLD, save inventory, generator data and their manifest matched the requested SHA-256 values. |
| Browser and main | Chromium 153.0.8010.12 launched and closed from the existing installation. The main Quality Gate completed successfully for the base commit. [Main CI](https://github.com/tanntran2000/Build-Settlement/actions/runs/45302456754) |
| B2.1 RED | 33 failures out of 33 cases, exit 1. Each reached an assertion that the new generator or validator export should be a function. The archived test is byte-identical to the one run. [RED log](b2-1-red-recorded.txt) · [Archived test](npc-generator-red.test.ts) |
| Remaining work | B2.1 GREEN, both commits, B2.2 RED/GREEN, final verifier and golden path audit, gates 1–7, `CI=1` smoke, screenshots, delivered bundle, tick, production save measurements await amendment. |

## Confirmed blockers

1. **B2.1 staging.** The exact `validateNpcGenerator` import path reads `tuning.json` and requires `P7B_TRIAL.startGoldMilli` to equal the live tuning value. B2.1's data is 120000, and B1's tuning is 45000 until B2.2. Adding the required `WorldNpc.household` in B2.1 also makes the still-existing B1 `WORLD_STARTER_NPCS` literals invalid. Those literals are removed in B2.2.
2. **Approved generator source.** The computed key at proposed `packages/core/src/world/npc-generator.ts:76` widens to `string` when indexing the typed source table. That produces TS7053 at 76, TS7006 at 90 and TS2322 at 111. The diagnostics persist with the entire approved packet applied in memory, including final Gold and starter removal.
3. **Approved test insertions.** In `packages/simulation/src/__tests__/character-life-command.test.ts:2` and `packages/simulation/src/__tests__/character-life-observation.test.ts:2`, the new `withNpcs` import lands inside the multiline `import {` from B1. The exact composed text yields ESLint `Parsing error: Identifier expected` in both files.

The read-only checker replayed the approved canonical Git replacements and checked their before/after hashes before starting TypeScript and ESLint. The final combined core candidate reported three diagnostics and the proposed TypeScript/Svelte lint scope reported two parse errors. The checker exited 1. This is a diagnosis of the proposed bytes. The final gates never started. [Overlay checker](approved-overlay-check.mjs) · [Output](approved-overlay-check.txt)

## Requested amendment

Approve the type annotation and two import relocations in [amendment-proposal.json](amendment-proposal.json). For the B2.1 commit, keep the generator and household functions on an intersected generated-NPC type, with the strict shared `WorldNpc.household` field added alongside starter removal in B2.2. In B2.1 validate the starting Gold field as positive and pin the generator data at 120000. In B2.2 activate the approved exact comparison with tuning and run the existing wrong-value case there. This keeps B2.1 importable with B1 data, preserves the 45000 rejection test in the integrated stage, and restores the approved final validator bytes. All three permanent byte amendments are narrowly scoped to the typed lookup and import placement.

## Correction 7 name evidence

**Briala → Veylathenne** at the same Saltmere index. I coined the name, checked all five culture lists for duplicates, and found no exact public web results for the name alone or paired with character and location search terms. The comparison records the exact data and catalog hash changes, the six affected probe name expectations, and the four unaffected original NPC sample pins. The previous 100-NPC probe does not draw the replaced name, so its byte count and hash stayed the same. That remains an in-memory draft result. [Name additions and verifier](correction-7-additions.json)

Owner approvals preserved verbatim: “Duyệt, đổi Briala (Recommended)”, “Tạo lại chỗ cũ (Recommended)” and “Cho chạy npm ci (Recommended)”. The working tree was returned to its original clean state after preserving the authored RED test in this folder. Product files, history and remote refs received no Builder edits.

[Final workspace state](workspace-state.txt) · [SHA256SUMS](SHA256SUMS.txt)
