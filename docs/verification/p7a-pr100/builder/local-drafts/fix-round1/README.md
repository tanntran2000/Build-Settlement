# PR B fix round 1 — verification and performance HOLD

Owner Tân, verbatim: "Remove the extra clone (Recommended)". Binding plan correction 5 at `25b82ac`; [binding copy](C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-25b82ac.md). One local commit, no push/PR creation/merge. The authorized code change is complete; strict cold-tick performance acceptance remains **HOLD** and needs owner/Astra assessment.

| Revision | Value |
|---|---|
| HEAD | `b94d3083dd71722f329b1bf444fa9dec9b0fd309` |
| Tree | `947f604e17427d916e1ef0e21083dbc2f72920b6` |
| Previous head / direct parent | `cf94804876ef2d02835112e06c355314bbcc16cd` |
| Main base | `dac604054d7cbbf14a0a42209a3ff560380f2956` |
| Branch | `feat/p7a-npc-life-week` |
| Git status / ports | Empty; 4173/4174 free |

Commit: `perf(simulation): drop redundant npc clone in weekly life step`, ending `Co-authored-by: Codex <noreply@openai.com>`.

## Exact diff and behavior

Only `packages/simulation/src/npc-life-week.ts:17` changed:

```diff
-  const next = structuredClone(npcs);
+  const next = npcs.map(npc => ({ ...npc, life: structuredClone(npc.life) }));
```

This drops the full NPC-array deep clone. A shallow NPC container plus deep life copy preserves the standalone weekly API's input immutability and detached mutable life data. The weekly step writes life only. The Character Life dispatcher already owns detached character/post records. The existing frozen-input test and nested hobby mutation assertion remain unchanged; no new test was needed. All 497 other tracked raw files are byte-identical to cf94804, including every existing test, golden, fixture, timeout and config. No golden regeneration or hash-pin change.

Before edit: **43/43 tests pass** in npc-life-week.test.ts. After edit: **82/82 pass** across the same 43 cases, Character Life commands and catalog golden scenarios. Simulation typecheck passes. No RED was required for this owner-approved pure perf refactor. `diff.patch`, before/after source snapshots, baseline.json and edit-verification.json capture exact scope.

## Matched profile

[Full profile tables](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/README.md), [raw/statistical summary](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/profile/summary.json), and [change from previous head](C:/Users/Admin/.t3/local-drafts/p7a-prB/fix-round1/previous-head-comparison.json).

Six alternating base/new-head processes, same seed 42 / 100 adult NPCs / 60 END_WEEK ticks / 1 ms CPU sampling. Every raw tick retained, separate ticks 6–60 view. Timing-hook recognition is minimally adapted for the new initializer; all workload/sampling/statistics are unchanged, with exact adapter patches/provenance retained. The raw field lifeCloneMs now measures targeted copy preparation. All initial states match the previous batch, and all new-head final serialized states match the previous head.

New head has **3/180 raw breaches, all at tick 1**, and **0/165 warmed breaches**. Base has 3/180 raw and 1/165 warmed breaches. New − base pooled mean **+3.804 ms**, maximum **+16.611 ms**; warmed mean **+3.217 ms**, maximum **−8.325 ms**. New − previous head pooled mean **−4.058 ms**, maximum **−33.747 ms**; warmed mean **−4.788 ms**, maximum **−64.664 ms**. Direct life-step mean **3.022 → 1.616 ms (−46.5%)**; copy preparation **2.943 → 1.546 ms (−47.5%)**. Different batches/ambient load and the prior outlier limit causal conclusions. The earlier late tail was not reproduced, but strict <50 ms acceptance is not met by all cold ticks. No threshold or warm-up exemption was introduced.

## Exact-head gates and smoke

Start CPU **5%**; CPU/top processes and no competing test/build/review job are recorded before gates. Ports were free. Seven gates ran sequentially at this clean fixed HEAD/tree.

| Gate | Command | Result | Wall time |
|---|---|---|---:|
| 1 | `git diff --check origin/main...HEAD` | PASS, exit 0 | 0.049 s |
| 2 | `npm run lint` | PASS, exit 0 | 20.915 s |
| 3 | `npm run typecheck` | PASS, exit 0 | 40.956 s |
| 4 | `npm run check:architecture` | PASS, exit 0 | 7.076 s |
| 5 | `npm run test:architecture` | PASS, exit 0 | 75.987 s |
| 6 | `npm test` | PASS, exit 0 | 96.690 s |
| 7 | `npm run build` | PASS, exit 0 | 36.182 s |

Same-shell echo records **CI=1** before full smoke. Smoke: **387 passed / 0 skipped**, exit 0, 2825.473 s. Failed smoke: False. On failure every failed case is isolated once and recorded in smoke-isolated-summary.json. On success no isolated rerun is needed. `served-assets.json` checks both HTTP JS entry hashes against fresh gate-7 production bytes and served disk bytes. Regression assets are rebuilt by pretest:smoke. Sleep/resume events for the complete UTC gate/smoke window: **0**, using explicit SystemTime XPath. Final machine snapshot verifies clean status and free ports.

## Bundle and evidence

Production gzip: JS **139.905 kB / 139905 bytes**, CSS **7.152 kB / 7152 bytes**. Previous-head JS **139.893 kB**, CSS **7.152 kB**. Main owner baseline remains JS 139.26 kB / CSS 7.15 kB (rounded). Raw file/gzip bytes/hashes are in bundle-results.json; lossless base64 artifacts and exported raw UTF-8 text accompany the measurement script. Embedded build SHA also changes bundle bytes, so size deltas are measurements, not exact attribution to the expression alone.

All scripts, logs, profile CPU traces and per-tick JSON are local evidence. Playwright outputs remain outside this folder under `C:\Users\Admin\.t3\local-drafts\p7a-prB-local-only\fix-round1` and are listed in LOCAL-ONLY.json. Nested profile and fix manifests, plus the parent top manifest, cover every file except each manifest's own scope. Prior parent README/results/manifest are retained as history. Independent review and docs-branch evidence publication remain Orchestrator responsibilities.
