P7-B Astra 6.2: independent review of P7-B PR B3 (buy, hire, live auction, sell, release; acquisition panel). Review only: do not edit product files, commit, push, comment on GitHub or merge. Do not run the full smoke or start servers; single vitest files or single Playwright specs are allowed only if you need proof, and only after confirming ports 4173/4174 are free.

Target
- Branch feat/p7b-acquisition-market (local, not pushed yet), head 825ca5c27cc3d440705dffb6b41699d1dcbd2e4e, tree b935bbe742992eb4cd792c93fe2881e1e67ea5fb, three commits on main b184357d235d164478584e36b96d063551124e66 (PR #103 B2 merged): 67903d2 `feat(simulation): npc stock, buy, hire, sell and release`, 822c695 `feat(simulation): live npc auction`, 825ca5c `feat(ui): acquisition panel`. Review b184357..825ca5c (86 files).
- Worktree (read only): C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Confirm HEAD and tree first. graphify-out/ there is a local code graph (excluded from git); you may use it for callers (`graphify affected "<symbol>"`), never as proof alone.

Binding documents (read fully)
- Plan with Corrections 1–13: C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-d0e5a0b.md (SHA-256 484707bc757c904e6af578ca69821a4412ac23ce766b2f46847e6da5f0489a5f). PR B3 = Tasks B3.0–B3.4; Global Constraints; Decisions 10–12, 14, 16; PR B3 allowlist; Review Focus 1–3; Corrections 12–13.
- Spec v0.1: C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-spec-9dace86.md (§5 buildings, §8 price and live auction, §9 selling and releasing, §11 UI, §13 data/save).
- Builder Step 0 packet pinned by Correction 12: C:/Users/Admin/.t3/local-drafts/p7b-prB3/STEP0-HOLD.md (f940a6d42c19a2e47be694fed411f27d966fe27bb7645396d2e108210b756f91), source-replacements.json (fd02c1c4bf598a8097c2b84a3135f42689946e41b0f58316a444ac6cd9e07fd0), generated-byte-proposals.json (ca4d2c1fb31e4d6e9050605cd9f9286ea04b591e11145487183612237b1d3e25), repo-impact.json (d1169363c47eb2ea5a75df653ea1870d1fac9472e6e59650570d27128d9d167d). Correction 13: builder-b3/mobile-keyboard-proposal.patch (ac8fb2c0ebb6aaeb82b0c0bf785f83f6484b6eec8d14965625448039d4e2acc5). Builder evidence: C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/ (README.md, B3.3-HOLD.md, B3.4-BUILDER.md, verifiers, timings/, bundle/).
- AGENTS.md.

Owner decisions (Tân, verbatim): "Duyệt P7-B", "Duyệt, giao B1", "Start B3 Step 0", "Duyệt v13 (Recommended)", "Duyệt lưu cả 2 (Recommended)", "Duyệt tất cả (Recommended)", "Yêu cầu kiểm replay đầy đủ", "Duyệt sửa test (Recommended)".

Check, at minimum
1. Per-file ledger for every changed path against the B3 allowlist plus the Correction 12 §7 additions and path index; anything else is a finding.
2. Byte-exact reconstruction of every existing-file change against the packet plus Correction 12 item 4 additions and Correction 13; audit or run the Builder verifier. Any loosened or removed assertion, partial matcher in a new test, new timeout or skip is P1. Check every retargeted v12→v13 test still pins historical v12 bytes.
3. Save (Decision 10, Correction 12 items 1–2): ruleset tile-society-13, v12 refused unchanged (raw JSON and store rows) via INCOMPATIBLE_SAVE; empty acquisition sentinel {"week":0,"stock":[],"lots":[],"departures":[]}; no second clock; `raises` and `departures` bounded; no rendered strings serialized; 93 historical fixtures byte-identical; golden diff only the three allowed paths; 100-NPC full-market save ≤ 1 MiB.
4. Owner replay check (Correction 12 item 4): a checkpoint loads only if every lot equals its seeded replay (rivals, stances, ceilings, opening, each raise legal, leader, price, status) and every stock offer equals its draw; mismatches refused with input unchanged; a valid long transcript loads. Look for forgeries the tests miss (e.g. reordered raises, a raise after withdraw, settled status with wrong winner, stock with a duplicated slot or a bought offer still listed).
5. Commands (Decisions 11–12, LAW-04): BUY_NPC / BID_NPC / WITHDRAW / SELL_NPC / RELEASE_NPC all-or-nothing with the listed codes and refusal order; Review Focus 1 (reload at 55 then +5 gives the same outcome), 2 (exact Gold leaves 0; full home, 100 NPCs, one Gold short refused unchanged), 3 (storage 9/10 with two items → STORAGE_FULL; one item succeeds, 60 % credited); auction math (opening ceil 70 % V to 5 Gold, +5/+25, rival +5 only, cap 1.30 V + 25 Gold over 1,000 lots, ties first index); End Week order; paused building hides stock but settles its open lot; sold ids never reappear.
6. Data and names: every balance number in npc-acquisition.json / existing data, none in behavior code; validator messages `<file>.json#<id>.<field>: <rule>`; rival names invented, none from a game; English UI only; NPCs adult women 18+; adult content as numbers/labels only.
7. UI (§11, LAW-02): panel dispatches commands only; tabs follow the roving-tabindex pattern (Arrow/Home/End); card fields, disabled reasons, bid log lines, report rows ("Household activity"); 1280/1600 and 320/375 pass; focus moves as described. Known cosmetic: in acquisition-auction-1280.png the rival list bullets sit outside the card — rate it.
8. Performance and size: is "within noise" supported by builder-b3/timings/raw-timings.json and comparison.json (End Week and load, control and full market)? R-026 stays open (50 ms budget unchanged). Bundle 169.391 kB gzip vs main 158.425 kB (+10.97 kB): what makes up the increase (builder-b3/bundle/), and is anything pulled into the UI bundle that should not be (e.g. full generator data)?

Results already recorded (verify they are about this head; do not rerun the smoke)
- Builder at 825ca5c: gates 1–7 exit 0 (3,240 unit, 154 architecture), CI=1 smoke 414/414 in 34.6 min.
- Claude (Tester) gates and smoke run after your review, at the final head.

Output
- Write C:/Users/Admin/.t3/local-drafts/p7b-prB3/astra-review/astra-round1.md (UTF-8; create the folder): head/tree checked, per-file ledger, reconstruction table, findings P0–P3 with file:line and why, final line `VERDICT: PASS` or `VERDICT: FAIL` (PASS = no P0–P2).
- Reply in this thread with a short summary: verdict, finding counts, file path.
