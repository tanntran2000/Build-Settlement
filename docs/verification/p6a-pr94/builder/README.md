# P6-A PR B — Builder evidence

Builder work complete; Claude's independent testing and Astra's review are pending. No push, PR creation or merge was performed. Evidence is prepared here for Claude to commit on the WP docs branch; it is not committed to the product branch.

HEAD: a391fbb3fe530d7ad5c9139c03dfe56b6bcf02ce

Tree: e0d04ec81cfdf078654b7c8c9271c15b8dd5b4b2

Base: 5e9674e31fb017f730dced4178514ebbfe1dbf24

Branch: feat/p6a-week-rules. Git status: empty. Final ports 4173/4174: free. UTC: 2026-11-14T04:45:50.150Z.

## Commits

```text
0c6422d03cb62f52aacc352ab5dd7ca31b7ec724 feat(simulation): item drops, finds, goals and market restock
33e903f315761bfbec9d5f637b0d8b2bde60b1df feat(simulation): skill effects from items and new combat posts
52200163aa63f17b8229c3fc83ab8bd83385e6a2 feat(simulation): lord health, death by wounds and the Drug Store
a391fbb3fe530d7ad5c9139c03dfe56b6bcf02ce fix(simulation): capture Hospital operation before land cleanup
```

Every commit ends with Co-authored-by: Codex <noreply@openai.com>. B4 includes the minimal Hospital-operation capture fix found by gate 6. Final gates reran at the corrected head.

## RED / GREEN

| Task | RED before product edits | GREEN |
|---|---|---|
| B1 | 21 failures, 3 baseline checks passing; [RED](B1-red.txt) | 24/24 task cases; 215/215 across four files; [GREEN](B1-green-final.txt) |
| B2 | 39 failures, 57 passing; all 54 new cases ran; [RED](B2-red-final.txt) | 180/180 across five files; [GREEN](B2-green-final.txt) |
| B3 | 17 failures, 59 passing; all 10 new cases failed; [RED](B3-red.txt) | 76/76 targeted; [GREEN](B3-green-final.txt); 51/51 fixture/golden/health integration [log](B3-green-integration.txt); full typecheck [log](B3-typecheck-green.txt) |

The initial B1 run captured PR A report hashes before implementation. All three seeded 60-week crime/crisis/order/law report hashes still pass. Intermediate failed runs are retained and explained in [progress.md](progress.md). No timeout was changed.

## Final exact-head gates

All gates ran sequentially in one Git Bash shell, with one runner at a time. Smoke ran after gate 7 with the literal CI echo and CI=1 invocation. [Runner](run-final-gates.sh).

| Command | Result | Exit | Elapsed | Evidence |
|---|---|---|---|---|
| gate-1-diff | PASS | 0 | 0 s | [log](gate-1-diff.txt) |
| gate-2-lint | PASS | 0 | 12 s | [log](gate-2-lint.txt) |
| gate-3-typecheck | PASS | 0 | 33 s | [log](gate-3-typecheck.txt) |
| gate-4-check-architecture | PASS | 0 | 8 s | [log](gate-4-check-architecture.txt) |
| gate-5-test-architecture | PASS | 0 | 46 s | [log](gate-5-test-architecture.txt) |
| gate-6-unit | PASS | 0 | 62 s | [log](gate-6-unit.txt) |
| gate-7-build | PASS | 0 | 23 s | [log](gate-7-build.txt) |
| smoke | PASS | 0 | 1913 s | [log](smoke.txt) |

Full smoke: **350/350 passed with CI=1**. See [smoke.txt](smoke.txt). [Final port check](final-ports.txt). Unit total is in [gate-6-unit.txt](gate-6-unit.txt).

## Scope, pins and serialized bytes

[Owner decisions, verbatim](owner-approvals.md); [binding plan](binding-plan-bbef8e4.md); [spec](binding-spec-17e7aaf.md). Historical Step 0 HOLD is released by correction 5. [Step 0 audit](STEP0-HOLD.md).

Exactly **22 approved blocks in 12 existing test/support files**, verified with no other edits: [inventory](edit-inventory.md), [verification script](verify-approved-edits.mjs). Three new test files contain 88 cases. No docs/ files are on the product branch.

[Hash pins](hash-pin-changes.md): both actual candidate hashes match Step 0; every other pin remains unchanged.

The golden was regenerated once with the existing generator: [log](B3-generate-golden.txt). Its three seeds differ only under city.society.items.*; health remains 100 in these golden scenarios. [Path check](B3-path-diff.txt). The path-diff script and output are committed in packages/simulation/src/__tests__/fixtures/p6b-path-diff.ts and p6b-path-diff.txt.

Exactly two v8 fixtures have changed bytes: life-5-weeks.json and life-laws.json; both match the exact Step 0 candidate bytes. [Candidate comparison](candidate-comparison.json). They differ only under city.society.items.*. All 51 other fixture files are byte-identical. Generation logs: [five-week](B3-generate-life-5-weeks.txt), [laws](B3-generate-life-laws.txt). The crisis generation command also reproduced two other fixtures without changing a byte; this is recorded in the ledger. No other fixture bytes changed.

## Bundle measurement

Production gzip JS 116.310 kB, CSS 5.814 kB. Main baseline JS 114.37 kB, CSS 5.81 kB. Growth: JS 1.940 kB; CSS 0.004 kB. JS+CSS total 122.124 kB, below 200 kB.

[Measurement script](measure-bundle.mjs), [raw per-file results](bundle-measurement.json), [raw gzip artifact](bundle-raw.js.gz), [run log](bundle-final.txt).

All text evidence is strict UTF-8; the .gz file is a binary raw measurement artifact. [SHA256SUMS.txt](SHA256SUMS.txt) covers every other artifact, including the raw gzip.

## First gate attempt and correction

At 5220016, gate 6 found two existing outside-week exhaustion cases failing because the Hospital-operation scan read an exhausted building after cleanup removed it. No timeout occurred (2455 passed / 2 failed). The first attempt is retained under gates-attempt-1/. One product fix captures Hospital operation before cleanup. The unchanged existing cases plus all three new task test files passed 120/120 in B4-fix-green.txt. The complete final gate sequence and smoke then ran at the corrected head; no fixture or golden regeneration was repeated.

Builder and local verification: Codex. Independent Tester: Claude; Reviewer: Astra (their checks/review are pending).

Recorded ruling: a shared Market uses the strongest posted negotiation discount, capped at 10 percent. See progress.md for the reasoning and cost of a different aggregation policy.
