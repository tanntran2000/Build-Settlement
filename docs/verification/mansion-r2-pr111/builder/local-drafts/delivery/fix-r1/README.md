# Mansion R2 · Astra round 1 fixes

## Correction 10 · Exact-head delivery

Tân, verbatim **"Chấp nhận, đi tiếp"**. This decision accepts the measured End Week shift for R2. [Binding plan at 25aadfe](../../binding-plan-25aadfe.md) has SHA-256 `cf493dc60f242ce1424b95267c0a5acab300df82cb97fa89894c9193d9c0d5e9` and Git blob `caeea9fd9271aebdba3c08a4b430dbf7078d13a1`.

- Branch `feat/mansion-roles`
- Tested head `bded79d6ccd0e4e97c11d3e98f22370485e827fd`
- Tested tree `1b9a6b1a892f188400379539a1806c31b90dc0d7`
- Base `13cf5b165c36872d1ac216e4a8a161b79f3fb7c5`
- Gate operator Codex Builder, 2026-11-28 UTC

| Gate | Command | Exact-head result |
| --- | --- | --- |
| 1. Diff whitespace | `git diff --check origin/main...HEAD` | Exit 0 |
| 2. Lint | `npm run lint` | Exit 0 |
| 3. Typecheck | `npm run typecheck` | Exit 0, Svelte reported 0 errors and 0 warnings |
| 4. Architecture constraints | `npm run check:architecture` | Exit 0 |
| 5. Architecture tests | `npm run test:architecture` | 154 passed, exit 0 |
| 6. Unit tests | `npm test` | 3,554 passed across 163 files, exit 0 |
| 7. Build | `npm run build` | Exit 0 |
| Full Chromium smoke | `CI=1 npm run test:smoke` | 452 passed in 38.7m with one worker, exit 0 |

The [first attempt log](R2.5-correction-10.txt) records 100% startup host CPU. The run was stopped during typecheck and excluded from acceptance. The [retry preflight](quiet-retry-preflight.txt) recorded 6%, 0%, and 4% CPU before launch. The [successful exact-head log](R2.5-correction-10-retry.txt) records 3% startup CPU, top processes, free ports 4173/4174, Windows keep-awake, all command outputs and exit codes, and the same shell setting `CI=1` before smoke.

The [regular push log](correction-10-push.txt) records the remote SHA verification. The repository worktree is clean, and delivery ended at the pushed branch.

**R-026 remains open.** Correction 8 measured Normal **+1.4620 ms median / +4.9765 ms p95** and Easy **+1.7471 ms median / +2.9391 ms p95**. Correction 9's profiled wall medians shifted **+1.660 ms Normal** and **−0.929 ms Easy**, with identical clone payload digests and shared validation counts. The earlier profile and HOLD sections below are the record of those measurements. Correction 10 accepts the measured dispatch shift for R2. The isolated `runMansionWeek` limit stays **≤ 0.05 ms**, with measured medians of **0.0050 ms Normal** and **0.0020 ms Easy**. Later PRs measure against the merged R2 head. [Correction 8 measurements](perf-exact-head/measurement-summary.json) · [Correction 9 profiles and timing summary](f3-attribution/run-first/profile-summary.json).

## Authorization and revisions

Tân, verbatim: **"Duyệt sửa cả 6"**.

- Worktree branch: `feat/mansion-roles`.
- Reviewed starting head: `a60104711b8c764097455519ded20bf1923494c8`, tree `d43f08fa5c58b7262df05dfb5bc2e24a38c69d18`.
- Candidate head: `bded79d6ccd0e4e97c11d3e98f22370485e827fd`, tree `1b9a6b1a892f188400379539a1806c31b90dc0d7`.
- R1 performance base: `13cf5b165c36872d1ac216e4a8a161b79f3fb7c5`, tree `7d6ba6d57c74132c2178a6e84b6f0ad8d573efc4`.
- [Binding plan, Correction 8](../../binding-plan-348e31b.md) SHA-256 `29aaa096e40cc1b7bcd68501ed6c052dedd93dbabfaf355095d0f95a9fb0640d`, Git blob `ac8d65febd92da75b7a11e8806f70d6031aca746`. [Full Astra review](../../astra-review/astra-round1.md).
- Prior Correction 7 owner decisions: "Luôn hiện (Recommended)", "Giữ giảm Combat (Recommended)", "Phòng tự tác dụng (Recommended)", "Gỡ ngay (Recommended)", "Đo đủ 8 vai trò (Recommended)".

