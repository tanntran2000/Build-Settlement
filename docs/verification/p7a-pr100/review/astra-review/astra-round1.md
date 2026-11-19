# Astra independent review: PR #100

UTC: 2026-11-17T16:46:48.534045+00:00
HEAD: cf94804876ef2d02835112e06c355314bbcc16cd
Tree: 3ee007bb2818beddbe87f1dce042b6820e8a2ad2
Base: dac604054d7cbbf14a0a42209a3ff560380f2956

## Verdict and findings

P0: 0; P1: 0; P2: 1; P3: 0. Functional review and approved-byte checks pass. Performance acceptance remains unresolved.

### P2 - Resolve the measured END_WEEK budget violation before claiming B1 complete

Locations: binding-plan-4739ffc.md:22 (Global Constraints performance acceptance); measure-npc-life.mjs:50 (strict full END_WEEK budget assertion); packages/simulation/src/npc-life-week.ts:17 (additional full NPC clone). Evidence: perf-GREEN.json.attempt1 and perf-GREEN.json in the local PR B evidence folder.

The approved criterion is below 50 ms per tick for 100 NPCs over 60 weeks. Attempt 1 actually failed: ticks 1, 2, 3, 7 and 10 took 96.1324, 63.4476, 52.4895, 64.2052 and 52.5892 ms. Attempt 2 passed all 60 ticks with max 40.3991 ms. Both runs retain identical product-source and final-session hashes, independently checked; measured sources match the current worktree. These are precommit measurements (their HEAD field is base dac6040), tied to this implementation through the four source hashes, not measurements executed at the final commit SHA.

This is an acceptance-evidence finding, not proof of a deterministic product slowdown. The PR adds a complete NPC clone every END_WEEK, an additional post map/scan on commands and history allocations. Those can plausibly add allocation/GC cost to the full path. Conversely, no unbounded per-week history growth or new expensive nested search appears in the added code; the early concentration of slow ticks is consistent with startup/runtime variability. Separate life measurements (max 12.3143 ms then 3.3316 ms) are not instrumented within the slow END_WEEK calls and cannot be subtracted from them or exonerate the new code. No matched base timing or in-call trace is supplied here. CPU snapshots and an unchanged successful rerun do not establish the cause.

Resolution: retain both attempts and obtain controlled matched-base/current profiling or in-call timing that resolves the failed full-tick acceptance; alternatively obtain an explicit owner decision about acceptance of this measured variability. Do not alter thresholds or discard first-run samples. No code fix is prescribed without attribution. P2 because this is an explicit B1 acceptance criterion with observed failures; no correctness/data-integrity defect was found.

## Per-file ledger

| Path | Authorization | Assessment |
|---|---|---|
| `packages/simulation/src/npc-life-week.ts` | Task B1 direct product allowlist; weekly step, report type and reusable existing-history append helper | Reviewed within scope |
| `packages/simulation/src/character-life-command.ts` | Task B1 direct product allowlist; post-transition history and post-tile END_WEEK call/report attachment | Reviewed within scope |
| `packages/core/src/trial/items.ts` | Task B1 direct product allowlist; skip exhausted NPC post skills and item traits | Reviewed within scope |
| `packages/core/src/trial/types.ts` | Task B1 direct product allowlist; optional npcLife report property | Reviewed within scope |
| `packages/simulation/src/__tests__/npc-life-week.test.ts` | Task B1 explicit new test path; full acceptance RED matrix below | Reviewed within scope |
| `packages/simulation/src/__tests__/character-life-command.test.ts` | Step 0 approval approved by correction 4 for E01-E02 only | Exact approved bytes |
| `packages/simulation/src/__tests__/society-stock-integrity.test.ts` | Step 0 approval approved by correction 4 for E03-E04 only | Exact approved bytes |
| `tests/e2e/character-life-navigation.helpers.ts` | Step 0 approval approved by correction 4 for E05-E06 only; test helper, no UI product edit | Exact approved bytes |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-5-weeks.json` | B1 fixture clause; Step 0 approval approved by correction 4 for E07 only | Exact approved bytes |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-laws.json` | B1 fixture clause; Step 0 approval approved by correction 4 for E08 only | Exact approved bytes |
| `packages/simulation/src/__tests__/fixtures/catalog-golden.json` | B1 golden clause; Step 0 approval approved by correction 4 for E09 and its W01 formatting delta | Exact approved bytes |
| `packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.ts` | User brief explicitly requires this path-diff script when golden changes | Reviewed within scope |
| `packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.txt` | User brief explicitly requires committed path-diff output when golden changes | Reviewed within scope |

