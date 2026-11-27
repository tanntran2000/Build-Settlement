# Money M2 builder evidence

Status **PUSHED**. Branch `feat/money-purse`.
Base `f1fac9498f47fc7be8f6498ee3321800e14f2894` · tree `7c8f6cb1b85a2193358bbab86d43f3c7d807cd50`. `origin/main` `f1fac9498f47fc7be8f6498ee3321800e14f2894`.
Simulation commit `d0e04f7a7da2f10b3d1a721c12f85f693fa6e189`. Current head `546c48b9f312144c494a48dd44fe41741c9c2470` · tree `cfc1fc64a8bbb1df936ed495a8362fc2d15db18e`.

[Binding plan and Correction 9](../binding-plan-f76aef5.md) SHA-256 `fc531ceee93f1947c53125c5efe015770c637b6fc1d010f55a4be4c6cd4cfdbd`.

Owner Tân, verbatim — “Thiết kế Money” · “Duyệt thiết kế” · “Duyệt, giao M1” · “Start M2 Step 0”.

Correction 8 — “Chỉ bù phạt levy (Recommended)” · “Easy: 2 Money → 1 Gold (Recommended)” · “Luôn hoàn vào Money (Recommended)” · “Duyệt tất cả (Recommended)”.

Correction 9 — “1,2 điểm mỗi % (Recommended)” · “Happiness dưới 30 (Recommended)” · “Duyệt 1 điểm/Gold, tối đa 2 (Recommended)” · “Đúng khung thì commit (Recommended)”.

## Round 3

Accepted predicates 13/13.
Good Normal 10% first fell below 30 at W16 in all seeds. Good Normal 5% minimum Happiness 79 across 40 closes. Runtime Warning was absent in these scenarios. 15 Money at 5% arrived W12 Normal and W6 Easy. All 720 M1 0% records match on their original fields.

[3,600 raw closes](round-3.json) · [90-scenario table](round-3-table.csv) · [Acceptance checks](round-3-decision.json) · [Rule and data bytes](c9-code-bytes.json) · [Exact test bytes](c9-test-bytes.json).

## Verification

[C9 RED](c9-red.txt) · [Simulation unit](simulation-unit.txt) · [M2.2 unit RED](m22-red-unit.txt) · [M2.2 browser RED](m22-red-e2e.txt) · [M2.2 focused unit](m22-green-unit.txt) · [M2.2 browser GREEN](m22-green-e2e.txt).

| Gate | Attempts and exit codes |
| --- | --- |
| 1 diff | [gate-attempt1-1-diff.txt](gate-attempt1-1-diff.txt) exit 0 |
| 2 lint | [gate-attempt1-2-lint.txt](gate-attempt1-2-lint.txt) exit 0 |
| 3 typecheck | [gate-attempt1-3-typecheck.txt](gate-attempt1-3-typecheck.txt) exit 0 |
| 4 architecture | [gate-attempt1-4-architecture.txt](gate-attempt1-4-architecture.txt) exit 0 |
| 5 architecture-tests | [gate-attempt1-5-architecture-tests.txt](gate-attempt1-5-architecture-tests.txt) exit 0 |
| 6 unit | [gate-attempt1-6-unit.txt](gate-attempt1-6-unit.txt) exit 0 |
| 7 build | [gate-attempt1-7-build.txt](gate-attempt1-7-build.txt) exit 0 |
| 8 smoke | [gate-attempt1-8-smoke.txt](gate-attempt1-8-smoke.txt) exit 0 |

Unit totals — Tests  3371 passed (3371).

Smoke totals — 421 passed (35.9m).

CPU, process samples, ports and keep-awake. [gate-attempt1-before-gates-environment](gate-attempt1-before-gates-environment.json) · [gate-attempt1-before-smoke-environment](gate-attempt1-before-smoke-environment.json).

## Measurements

| Bundle gzip bytes | JS | CSS | Total | Budget |
| --- | ---: | ---: | ---: | ---: |
| M1 | 167272 | 7764 | 175036 | 200000 |
| M2 | 170121 | 7893 | 178014 | 200000 |

| Save bytes | Base | Head | Δ |
| --- | ---: | ---: | ---: |
| normal empty | 17525 | 17525 | 0 |
| normal populated | 17531 | 17531 | 0 |
| easy empty | 17523 | 17523 | 0 |
| easy populated | 17529 | 17529 | 0 |

| Difficulty | 100-NPC arm | Median ms | P95 ms | Maximum ms | Above 50 ms |
| --- | --- | ---: | ---: | ---: | ---: |
| normal | base0 | 46.270 | 71.046 | 93.025 | 43/160 |
| normal | base0repeat | 47.714 | 72.344 | 99.327 | 56/160 |
| normal | head0 | 46.885 | 63.266 | 73.957 | 47/160 |
| normal | base5 | 46.577 | 62.345 | 69.852 | 35/160 |
| normal | head5 | 48.505 | 78.255 | 120.548 | 67/160 |
| easy | base0 | 46.379 | 65.502 | 71.390 | 37/160 |
| easy | base0repeat | 46.291 | 65.922 | 134.862 | 39/160 |
| easy | head0 | 46.380 | 62.908 | 79.649 | 31/160 |
| easy | base5 | 47.602 | 105.033 | 162.421 | 57/160 |
| easy | head5 | 47.378 | 74.734 | 145.742 | 56/160 |

| Difficulty | Pair | Median Δ ms | P95 Δ ms | A/A max absolute median Δ ms |
| --- | --- | ---: | ---: | ---: |
| normal | 0% head minus base | 0.194 | 2.935 | 14.718 |
| normal | 5% head minus base | 0.746 | 1.594 | 14.718 |
| normal | head 5% minus 0% | 1.254 | 3.134 | 14.718 |
| easy | 0% head minus base | 0.056 | 1.544 | 5.400 |
| easy | 5% head minus base | -0.826 | 1.500 | 5.400 |
| easy | head 5% minus 0% | 0.169 | 1.912 | 5.400 |

[Measured summary](measurement-1/measurement-summary.json) · [Raw timings](measurement-1/raw-timings.ndjson) · [Worker](measurement-1/measure-worker.mjs) · [Command log](measurement-1/commands.txt).

Remote branch verified at the tested head. [Push log](push.txt) · [Remote ref](remote-head.txt).

Original main checkout and auxiliary worktree retained. New worktrees 0. Reclaimed bytes 0.

[UI byte inventory](m22-green-bytes.json) · [SHA-256 manifest](SHA256SUMS.txt).