## Finding → RED → fix commit → GREEN

| Finding | RED | Fix commit or evidence file | GREEN |
| --- | --- | --- | --- |
| F1 Guard math | [1724 vs 1725 and 3554 vs 3555](F1-red.txt) using valid v15 states and the shipped catalog | `2a8da29653ee2a83bccad53ea608c705ccfacec5` | [64 simulation tests](F1-F2-green.txt). Fit, room and leadership basis points combine in an integer numerator before the final quotient. |
| F2 Imported renewal | [Three failures](F2-red.txt) on a codec round trip with one stored week and a pending renewal | `2a8da29653ee2a83bccad53ea608c705ccfacec5` | [Same 64 simulation tests](F1-F2-green.txt). Eligibility, effects, caps, the existing picker projection and Renew use the same contract-ended predicate. |
| F3 Regression gate | [Old rule clears the old Normal tail](F3-red.txt), failing the regression expectation | [Predeclared rule](f3-rule.mjs), [runner](measure-mansion-week.mjs), [instrumentation](instrument-mansion.mjs), [host wrapper](run-f3.ps1). The tools are evidence files outside the branch. | [New rule rejects the old Normal tail](F3-green-replay.txt). See fresh acceptance below. |
| F4 Room dues | [One combined 0.3 Gold row received instead of the two charges](F4-red.txt) | `2a8da29653ee2a83bccad53ea608c705ccfacec5` | [7 UI unit tests](F4-green.txt). Homes reads the same catalog-derived charges as B1, with room name, level and ID, plus the base building amount, factors and total. |
| F5 Keyboard coverage | [Both widths fail](F5-red-mutation.txt) with transient `tabindex="-1"` on the Role select. [1280 trace](F5-red-1280.zip) and [1600 trace](F5-red-1600.zip). | `47996a9299d33e6691a8949a585b9c53095eea4d` | [2 Chromium tests](F5-green.txt) after restoring the product source byte for byte. Description → Tab → Role → ArrowDown assigns Maid. Reopen → Description → Tab → Role → Home clears it. |
| F6 Money pace | [Separate replay is missing](F6-red.txt) | `bded79d6ccd0e4e97c11d3e98f22370485e827fd` | [Replay](F6-green-retry.txt), [all 240 Good weekly rows](money-pace.json), [six exact results](F6-exact-assertions.txt). The [first attempt](F6-green.txt) exposed the Money runner's required observer. Making it optional supports a plan-only caller. |

F2 proceeded after verifying the sole in-game writer is inside the post-decrement zero-week branch. The ordinary next contract starts after the notice is cleared. The accepted v15 reader can carry a positive stored week alongside a notice. That state is covered without changing the checkpoint shape or rejecting the import. [Source reachability proof](F2-normal-play-reachability.txt).

F6 reproduction from the checkout:

```powershell
node scripts/mansion-calibration.ts "C:/Users/Admin/.t3/local-drafts/mansion-r2/delivery/fix-r1/money-pace.json" --money-pace
```

| Seed | Normal first 15 Money (target W10–15) | Easy first 15 Money (target W5–8) |
| --- | ---: | ---: |
| 2026 | 12 | 6 |
| 2027 | 12 | 6 |
| 2028 | 12 | 6 |

## Expectations and immutable bytes

