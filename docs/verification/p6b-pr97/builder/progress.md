# SDD ledger — plan: C:/Users/Admin/.t3/local-drafts/p6b-prB/binding-plan-16e48a1.md

Owner Tân, 2026-11-15: "Giao Builder B". Step 0 approved: "Approve P1, X1 and tile-trial.ts (Recommended)"; "Accept D1–D4 (Recommended)". Exact proposal hash recorded in owner-approval.json.

Pre-flight shared interface: B1 produces canonical Workshop/CraftOrder and commands consumed by B2 completion and persistence. Correction 4 settles D1–D4. The explicitly assigned external evidence ledger replaces skill scratch storage. No subagents per user; Claude/Astra independent review remains outside this Builder run.

Baseline: untouched 0de2d1f, three seeds x 60 weeks; report/item/city hashes captured before any product edit. New B2 craft-week.test.ts contains those three checks and is untracked until B2.

Task B1: complete (base 0de2d1f, head 4480ed81effbdae282de7d3b6d4cb023a137bc7c). Corrected RED: 93 failed / 17 passed of 110, due to absent commands/canonical workshops/posts. Initial RED retained; its Drug Store fixture was corrected from Specialist to slum-1 before product edits. GREEN: new 110/110; targeted 184/184; full npm test 2672/2672 in 125 files (includes 3 new B2 baseline checks). Core/simulation typechecks and targeted lint pass. One TS narrowing diagnostic corrected without behavior change. No extra test/scope/timeout edits. Commit carries Codex coauthor.

Task B2: in progress — full RED before completion/report/persistence product edits.
Task B3: pending.

Task B2: complete. Full corrected RED at exact B1 product bytes: 92 failed / 7 passed of 99. Initial RED 96 failed / 3 passed retained; initial GREEN exposed a new test fixture missing Red Leaf for upgrade-heal-potion-2, corrected without changing production or existing tests. verify-b2-corrected-red.mjs temporarily restored all B2 product files to B1, verified the corrected full RED, and restored the implementation in finally. Corrected GREEN 99/99; combined relevant suites 226/226; full npm test 2768/2768 in 126 files. No timeout. Simulation/persistence typechecks and targeted lint green; the new test's temporary Vite glob loader was replaced with the ordinary static import after the module existed to avoid a test-only ImportMeta typing dependency. No assertions loosened.

Implementation note: preserve the workshop's operation/staffing snapshot at the same point as existing Hospital operation, before population cleanup can release workers; completion still runs after all P6-A item steps. Material ready skips storage per D4. Detached records retain empty held-item lists and null ready-item placeholders until table rows fill their original queue/ready indices; only the rebuilt complete live state is accepted. No RNG calls.

Task B3: in progress — final clean-head immutable verifier, quiet CPU/process record, sequential gates, CI=1 full smoke, bundle and evidence refresh.
B2 commit: 735e3ff4d71c7fad04914913778f8325a86f79a8; tree bc5965abab73df37f43baeafd9e4f9d847a23826. Final edit/immutable verifier PASS; status clean.
B3: gates 1–7 PASS at 735e3ff, CPU start 4%; full unit 2768/2768, architecture tests 154/154. Full CI=1 smoke running since 2026-11-15T09:29:32Z, 370 tests/1 worker, unified exec session 7709. Live output: b3-smoke-ci1.txt. Product head stays unchanged. Bundle 132138 JS / 6743 CSS gzip bytes; combined 138881 < 200000. Final evidence generator is prepared but refuses to claim completion until smoke is green. Legacy e2e artifact backup exists; run preserve-legacy-e2e-artifacts.mjs after full-smoke when runner settles.

Task B3: complete at 735e3ff4d71c7fad04914913778f8325a86f79a8 / tree bc5965abab73df37f43baeafd9e4f9d847a23826. Quiet CPU start 4%. Gates 1–7 all exit 0, architecture 154/154, full unit 2768/2768. Full CI=1 smoke 370/370 in 33.4 minutes, exit 0, no rerun/timeout; ports 4173/4174 free. Bundle JS 132138 and CSS 6743 gzip bytes, combined 138881; supplied rounded main reference JS129.82/CSS6.74 kB. Final edit/immutable verification PASS: exact P1 and X1 only, 152 existing tests checked, all 85 protected files unchanged. 35 generated legacy screenshot/accessibility outputs retained outside evidence and 35 originals restored byte-identically. README, final inventory and LOCAL-ONLY manifest refreshed.

Final review: author source/diff review only; no extra subagent under the user's no-subagent instruction. No additional findings or scope rulings. Claude/Astra independent verification/review remains for the assigned handoff. No push/PR/merge, docs changes, extra checkout, dependency install or cleanup. Product status clean; retained assigned worktree for review, storage reclaimed 0 bytes.
