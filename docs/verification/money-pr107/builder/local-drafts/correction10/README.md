# Money M2 Correction 10 builder evidence

**PUSHED** · `feat/money-purse` · reviewed base `546c48b9f312144c494a48dd44fe41741c9c2470`.
Head `fa66b594391029ddb2cb43d98a90e9a8a4735446` · tree `03ab402350d02f1bc89970b7f0ce9a4e27cc2e93` · `origin/main` `f1fac9498f47fc7be8f6498ee3321800e14f2894`.

[Binding Correction 10](../binding-plan-a5ef4bb.md) SHA-256 `6579bbe220d290df9eb56bad641a5ca1fff5aa56e8267f946669dc3560341da5`.
[Astra round 1](../astra-review/astra-round1.md) SHA-256 `2679f41512fe7669d631b8dbe9f73fbd7070da74e5e1dcfe171713c9e62a3376`.

Owner Tân, verbatim — “Sửa cả 9 (Recommended)” · “Sửa luôn trong M2 (Recommended)”.

## Findings

| Correction | Verification |
| --- | --- |
| 1 Exact assertions | Whole refusal, receipt, view and exported purse assertions including `robbery`. Exact text is scoped to each field or control. [Refusal](mutations/refusal-message.txt) · [Receipt](mutations/whole-levy-receipt.txt) · [Control](mutations/control-object-shape.txt) |
| 2 Freeze | The existing recursive check receives the exported view. [Unfrozen variant](mutations/public-freeze.txt) |
| 3 Placement | Exactly 1,000 Money with zero city Gold in simulation and UI. [Engine Gold gate](mutations/craft-gold-gate.txt) · [UI Gold gate](mutations/craft-preview-gold-gate.txt) |
| 4 Effective Happiness | RED shows the original preview returned three on both profiles. GREEN shows one Normal and two Easy after donating 2 Money, including after reload. [RED](red-product.txt) · [Browser](browser-focus-2.txt) |
| 5 No gain | Whole levy earned through the dispatcher, matched operating funds on the no-donation control, actual citizen-score floor, and positive donations on 0/1/2%. [Two-clamp variant](mutations/floor-two-clamps.txt) · [Free bonus variant](mutations/free-levy-gain.txt) |
| 6 Shipped tuning | Real cap and rate through serialization for both profiles. [Zero-rate variant](mutations/shipped-rate-zero.txt) · [Zero-cap variant](mutations/shipped-cap-zero.txt) |
| 7 Envelope refusals | Exact Report, stale revision, missing and extra fields and original session. [Phase](mutations/report-guard.txt) · [Revision](mutations/revision-guard.txt) · [Envelope](mutations/envelope-guard.txt) |
| 8 Browser credit | Positive earned levy compared against the rendered credit for the selected difficulty. [Easy rendered at Normal rate](mutations/easy-receipt.txt) |
| 9 Desktop | Each width reached 20%, tested the disabled stepper and Report lock, and verified the Market rejection left the exported session unchanged. [Both widths](browser-focus-2.txt) |
| 10 Divisor | Easy zero fails with the exact catalog path and positive-integer rule. Normal continues to require 10,000. [RED](red-product.txt) · [GREEN](green-focus-2.txt) |

[Exact unit test bytes](unit-test-bytes.json) · [Exact implementation and browser bytes](implementation-bytes.json) · [Broken variants](mutations/summary.json).

The first focused run exposed opening Goods revenue in the tax-only whole-levy fixture. Explicitly disabling the Market preserved the expected tax and yielded whole receipts in all eight cases. A strict browser-source check exposed the pre-existing assignment to the read-only difficulty field. The fixture now uses a typed copy, with the same selected difficulty. [First focus](green-focus.txt) · [Final focus](green-focus-2.txt) · [First browser typecheck](e2e-tsc.txt) · [Final browser typecheck](e2e-tsc-2.txt).

## Exact-head gates

| Gate | Commands, output and recorded exits |
| --- | --- |
| 1 diff | [gate-attempt1-1-diff.txt](gate-attempt1-1-diff.txt) exit 0 |
| 2 lint | [gate-attempt1-2-lint.txt](gate-attempt1-2-lint.txt) exit 0 |
| 3 typecheck | [gate-attempt1-3-typecheck.txt](gate-attempt1-3-typecheck.txt) exit 0 |
| 4 architecture | [gate-attempt1-4-architecture.txt](gate-attempt1-4-architecture.txt) exit 0 |
| 5 architecture-tests | [gate-attempt1-5-architecture-tests.txt](gate-attempt1-5-architecture-tests.txt) exit 0 |
| 6 unit | [gate-attempt1-6-unit.txt](gate-attempt1-6-unit.txt) exit 0 |
| 7 build | [gate-attempt1-7-build.txt](gate-attempt1-7-build.txt) exit 0 |
| 8 smoke | [gate-attempt1-8-smoke.txt](gate-attempt1-8-smoke.txt) exit 0 |

Unit totals — Tests  3383 passed (3383).

Smoke totals — 421 passed (37.4m).

CPU, process samples, ports and keep-awake. [gate-attempt1-before-gates-environment](gate-attempt1-before-gates-environment.json) · [gate-attempt1-before-smoke-environment](gate-attempt1-before-smoke-environment.json).

## Bundle and carry-forward measurements

170,187 JS + 7,893 CSS = **178,080 gzip bytes**. Prior head 178,014. Budget 200,000.

[Bundle data](bundle.json) · [Command, head and exit](bundle-measurement.txt).

End Week timings are carried from `546c48b` under Correction 10. `git diff --stat 546c48b..HEAD` is limited to the approved `packages/ui/`, `packages/core/src/data/validate.ts` and test paths. Shipped tuning, save shapes and simulation code are unchanged. Populated save evidence carries forward with 17,531 bytes on Normal and 17,529 on Easy.

| 100-NPC paired median Δ | At 0% | At 5% | Max absolute A/A Δ |
| --- | ---: | ---: | ---: |
| Normal | +0.194 ms | +0.746 ms | 14.718 ms |
| Easy | +0.056 ms | −0.826 ms | 5.400 ms |

The prior run also reported the Normal 5% pooled p95 at 62.345 → 78.255 ms. The carry-forward is a scope decision, with R-026 and R-031 still open.

[Scope](timing-carry-scope.txt) · [Prior timing summary](../round3-c9/measurement-1/measurement-summary.json) · [Raw timings](../round3-c9/measurement-1/raw-timings.ndjson).

Remote ref verified at the tested head. [Push log](push.txt) · [Remote ref](remote-head.txt).

Existing main and auxiliary worktrees retained. The broken variants ran in the existing scratch copy. New worktrees 0. Storage reclaimed 0 bytes.

[SHA-256 manifest](SHA256SUMS.txt).