- **F1** adds exact shipped-data assertions for 1,725 safe Money milli and 3,555 bps. Existing mocked characterization remains in place.
- **F2** adds exact v15 import/export equality, neutral captain/fatal effects (both paid and plain), the existing full refusal and byte-preservation obligation, full household states when a Captain seat is reused, and exact renewed wage and role behavior.
- **F4** removes `{ label: 'Rooms', value: '0 Gold' }` from the starter summary's strict expected array. The new strict two-room breakdown pins the 0.1 and 0.2 Gold line items and 6.3 Gold total.
- **F5** replaces programmatic focus and selection with real keystrokes, adds a preceding-control focus check for each transition, and keeps visibility, exact option text, cap, assigned/cleared values, exports, summary, report and width assertions.
- **F3** adds an external raw-data replay assertion for the old tail and **F6** an external check of the six exact pace results. Both are independent of the existing Money Gold expectations.

[Round test diff](round1-test-expectations.diff), [six approved Correction 7 replacements](correction-7-substitutions.diff), [fixture and allowlist verification](scope.txt).

## Fresh performance and delivery status

**HOLD on F3.** Both difficulties exceed the predeclared matched A/A control. The branch retains the three local fix commits. R-026 awaits Tân's decision. The exact-head gate sequence and push were stopped before execution. [Gate disposition](gates-HOLD.txt).

### Uninstrumented paired dispatch

Each difficulty used 16 alternating AB/BA blocks. Each side of the comparison and its matched A/A control had 24 dispatches per block, 384 per side total. A 24-sample nearest-rank p95 is the 23rd sample in ascending order. Input cloning and result hashing are outside the dispatch timer. The same validated v15 fixture crossed both readers, with 100 named NPCs, 30 Mansion residents, all eight roles, every room type and full furniture slots.

| Difficulty | Pooled metric | Base → candidate (ms) | Candidate shift (ms) | A/A shift (ms) | Effective control bound (ms) | Pass |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Normal | median | 45.8716 → 47.3336 | +1.4620 | +0.1035 | 0.1035 | No |
| Normal | p95 | 72.7386 → 77.7151 | +4.9765 | +0.4625 | 0.4625 | No |
| Easy | median | 43.4713 → 45.2184 | +1.7471 | −0.0295 | 0.0295 | No |
| Easy | p95 | 68.0966 → 71.0357 | +2.9391 | +2.1350 | 2.1350 | No |

The companion 87.5th-percentile block median shifts also exceed their controls (Normal 2.3990 vs 0.8351 ms, Easy 2.3988 vs 1.0258 ms). The block p95 comparisons meet their controls. Both pooled p95 comparisons fail. The isolated medians are **0.0050 ms Normal** and **0.0020 ms Easy** over 20,000 samples each, within **0.05 ms**. Neutral starter dispatch matched the R1 bytes after projecting out the approved transient Mansion report key.

[Measurement summary](perf-exact-head/measurement-summary.json) has all pooled values, individual block metrics, and hashes. [Raw paired samples](perf-exact-head/raw-paired.ndjson), [Normal isolated raw ns](perf-exact-head/normal-isolated-raw-ns.json), [Easy isolated raw ns](perf-exact-head/easy-isolated-raw-ns.json), [host inputs and pre-run hashes](perf-exact-head-environment.txt), and [command output and exits](F3-exact-head.txt) accompany it. Startup CPU was 13%, with both smoke ports free and Windows keep-awake enabled. Pairing was uninstrumented. The paired measurement exited 1 and the separate instrumentation exited 0.

### Full-dispatch instrumentation outside `runMansionWeek`

Medians in ms, 128 recorded samples in each row after warming. Each scenario opens with 100 named NPCs and the full Mansion. The rebuild scenario lets a Hall servant with an unanswered ordinary zero-week renewal leave and observes the closing terms rebuild. Report wrapping is timed after `runMansionWeek`. Instrumented slices are reported separately from the gate.

