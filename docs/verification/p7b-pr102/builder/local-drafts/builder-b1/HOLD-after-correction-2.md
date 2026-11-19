# P7-B B1 · HOLD after Correction 2

**B1.1 is on HOLD before the implementation commit.** The requested expanded unit suite found 17 pre-existing cases whose expected behavior or exact data view changes under the approved B1 implementation. Adjusting those cases would exceed the approved inventory. All proposed B1 changes are preserved in the assigned worktree for owner review.

## Git and the binding correction

| Item | State |
| --- | --- |
| Branch | `feat/p7b-map-estates` |
| HEAD and fetched `origin/main` | `27f4dc2e0ea6ed4f12e79fab6366d11fb555551b` |
| HEAD tree | `a0ea6329441e75df363b356052528f1426233281` |
| Worktree | 82 changed paths, verified against the inventory. No B1 commit |
| P7-A branch | `feat/p7a-npc-sheet` at `952985c4fafaffeee44a4eb8932c178858659a40` |
| Ports | 4173 and 4174 free |

Tân approved Correction 2 with “Duyệt 2 chỗ sửa”. The plan copy SHA-256 is `00bf415a55d9f0bc3afafe3b4bdb875205a7a39a68c2e4a82e518ca5c79e2557`. The prior HOLD evidence pinned by Correction 2 retains SHA-256 `13dee23e6dbeadab049a7870a9ee14899c9b6678f9900f958b2970b2e36a584d`.

## B1.1 evidence

| Check | Observed result |
| --- | --- |
| RED unit | 40 of 40 fail on the baseline, exit 1. [Log](red-unit.txt) |
| RED browser | 2 of 2 fail on the baseline when the Estates heading is absent, exit 1. [Log](red-e2e.txt) |
| GREEN unit and browser | 40 of 40 unit cases and 2 of 2 browser cases pass, exit 0. The normalized checkpoint case later moved to the UI test package to honor TypeScript package roots. A test-local type narrowing fix preserved the asserted values. The full unit run includes all 40 cases. [Unit log](green-unit.txt) · [Browser log](green-e2e.txt) |
| Generated golden and fixtures | 59 of 59 generator/fixture cases pass, exit 0. The path diff covers 3 seeds, 5 additions per catalog, 73 byte-identical historical files and 10 new v11 fixtures. Forbidden paths 0. [Generation log](generate-v11-golden.txt) · [Path diff](p7b-path-diff.txt) |
| Existing-file verifier | Exit 0 after rebuilding all 157 proposed hunks in 66 files and checking 11 generated files against the frozen SHA-256 pins. It names each Hall-cap, exact-matcher, helper import and flat-price addition and lists the allowed new test and path-diff files. [Verifier](verify-edit-inventory.mjs) · [Result](edit-inventory-worktree.txt) |

The approved golden SHA-256 is `da4235bdc6e385d5530b90d72adcdb95d148a3602c48912a3a54436332ff4e6b`.

## The seven test locations requiring review

Full precommit `npm test` returned **3,115 passed, 17 failed, 3,132 total**, exit **1**. Package-wide lint and typecheck passed independently. [Full test log](precommit-unit-full.txt) · [Lint](precommit-lint.txt) · [Typecheck](precommit-typecheck-final.txt)

| Existing test file | Failures | Expected and observed |
| --- | ---: | --- |
| `packages/core/src/__tests__/catalog-data.test.ts:20,36` | 1 | The exact typed tuning view lists nine entries. Validation now returns the additional `RING4_TRIAL` and `SOCIETY_RING4_PLOTS` entries. The proposed future correction should assert both additions while retaining every original field. |
| `packages/simulation/src/__tests__/society-renewable-support.test.ts:51,90,118,127,186` | 6 | Two independent Farm cases expected 2 arrivals at population 136 and received 0 with `target-unfunded`. Three cases expected population 102 and received 100. The restart case expected positive arrivals and received 0. |
| `packages/simulation/src/__tests__/order-week.test.ts:114` | 3 | The Authority 29, 50 and 70 cases expected 1 arrival and received 0. |
| `packages/simulation/src/__tests__/authority-refusals.test.ts:43` | 1 | The input expected `liquidity` and now reaches `upkeep-unpaid` first. Preserve an explicit liquidity scenario in the amended tests. |
| `packages/simulation/src/__tests__/society-end-week.test.ts:112` | 1 | Elite Manor=false expected `arrivals` and received `target-unfunded`. |
| `packages/simulation/src/__tests__/craft-week.test.ts:17–29` | 3 | All three 60-week report and whole-city hashes changed. The item hashes remained equal. The full exit log lists the exact previous and observed hashes. |
| `packages/simulation/src/__tests__/items-week.test.ts:135–148` | 2 | Exact 60-week crime, crisis, order and law report hashes changed at seeds 0 and 42. The full exit log lists both previous and observed hashes. Seed 20261028 still passed. |

The two estates add 3,000 Gold milli to operating debit each funded week. The unchanged immigration resolver checks for unpaid upkeep at line 64 and compares recurring income at the target population to operating debit at lines 67–69. More starting cash alone cannot make an underfunded target sustainable. An approved follow-up should preserve positive-arrival and liquidity coverage with funded fixture inputs. It should also pin the new `target-unfunded` outcomes and review report leaf changes before updating the older exact hash pins. No such edits were made in this turn.

## B1.2 status and preview measurements

| Task | Status |
| --- | --- |
| Gate 1 · Git diff --check at final head | Pending |
| Gates 2–3 · lint and typecheck at final head | Pending. Preliminary checks passed |
| Gates 4–5 · architecture check and architecture tests | Pending |
| Gate 6 · unit at final head | Pending. Preliminary unit suite failed |
| Gate 7 · build at final head and served-build hash | Pending. Worktree builds for the browser tests succeeded |
| Full smoke at `CI=1` | Pending. The recorded browser GREEN was the two new cases only |
| City and estate screenshots | PNGs pending. The first preview could not connect because the initial command pointed to the root Vite path. The corrected preview launch was blocked by automatic tool policy. The preview tab was closed |

For the approved worktree build, **JS 145.272 kB**, **CSS 7.528 kB**, **152.800 kB combined gzip**. Main was **150.532 kB** combined. The preview build is **2.268 kB larger** and has **47.200 kB** of headroom to the 200 kB budget. [Measurement script](measure-bundle.mjs) · [Raw results and compressed assets](bundle-artifacts/bundle-raw.json)

The assigned worktree retains the verified product and test changes. No storage was reclaimed. [Worktree status and free ports](hold-git-state.txt)

**Owner action**  
Approve the additional test scope above and the preservation of the positive-arrival and liquidity scenarios in a new binding correction before resuming B1.1.
