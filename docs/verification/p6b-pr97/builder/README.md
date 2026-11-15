# P6-B PR B Builder evidence

**B1, B2 and B3 complete. Local exact-head verification PASS.** No push, PR or merge.

Date: 2026-11-15. Builder: Codex. Independent Orchestrator/Tester Claude and reviewer Astra have not reviewed this Builder head in this run; those verdicts remain for the handoff/docs-branch workflow.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01. Branch: feat/p6b-crafting-orders.
HEAD: 735e3ff4d71c7fad04914913778f8325a86f79a8.
Tree: bc5965abab73df37f43baeafd9e4f9d847a23826.
Base: 0de2d1ffa91abadf76ced9696f440a09bf19f8af.
Final git status: empty. Ports 4173/4174: free (b3-final-ports.txt).

## Owner decisions

Tân, 2026-11-15, verbatim:
- "Giao Builder B".
- "Approve P1, X1 and tile-trial.ts (Recommended)".
- "Accept D1–D4 (Recommended)".

Binding plan: binding-plan-16e48a1.md, Plan correction 4. Spec: binding-spec-cd1b18a.md. The older Step 0 proposal/preflight remains immutable historical evidence; owner-approval.json records approval of proposal SHA-256 1976eadd970e5b17521fc92afe973340f92735b8098f0afbf094378682582431. Final applied state is edit-inventory.md/.json.

## Commits

- 735e3ff4d71c7fad04914913778f8325a86f79a8 feat(simulation): complete craft orders at end week
- 4480ed81effbdae282de7d3b6d4cb023a137bc7c feat(simulation): craft orders

Both commits end with Co-authored-by: Codex <noreply@openai.com>.

## RED and GREEN

| Task | Corrected RED | GREEN | Evidence |
|---|---|---|---|
| B1 | 17 passed / 93 failed (110 total) | new 110/110; targeted 184/184; full suite 2672/2672 | b1-red-corrected.txt/.json; b1-green-attempt1.txt/.json; b1-green-full-unit.txt |
| B2 | 7 passed / 92 failed (99 total) | 99/99; targeted 226/226; full suite 2768/2768 | b2-red-corrected.txt/.json; b2-green-attempt2.txt/.json; b2-green-targeted.txt; b2-green-full-unit.txt |

Initial runs are retained. B1's new Drug Store test fixture was moved to its correct slum tile before product edits. B2's initial fixture supplied Green Leaf but potion II requires Red Leaf; the new fixture was corrected, all B2 product files were temporarily restored to exact B1 bytes, and the corrected complete RED was observed before restoring the implementation (verify-b2-corrected-red.mjs, b2-red-proof-*.txt). The ordinary static module import replaced temporary missing-module RED scaffolding after craft-week.ts existed; assertions unchanged. Typecheck-only fixes addressed TypeScript narrowing and the temporary glob type; no product behavior or existing test was loosened. No timeout, retry or threshold changes.

## Exact-head gates

Quiet start CPU load: **4%**, 8 logical processors. Full CPU/top-process/current-counter record and zero other test/build jobs: b3-quiet-machine.txt. No review/subagent job was launched by this Builder. Gates ran sequentially, followed by bundle measurement and the full smoke in the same shell; every log includes HEAD/tree/UTC/exit/CPU record.

| Gate | Command | Result / exit | Duration |
|---|---|---|---|
| 1 | git diff --check origin/main...HEAD | PASS / 0 | 0.06 s |
| 2 | npm.cmd run lint | PASS / 0 | 8.53 s |
| 3 | npm.cmd run typecheck | PASS / 0 | 31.48 s |
| 4 | npm.cmd run check:architecture | PASS / 0 | 6.91 s |
| 5 | npm.cmd run test:architecture | PASS / 0 | 43.38 s |
| 6 | npm.cmd test | PASS / 0 | 58.56 s |
| 7 | npm.cmd run build | PASS / 0 | 22.57 s |

Full smoke: **370/370 passed, CI=1, exit 0**, 2014.19 seconds. CI is explicit in b3-smoke-ci1.txt and b3-ci-environment.txt. No smoke reruns. Architecture test total is recorded in gate5-test-architecture.txt; unit total is **2768/2768 in 126 files**. b3-gates-1-7.txt combines all seven full logs; b3-results.json is the machine-readable summary.

## Edit and immutable verification

1 exact existing-test assertion P1 plus 1 approved outside-allowlist line X1; 13 total source/test paths changed. verify-edit-inventory.mjs --mode final --approval owner-approval.json passes. It checks all 152 pre-existing test files, exact P1/X1 whole-file transformations, allowed paths and all 85 immutable files against base. final-edit-immutable-verification.txt records the final result. Golden/fixture changed paths: **[]**; no regeneration. 24 existing literal hash pins unchanged; 9 additional no-order regression hashes captured from untouched base remain equal. Raw and full old → new values: hash-pin-changes.md.

## Bundle

Production JS 132.14 kB gzip versus supplied rounded main 129.82 kB; delta 2.318 kB. CSS 6.74 kB versus 6.74 kB; raw delta 3 bytes against the rounded baseline. Combined 138.881 kB, below 200 kB. Method: sum Node gzipSync(default) for production JS/CSS, decimal 1000-byte kB; no new main build. Script measure-bundle.mjs, raw JS/CSS and nested manifest in bundle-artifacts/, measurements in bundle-results.json and bundle-measurement.txt.

## Evidence integrity and storage

All text UTF-8, including owner quotes and arrows. SHA256SUMS.txt covers every file except itself; nested manifests included, verified by refresh-sha256.mjs --verify. No Playwright traces in this folder; LOCAL-ONLY.json inventories retained outputs outside it. items.spec.ts hardcodes an older evidence path; 35 originals were backed up, generated outputs retained locally outside PR B evidence, and the originals restored byte-identically. No docs files on product branch. All existing worktrees retained untouched; assigned worktree retained for review. No extra worktree/clone/install; reclaimed storage 0 bytes. G5 evidence publication/independent review is left to the assigned docs-branch workflow; this Builder did not publish.