| Difficulty | Closing path | Opening quote | Early funding | B1 receipt | Report assembly | Closing terms |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Normal | Reuse | 0.0500 | 0.0007 | 0.0004 | 0.0014 | 0.0153 |
| Normal | Rebuild | 0.0414 | 0.0008 | 0.0004 | 0.0012 | 0.0441 |
| Easy | Reuse | 0.0443 | 0.0007 | 0.0004 | 0.0012 | 0.0129 |
| Easy | Rebuild | 0.0470 | 0.0009 | 0.0005 | 0.0012 | 0.0482 |

[Instrumentation summary](perf-exact-head/outside-summary.json) and four `*-outside-raw-ns.json` companions record all samples. These observations time the slices and leave the full-dispatch difference unattributed.

The assigned worktree is clean and retained at the local candidate. The locally tracked remote tip remains `a601047`. The base archive and extracted sources are reproducible and retained at the temporary path in the host log. No storage was reclaimed.

## Correction 9 · F3 CPU attribution

Tân, verbatim: **"Đo nguyên nhân trước"**. [Binding plan, 12e8de8](../../binding-plan-12e8de8.md), SHA-256 `3ee6b7ad78c4f99d94da72486f7b37eabb81504bfc5d07867d23eb5d1b69cedf`, Git blob `63b0d666a12db3a82b1be298bb00a056f4772b4c`.

**HOLD under Correction 9 item 4 (anything else).** Most of the sampled shifts are in existing validation and clone stacks. Their invocation counts and clone payload digests match. The Mansion introduces a small amount of real gameplay work, detailed below, but the profiles do not attribute the prior millisecond-scale dispatch shifts to it or identify an avoidable R2 regression responsible for those shifts. The timing signs and amount of A/A movement vary by difficulty. The F3 acceptance rule and its failed uninstrumented result above remain in force. The local head and tree are still `bded79d6ccd0e4e97c11d3e98f22370485e827fd` and `1b9a6b1a892f188400379539a1806c31b90dc0d7`. No code edit, commit, gate rerun, smoke, remote push, or PR followed attribution.

### Profile method and timings

Inspector sampled at a requested 500 µs interval. For each difficulty, 16 alternating base/head blocks included two matched base cohorts. Each cohort contained 12 dispatches, giving 192 per side per difficulty and 128 retained profiles. Each row used the existing full-Mansion v15 fixture bytes and checked the prior result hash for its revision. Inputs were pre-cloned before the profile started, and outputs were hashed after it stopped. Dispatch stack aggregation excludes samples without `executeCharacterLifeCommand`. GC and other samples are retained separately. Any named frame totals overlap with descendants, and optimizer inlining can move samples between frame names. These profiled measurements supplement the uninstrumented gate.

Quiet-machine log records both smoke ports free, host CPU 6% at startup and 2% after capture and audit, top processes, exact revision/tree, and keep-awake. The source archive is reproducible and remains at the temporary path in the host log. Profile, branch audit, and profile summarization each exited 0.