## Reconstruction E01-E09 and W01

Independently applied the authoritative B0-proposed-edits.json byte strings to each saved raw before-file, then compared the entire result to the approved after-file and current working bytes. Verified before/after against base/current Git blobs using only Git checkout CRLF conversion; EOF was preserved and checked, never forced. All six existing test/data paths match. The other three existing product paths have only their allowed B1 implementation changes.

| Edit | File:line | Result |
|---|---|---|
| E01 | `packages/simulation/src/__tests__/character-life-command.test.ts:3` | Exact approved before/after bytes |
| E02 | `packages/simulation/src/__tests__/character-life-command.test.ts:20` | Exact approved before/after bytes |
| E03 | `packages/simulation/src/__tests__/society-stock-integrity.test.ts:2` | Exact approved before/after bytes |
| E04 | `packages/simulation/src/__tests__/society-stock-integrity.test.ts:121` | Exact approved before/after bytes |
| E05 | `tests/e2e/character-life-navigation.helpers.ts:305` | Exact approved before/after bytes |
| E06 | `tests/e2e/character-life-navigation.helpers.ts:467` | Exact approved before/after bytes |
| E07 | `packages/persistence/src/__tests__/fixtures/society-v10/life-5-weeks.json:1` | Exact approved before/after bytes |
| E08 | `packages/persistence/src/__tests__/fixtures/society-v10/life-laws.json:1` | Exact approved before/after bytes |
| E09 | `packages/simulation/src/__tests__/fixtures/catalog-golden.json:1` | Exact approved before/after bytes |
| W01 | `packages/simulation/src/__tests__/fixtures/catalog-golden.json:1` | Exact approved raw after-file; LF and final LF retained |

E07 projects arousal [10,15,10]; E08 [6,9,6]. E09 projects arousal 100 and one birthday at week 41 for each NPC in each seed. All whole files equal the approved projections; no additional assertion, case, matcher, timeout or EOF change. D4 explicitly authorizes excluding only unrendered npcLife from the e2e rendered-field comparison.

## Rules and test assessment

The full new 43-case suite was read. Stress uses P7A_TRIAL +4/-5, AND thresholds at authority/affection 70, post-change exhaustion at 100 and recovery at <=80. Tests exercise 69/70 combinations, 96+4, saturation, 81/80 recovery and still-posted exhaustion. Arousal uses floor(lust/divisor) and clamps. Birthdays use post-tile week modulo 40; wrapper command guards and save/load tests prevent duplicate normal execution. All tunables use P7A_TRIAL; literals 0/100 and 1/2 follow D3.

History increments counters, retains newest 20, keeps NPC order, and records exhaustion/recovery before birthday. Wrapper records successful post transitions by NPC id, including automatic clearing; unchanged/refused commands add no event. Overflow throws before publishing results and tests preserve frozen original inputs. Review Focus 1-4 have direct tests: pre-B false/95 restore, unassignment/rest/recovery, boundaries and save/load birthdays, and 21-event retention.

buildItemWeekContext skips exhausted skills and worn traits without clearing posts or changing Player context. The post-tile life step receives the resulting clock and authority. Report holds stable NPC ids and is attached/frozen only when a list is nonempty. Empty/no-NPC byte equality is covered. No random draw or second clock; NPC health and character.age stay unchanged.

Ruleset remains tile-society-10; no persisted shape, schema, migration or dependency change. No DOM/UI imports in changed product code, no UI product edits, docs/ or .github/ changes. New text is English and names no other game.

## Golden and execution evidence

Executed node packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.ts: exit 0. 42 allowed life leaves (36 golden and 6 fixtures); envelopes and ruleset unchanged; 71 fixtures (63 historical, 8 current) and 11 generator/earlier-evidence blobs unchanged. Script inspection confirms leaf expansion, expected counts, summary equality and protected Git hashes. golden-generation-count.txt records one generator invocation; process count is evidence from the retained record, not provable from final Git bytes alone.

Claude supplied log was inspected: exact HEAD/tree match, gates 1-7 exit 0, 3074/3074 unit tests in 131 files, smoke 387/387 exit 0. No smoke, build, server or performance rerun by reviewer. Builder README honestly retains failed and successful performance attempts. This review does not claim every observed full tick passed.

Read binding plan including correction 4, spec v0.1, STEP0-HOLD, planned paths, repo AGENTS, performance script/raw samples and README. Only review artifacts written outside repository; no product edit, commit, push, GitHub comment or merge. Worktree retained; storage reclaimed 0 bytes. G5 evidence publication remains Orchestrator responsibility.

VERDICT: FAIL
