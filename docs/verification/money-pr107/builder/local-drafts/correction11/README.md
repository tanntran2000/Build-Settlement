# Money M2 Correction 11 builder evidence

**PUSHED** · feat/money-purse · reviewed base fa66b594391029ddb2cb43d98a90e9a8a4735446.
Head f97b5be31afbc3de02190a38c6c4075eb56d6194 · tree 75ec12d1a9c537f5e9788ac0ec52d3ff68db620c · origin/main f1fac9498f47fc7be8f6498ee3321800e14f2894.

Owner Tân, verbatim — “tiếp tục đi”.

[binding-plan-db8b946.md](../binding-plan-db8b946.md) SHA-256 b82d89dbeaf6875c93ea5bb9bb3ffa887040c3501b1a064e4bddeac21996b893.
[astra-round2.md](../astra-review/astra-round2.md) SHA-256 1378ebcd77f1aecc6580c64e3756ad1ae8dfe0eecb678ee65c95514a21348bf7.

## Restored Easy report case

The only change appends a third case to the Purse spec. The original 1280 and 1600 px cases remain byte-for-byte at the start of the file. The new case donates 1 Money through the UI on Easy, saves locally and reloads through Continue. It compares the exported purse with the exact saved 1,000-milli accumulator, ends the week and checks the Donation cell text “−1 Money · +0.5 Gold”. The shared report reader verifies the full rendered report and the case pins 1,000 Money milli and 500 Gold milli.

The scratch mutation truncates only Donation Gold display to whole Gold. Both original cases passed and the restored case failed with “−1 Money · 0 Gold”. The renderer was restored in scratch after the run. The unmodified product passed all three.

[Exact test bytes](test-bytes.json) · [Mutation bytes](mutation-bytes.json) · [Mutation build](mutation-build.txt) · [Mutation failure](mutation-smoke.txt) · [Focused pass](focused-smoke.txt) · [Browser source typecheck](e2e-tsc.txt).

## Exact-head gates

| Gate | Log and exit |
| --- | --- |
| 1 diff | [gate-attempt1-1-diff.txt](gate-attempt1-1-diff.txt) exit 0 |
| 2 lint | [gate-attempt1-2-lint.txt](gate-attempt1-2-lint.txt) exit 0 |
| 3 typecheck | [gate-attempt1-3-typecheck.txt](gate-attempt1-3-typecheck.txt) exit 0 |
| 4 architecture | [gate-attempt1-4-architecture.txt](gate-attempt1-4-architecture.txt) exit 0 |
| 5 architecture-tests | [gate-attempt1-5-architecture-tests.txt](gate-attempt1-5-architecture-tests.txt) exit 0 |
| 6 unit | [gate-attempt1-6-unit.txt](gate-attempt1-6-unit.txt) exit 0 |
| 7 build | [gate-attempt1-7-build.txt](gate-attempt1-7-build.txt) exit 0 |
| 8 smoke | [gate-attempt1-8-smoke.txt](gate-attempt1-8-smoke.txt) exit 1 · [gate-attempt2-8-smoke.txt](gate-attempt2-8-smoke.txt) exit 0 |

3,383 unit tests and 422 CI smoke cases passed.

The first full smoke hit the existing 60-second limit in the fulfillment report case. The same case passed in 44.2 seconds at the reviewed parent. The retry uses the same commit and suite with a fresh quiet-machine sample.

CPU samples, processes, ports and keep-awake. [gate-attempt1-before-gates-environment](gate-attempt1-before-gates-environment.json) · [gate-attempt1-before-smoke-environment](gate-attempt1-before-smoke-environment.json) · [gate-attempt2-before-smoke-environment](gate-attempt2-before-smoke-environment.json).

## Measurement carry-forward

The diff from fa66b59 is confined to tests/e2e/purse.spec.ts. Correction 11 permits carrying the 178,080 gzip-byte bundle (170,187 JS + 7,893 CSS) from fa66b59 and the paired 0% and 5% End Week timings from 546c48b, via Correction 10.

[Diffstat](measurement-carry-scope.txt) · [Bundle](../correction10/bundle.json) · [Timing summary](../round3-c9/measurement-1/measurement-summary.json) · [Raw timing data](../round3-c9/measurement-1/raw-timings.ndjson).

Remote branch verified at the tested head. [Push](push.txt) · [Remote ref](remote-head.txt).

Existing assigned worktree and scratch copy retained. Storage reclaimed 0 bytes.

[SHA-256 manifest](SHA256SUMS.txt).
