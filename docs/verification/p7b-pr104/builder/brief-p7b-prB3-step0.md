P7-B PR B3 Builder: Task B3.0 Step 0 preflight only (buy, hire, live auction, sell and release; acquisition panel). No product or test edit, no commit, push, PR or merge in this turn.

Context: you are the P7-B Builder (Sol 6.2). Claude is Orchestrator and Tester; Astra 6.2 reviews; only dot or the owner merges. B1 (#102) and B2 (#103) are merged: main b184357d235d164478584e36b96d063551124e66 (tree 961567de7ef638861a55a42589be203037e123c9), main CI green (3,204 unit, 409 smoke).

Owner (Tân), verbatim: spec G1 "Duyệt P7-B"; plan approval "Duyệt, giao B1"; start of this step (dialog answer) "Start B3 Step 0".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, detached at b184357 (clean). Read only for Step 0: do not switch or create branches or worktrees, install, build or start servers. `git fetch origin` is fine.

Code graph (new tool): a code-only graphify graph of b184357 is at graphify-out/graph.json in that worktree (hidden from git). From the worktree folder you may run C:/Users/Admin/.local/bin/graphify.exe `affected "<symbol>"`, `explain "<symbol>"`, `query "<q>"`, `path A B` to list callers and dependents. Use it to make the change inventory complete, then confirm each hit in the source (the graph can miss dynamic or string references).

Binding documents (read fully):
- Plan with Corrections 1–11: C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-befe6e8.md (SHA-256 e0613ce89b9881b933ad93698b46af7f542f76862e51bfb924bb6d36be2f05cf). PR B3 = Tasks B3.0–B3.4; Global Constraints; Decisions 6, 7, 10, 11, 12, 14, 16; PR B3 file allowlist; Review Focus 1–3. Corrections 1–11 describe what B1/B2 already do.
- Spec v0.1: C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-spec-9dace86.md (SHA-256 0460f26205b8804ca39b0b87c889279ed568c29791556d3690927994dc3428b5): §4, §5 buildings, §8 price and auction, §9 sell and release, §11 UI, §13 data and save.
- AGENTS.md (Hard Laws, §4 anti-loop, §6 evidence). English UI text only; never name another game; all NPCs are adult women 18+, adult content is numbers, levels and labels only.

Task B3.0 — Step 0 preflight. Search the whole repo and list, each with file:line, current text, why B3 changes it, and the exact proposed after-text (whitespace and end-of-file newlines included):
1. Save shape and ruleset: `city.society.acquisition` joins the society key list (`trial/society.ts`), `isTileTrialState` / planning checks, persistence (`session-records.ts` regexes and row routing), fixtures and the golden. Decision 16 names only two ruleset bumps (11 in B1, 12 in B2). State plainly whether B3 needs `tile-society-13` (or a migration) to keep LAW-06 (older checkpoints refused unchanged, no silent shape change), with your proposal for the owner. Lesson from B1/B2: list every test, fixture, pin and e2e helper this touches before RED.
2. Report shape: `TileTrialReport.household` (Decision 14) — every report pin, snapshot, golden leaf and the e2e reader `expectReport` / `lifeUiSnapshot` in `tests/e2e/character-life-navigation.helpers.ts` that must read the new rows (B1's smoke failed 56 cases on a missed report field). Prove no-NPC reports stay byte-identical.
3. Items: `returnEquippedToStorage` in `trial/items.ts` and every items/storage test, pin and fixture it touches; the STORAGE_FULL path (Review Focus 3).
4. Command routing: `character-life-command.ts` and every exhaustive command switch, command-name list, lock/refusal table, UI command bridge (TileManagement / CharacterLife* hosts) and test that enumerates commands; new codes (`NO_BUILDING`, `OFFER_GONE`, `NOT_ENOUGH_GOLD`, `NO_BED`, `NPC_CAP`, `STALE_COMMAND`, `NOT_A_SLAVE`, `STORAGE_FULL`) and their UI messages.
5. `InsideCity.svelte` panel mount and every UI/e2e/accessibility test of InsideCity, tile selection and focus that the new panel changes (1280/1600, existing 320/375 must keep passing).
6. Any file outside the PR B3 allowlist and why; any number that would land in code instead of data (Global Constraints: every number TRIAL and in data — rival names, ceilings 0.80–1.30, hint bands, opening 70 %, raise steps 5000/25000, rival step 5000, stock size, sell share).
7. Your design for open details, marked as proposals for the owner: rival names (invented, none from a game), the panel layout and copy (For sale / Auction tabs, card fields, disabled reasons, bid log lines), report row texts, how stock names stay unique (Decision 10 nameSalt), and the order of End Week steps (draw after runNpcLifeWeek; unentered lots sold to a rival).
8. The RED test list for B3.1, B3.2, B3.3 (names and assertions with the plan's exact values, Review Focus 1–3 included), golden path-diff allowed paths, fixture generation, and the three commits.
9. Verification you will run on the composed packet before the HOLD (lesson from B2: the packet had type errors and misplaced imports): apply all proposed bytes in memory or a scratch copy outside the repo, run TypeScript and ESLint on the composed tree, and report the result. Do not leave any file changed in the worktree.
10. Size and speed: bundle risk vs 200 KB gzip (main JS 150.858 kB, CSS 7.567 kB); save size with 100 NPCs plus a full week of acquisition state; End Week cost of `drawAcquisition` (R-026: main already misses 50 ms at 100 NPCs — B3 must not add measurable cost; propose how you will measure it).
11. Branch: propose `feat/p7b-acquisition-market` from main b184357.

Then HOLD once with the full list in C:/Users/Admin/.t3/local-drafts/p7b-prB3/STEP0-HOLD.md (UTF-8) plus JSON byte inventories (existing-file replacements and generated-byte proposals), README and SHA256SUMS.txt. Reply with a short summary and the path. Anti-loop: anything still failing after 2 attempts is a HOLD; a queued message never overrides a HOLD.