| Difficulty | Profiled wall ms median base → head | Profiled A/A median shift (ms) | Profiled wall ms p95 base → head | Profiled A/A p95 shift (ms) | Main thread CPU mean shift A/B / A/A (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Normal | 54.920 → 56.580 | +0.271 | 68.192 → 85.146 | +14.265 | +3.422 / +3.208 |
| Easy | 57.025 → 56.095 | +1.518 | 108.549 → 129.507 | −9.654 | −0.583 / −0.083 |

Selected largest function movements from the profile summary, in sampled milliseconds per dispatch. Each pair is **self / inclusive** and each value is candidate minus base.

| Function | Normal Δ self / total | Easy Δ self / total |
| --- | ---: | ---: |
| Node `structuredClone` wrapper | +2.052 / +2.062 | −2.106 / −2.195 |
| `isWorldNpcList` | +0.054 / +12.437 | −0.003 / −2.276 |
| `validNpcList` | +0.524 / +1.722 | −0.118 / −0.544 |
| `isLiveCharacterLifeSessionState` | −0.112 / +2.195 | −0.023 / −0.380 |
| `isDataRecord` | +0.933 / +0.864 | −0.020 / −0.374 |
| `runNpcLifeWeek` | +0.923 / +0.277 | +1.328 / +0.116 |
| `executeWorldNpcCityCommand` | −0.565 / +1.366 | +2.199 / −0.104 |
| `mansionTerms` | +0.030 / +0.046 | +0.049 / +0.084 |
| `runMansionWeek` | +0.008 / +0.008 | +0.006 / +0.006 |

Normal also showed +2.858 ms inclusive under `hasCharacterLifeProfiles`, and Normal's A/A variation included +1.539 ms in `validNpcList` and +1.299 ms in `executeWorldNpcCityCommand`. The large `isWorldNpcList` inclusive shift exceeds the whole-dispatch shift and reflects overlapping stacks and sampled frame attribution. Easy's candidate did not expose a sampled frame for that wrapper even though precise coverage records all four calls. `mansionUpkeepFunded` and `prepareCrimeWeek` were sampled at 0.0066 and 0.0233 ms inclusive on Normal and 0.0035 and 0.0096 ms on Easy. Crime preparation moves the existing draw earlier, so this subtotal is an upper attribution to that code rather than new RNG work.

### Simulation work

| Verified work on both fixtures | Base | Candidate |
| --- | --- | --- |
| Roster validation | 4 list calls, 400 NPC visits | Same |
| Live-session and profile validation | 3 calls each | Same |
| Clones in dispatch | 116 at the same eight call sites with matching per-site payload SHA-256 chains. Aggregate serialized inputs 473,794 bytes Normal and 473,786 Easy | Same |
| NPC life, wages and household | 100 rows in each step, 100 servant contracts advanced, 160,000 milli wages paid, two birthdays, zero exhaustion, recovery, notices and departures | Same |
| City and purse events | One ordinary crime opportunity with no event; home robbery exits before its roll; no crisis card or acquisition arrivals. B1 paid three homes in each difficulty | Same |
| Mansion-specific work | None in the R1 dispatch | One opening quote, 9 room rows, 100 roster checks, 25 active staff, 74 tile checks for early funding, and 30 room lookups on the closing roster. No closing terms rebuild. Five Bedroom residents receive one stress and one affection update each. |

The candidate changes the Authority target from 40 to 47, with both finishing at Authority 47. It charges the Mansion 3,229 milli Gold on Normal and 2,635 on Easy and emits the Mansion report. The only other differing state values are the five pairs of Bedroom stats. Both difficulties preserve the same ordinary branch outcomes on this fixture. The captured output hashes match the earlier result for each revision.

[Profiler script](f3-attribution/profile-end-week.mjs), [execution log](f3-attribution/run-log.txt), [host log](f3-attribution/perf-first-environment.txt), [full function analysis](f3-attribution/run-first/profile-summary.json), [raw dispatch timings](f3-attribution/run-first/dispatch-samples.json) and 128 `.cpuprofile` files in the same run folder. The separate [cold audit log](f3-attribution/cold-audit.txt), [Normal work audit](f3-attribution/cold-audit/normal-work.json) and [Easy work audit](f3-attribution/cold-audit/easy-work.json) contain the exact output differences and clone payload digests. The cold audit folder also contains the four precise-block coverage files. The optional fixed-prefix comparison script failed twice on coverage-text selector matching. Its two logs are retained. The work table above uses the raw completed coverage and digest records directly.

Focused fix-round results are 64 simulation tests, 7 UI unit tests, and 2 Chromium cases. The prior full run (154 architecture, 3,548 unit, 452 smoke) was at `a601047`; full testing at this candidate remains pending F3. [Disposition](f3-attribution/disposition.txt).
