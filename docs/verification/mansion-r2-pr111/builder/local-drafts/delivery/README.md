# Mansion R2 delivery

## Authorization and tested identity

- Branch: `feat/mansion-roles`
- Base: `13cf5b165c36872d1ac216e4a8a161b79f3fb7c5`, tree `7d6ba6d57c74132c2178a6e84b6f0ad8d573efc4`
- Final head: `a60104711b8c764097455519ded20bf1923494c8`, tree `d43f08fa5c58b7262df05dfb5bc2e24a38c69d18`
- Builder / local gate operator: Codex Sol 6.2, 2026-11-28 UTC
- Binding plan: [00df6a7, Correction 7](../binding-plan-00df6a7.md), SHA-256 `8ab7b6dadd5e7d2ff6a5c67541114ed81a441e8b2963b88ee60031636b6674eb`
- Binding spec: [150131e, v0.1](../binding-spec-150131e.md), SHA-256 `b9c9cdd81e018def94c03cbfc186398df5cb8c25c3e2dd663a0602469d86af76`
- Ruleset: `tile-society-15`. The existing v15 reader and serialized shape were retained.

Owner Tân decisions, verbatim:

> "Thiết kế phòng Mansion"  
> "Duyệt hết"  
> "Chọn A1 + S1"  
> "Ân hạn 8 tuần"  
> "Duyệt G1"  
> "Duyệt, giao R1"  
> "Dot đã merg và xanh"  
> "Giao R2 Step 0"  
> "Luôn hiện (Recommended)"  
> "Giữ giảm Combat (Recommended)"  
> "Phòng tự tác dụng (Recommended)"  
> "Gỡ ngay (Recommended)"  
> "Đo đủ 8 vai trò (Recommended)"

## RED, commit and GREEN by task

| Task | RED at base or previous task head | Commit | GREEN and verification |
| --- | --- | --- | --- |
| R2.1 Assign and clear staff roles, Comfort and one B1 upkeep debit | [R2.1 RED](r2.1-red.txt), 21 failures on R1 | `b21faf9a0bcaefa6ded522e00d565defb49e75bc` | [128 tests, 7 files](r2.1-green-final.txt) and [simulation typecheck](r2.1-types.txt). [Mutation probe](r2.1-diagnostic-mutation.txt) changed “full” to “occupied” and failed all three exact cap-diagnostic assertions. |
| R2.2 Guard, Vault, Throne Room and legacy RNG | [R2.2 RED](r2.2-red.txt), 11 failures and 17 passes at R2.1 | `5c54d4914eb890e2dc433ccbcd37e2f7c70aff05` | [296 focused tests, 9 files](r2.2-green.txt), [3,542 units, 162 files](r2.2-unit.txt), [architecture](r2.2-architecture.txt), and [types](r2.2-types.txt). Crime fixtures and existing craft/item digests passed on original expectations. |
| R2.3 NPC role picker, planning projections and Steward row | [4 UI unit failures](r2.3-unit-red.txt), [2 browser failures on the previous task's actual UI build](r2.3-browser-red-exact.txt), [1280 trace](r2.3-browser-red-1280.zip) and [1600 trace](r2.3-browser-red-1600.zip) | `3329584b334309b9b7d83f0bfc55422f251e6362` | [178 units, 5 files](r2.3-unit-green.txt), [18 focused browser tests](r2.3-browser-green-rebuilt.txt), [Svelte check](r2.3-types.txt). The first browser green attempt used a stale port 4173 app build. An explicit main app rebuild resolved it. The regression pretest builds the separate port 4174 app. |
| R2.4 Calibrate Mansion staff and upkeep | [R2.4 RED](r2.4-red.txt), base Money runner had no Mansion observation for Normal Good week 10 | `79d19faff2e8b2d87f80491b45273bb15ef9c48a` | [54 focused tests, 4 files](r2.4-focused.txt) and [18-cell acceptance](r2.4-acceptance.txt). The [mutation probe](r2.4-diagnostic-mutation.txt) lowered Good W13 Comfort by two and returned exactly `2026/normal/good: good-comfort`. |
| R2.5 Independent review follow-up | [Two v15 save-renewal failures](r2.5-review-red.txt) at R2.4: the expired Accountant blocked the seat and Renew restored the stored role | `a60104711b8c764097455519ded20bf1923494c8` | [63 tests, 4 files](r2.5-review-green.txt). A loaded expired staff role cannot count against the cap or reactivate on renewal. Room and original input bytes are preserved and the role picker shows the effective role. |

The last row is a separate review-fix commit. The preceding four commits retain the plan's task messages. The independent Astra source review verified the exact six existing-test substitutions and identified the save-renewal edge. The Orchestrator and Tester retain their separate review and G5 responsibilities.

## Money and Comfort calibration

The driver used real game commands across seeds **2026, 2027 and 2028** with 40 closed weeks per case, Normal and Easy, and Good, Average and Bad routes. The initial [TRIAL catalog](r2.4-trial-start-data.json) yielded six misses, all for Good net Gold. I changed the staffed Accountant upkeep multiplier from **9,500 → 6,400 bps** and kept the other TRIAL values. A matching room scales that discount to 54%. The first [retune](r2.4-retune-1.json) met all 18 seed/style/difficulty cells across 720 weeks. Bad is assessed using first unpaid weeks per the Money plan Correction 3. The literal zero-Gold diagnostic remained null across Bad cases.

| Seed | Difficulty | Good net Gold | Good gross Gold | Average net Gold | Bad first unpaid week |
| --- | --- | ---: | ---: | ---: | ---: |
| 2026 | normal | 4.3220 | 26.2201 | -0.8599 | 9 |
| 2026 | easy | 9.7734 | 28.0101 | 2.9642 | 18 |
| 2027 | normal | 4.3220 | 26.2201 | -0.8599 | 9 |
| 2027 | easy | 9.7734 | 28.0101 | 2.9642 | 19 |
| 2028 | normal | 4.3220 | 26.2201 | 0.1401 | 9 |
| 2028 | easy | 9.7734 | 28.0101 | 3.9642 | 18 |

Good opened the Maids’ Quarters week 8 and all room types week 30. Average opened quarters week 16 and followed the staged half-pace route. Both difficulties had 0 Comfort-short Good weeks from W13–40 and 0 Comfort-short Average weeks from W20–40. Gold values in the table are per week per 100 population over W20–40. The raw weekly data and command traces accompany the acceptance and mutation results above. The [exact-head replay](r2.5-calibration.json) [reproduced the accepted bytes](r2.5-calibration-bytes.txt) and [passed the acceptance checks](r2.5-calibration-acceptance.txt).

## Performance

| Difficulty | End Week median base → head (ms) | Median paired block delta (ms) | End Week pooled p95 base → head (ms) | Isolated median (ms) | Early quote median (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| normal | 48.2758 → 50.6006 | +3.3089 | 82.7091 → 128.2242 | 0.0024 | 0.0110 |
| easy | 45.1039 → 45.3112 | +1.0363 | 63.3076 → 49.5187 | 0.0021 | 0.0079 |

The full-Mansion benchmark used all eight role types, all eight room types across nine rooms, every furniture slot, and 30 residents out of 100 named NPCs. Base and candidate deserialized the same v15 fixture. Each difficulty used eight alternating A/B and B/A blocks of eight End Weeks and an A/A control on the same machine, plus 20,000 warmed isolated `runMansionWeek` samples. The fixture and raw artifacts are under [perf-final-head](perf-final-head/measurement-summary.json), with [commands and host samples](perf-final-head-environment.txt). Both paired median shifts were within the observed A/A control variation. Normal pooled p95 rose, and the median block p95 shift was +2.1882 ms versus an A/A p95 shift span of −46.0816 to +59.5233 ms. The largest Normal paired p95 shift exceeded the largest A/A p95 shift. R-026 remains open.

Earlier measurements at the R2.4 tree are retained in [first complete run](perf-retry/measurement-summary.json) and [replicate](perf-replicate/measurement-summary.json). The first complete Easy run had a high pooled head p95 of 158.7459 ms and the replicate's Easy p95 was 70.8887 ms. The [initial tool failure](perf-first-load-failure.txt) ended before sample collection because a historical type-only import was retained by the transpiler. The measurement harness then used the M3 transpiler behavior. The raw per-block samples retain all timings.

## Exact-head gates and branch delivery

| Gate | Exact-head result |
| --- | --- |
| 1. Diff whitespace | Exit 0 |
| 2. Lint | Exit 0 |
| 3. Typecheck | Exit 0. Svelte reported 0 errors and 0 warnings. |
| 4. Architecture rules | Exit 0. No violations, cycles, or scanner errors. |
| 5. Architecture tests | 154 passed, exit 0 |
| 6. Unit tests | 3,548 passed across 163 files, exit 0 |
| 7. Build | Exit 0. Main UI JS and CSS total 195,525 gzip bytes. |
| Full `CI=1` Chromium smoke | 452 passed in 40.0m with 1 worker, exit 0 |

The [full gate log](R2.5-first.txt) records timestamps, commands, output and exit codes. Ports 4173 and 4174 were unbound at startup. It records 18% initial CPU and the top processes, Windows keep-awake for the full run, and `CI=1` set in the same shell before smoke. The Vite build reported its standard large minified chunk warning. The [gzip measurement](r2.5-bundle.txt) verifies the UI against the 200,000-byte gzip budget.

The [scope check](r2.5-scope.txt) verified 37 changed paths, the six approved substitutions, and all 124 preserved fixture blobs. [Push and remote verification](push.txt) confirmed the same SHA at `origin/feat/mansion-roles` and a clean local checkout.

The worktree was retained for the Orchestrator and Tester. No storage was reclaimed. The reproducible performance base archives are referenced in the separate environment logs. No pull request or merge was performed.

## Existing test, golden and fixture bytes

The [Step 0 inventory](../STEP0-byte-inventory.json) enumerates all six approved substitutions. The [scope verifier](verify-scope.mjs) reconstructs the four changed files from the base Git blobs using only those substitutions, then compares the full buffers to HEAD. It also compares all 124 fixture Git blob IDs against Step 0 and checks changed paths against the allowlist. All hash, digest and golden pins retained their literal bytes. The normalized starter-Mansion result matches R1 byte for byte after removing the one approved transient report key in both difficulties. No hash was replaced.

The two test-title changes identify the new report field. The three unit projections gain the exact five-field Mansion report. The browser helper adds the exact Steward row parser over the existing deep report equality assertion. The diff of the approved replacements follows.

```diff
diff --git a/packages/simulation/src/__tests__/character-life-command.test.ts b/packages/simulation/src/__tests__/character-life-command.test.ts
index 62ab643..3a2ced0 100644
--- a/packages/simulation/src/__tests__/character-life-command.test.ts
+++ b/packages/simulation/src/__tests__/character-life-command.test.ts
@@ -54,5 +54,5 @@ function legacy(s: CharacterLifeSessionState, raw: Record<string, unknown>): Cha
     if (recruited) next.city.society!.acquisition = emptyAcquisition();
     const household = { ...emptyHouseholdReport(), bought: recruited ? s.npcs.map(npc => npc.character.name) : [], wagesPaidMilli };
-    return { ...r, next, report: { ...r.report, before: { ...r.report.before, gold: beforeGold }, household, purse: { levyPercent: 0, levyDueMilli: 0, levyPaidMilli: 0, donationsMilli: 0, donationGoldMilli: 0, moneyAfterMilli: 0 } } };
+    return { ...r, next, report: { ...r.report, before: { ...r.report.before, gold: beforeGold }, household, mansion: { comfortSupply: 0, comfortNeed: 0, upkeepMilli: 2000, upkeepPaid: true, authority: 0 }, purse: { levyPercent: 0, levyDueMilli: 0, levyPaidMilli: 0, donationsMilli: 0, donationGoldMilli: 0, moneyAfterMilli: 0 } } };
   }
   return { ...r, next };
diff --git a/packages/simulation/src/__tests__/npc-acquisition.test.ts b/packages/simulation/src/__tests__/npc-acquisition.test.ts
index 3e17cad..6133d26 100644
--- a/packages/simulation/src/__tests__/npc-acquisition.test.ts
+++ b/packages/simulation/src/__tests__/npc-acquisition.test.ts
@@ -108,10 +108,10 @@ describe('P7-B weekly acquisition', () => {
   });
 
-  it('keeps an empty no-market report byte-identical to the city week plus purse', () => {
+  it('keeps an empty no-market report byte-identical to the city week plus Mansion and purse', () => {
     const s = town(), raw = { type: 'END_WEEK', expectedRevision: s.city.revision, expectedWeek: 1 };
     const baseline = executeWorldNpcCityCommand({ city: s.city, outside: s.outside, npcs: s.npcs }, raw, buildItemWeekContext(s));
     expect(baseline.success).toBe(true); if (!baseline.success) throw Error(baseline.error.message);
     const result = succeeded(s, 'END_WEEK', { expectedWeek: 1 });
-    expect(JSON.stringify(result.report)).toBe(JSON.stringify({ ...baseline.report, purse: { levyPercent: 0, levyDueMilli: 0, levyPaidMilli: 0, donationsMilli: 0, donationGoldMilli: 0, moneyAfterMilli: 0 } }));
+    expect(JSON.stringify(result.report)).toBe(JSON.stringify({ ...baseline.report, mansion: { comfortSupply: 0, comfortNeed: 0, upkeepMilli: 2000, upkeepPaid: true, authority: 0 }, purse: { levyPercent: 0, levyDueMilli: 0, levyPaidMilli: 0, donationsMilli: 0, donationGoldMilli: 0, moneyAfterMilli: 0 } }));
     expect(Object.hasOwn(result.report!, 'household')).toBe(false);
   });
diff --git a/packages/simulation/src/__tests__/npc-life-week.test.ts b/packages/simulation/src/__tests__/npc-life-week.test.ts
index c0a6505..0828f9e 100644
--- a/packages/simulation/src/__tests__/npc-life-week.test.ts
+++ b/packages/simulation/src/__tests__/npc-life-week.test.ts
@@ -214,5 +214,5 @@ describe('item context and Character Life integration', () => {
     const r = end(s); expect(r.next.npcs[0].life.arousal).toBe(3); expect(Object.hasOwn(r.report!, 'npcLife')).toBe(false);
   });
-  it('keeps every no-NPC result byte-identical to the delegated path plus purse', () => {
+  it('keeps every no-NPC result byte-identical to the delegated path plus Mansion and purse', () => {
     const made = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' });
     if (!made.success) throw Error(made.error.message);
@@ -225,5 +225,5 @@ describe('item context and Character Life integration', () => {
     expect(old.success).toBe(true); if (!old.success) throw Error(old.error.message);
     const expected = { ...old, next: { ...old.next, player: structuredClone(s.player), profiles: [] },
-      report: { ...old.report, purse: { levyPercent: 0, levyDueMilli: 0, levyPaidMilli: 0, donationsMilli: 0, donationGoldMilli: 0, moneyAfterMilli: 0 } } };
+      report: { ...old.report, mansion: { comfortSupply: 0, comfortNeed: 0, upkeepMilli: 2000, upkeepPaid: true, authority: 0 }, purse: { levyPercent: 0, levyDueMilli: 0, levyPaidMilli: 0, donationsMilli: 0, donationGoldMilli: 0, moneyAfterMilli: 0 } } };
     const actual = executeCharacterLifeCommand(s, raw);
     expect(JSON.stringify(actual)).toBe(JSON.stringify(expected)); expect(run([]).report).toEqual(empty);
diff --git a/tests/e2e/character-life-navigation.helpers.ts b/tests/e2e/character-life-navigation.helpers.ts
index 5b047d6..b0259e1 100644
--- a/tests/e2e/character-life-navigation.helpers.ts
+++ b/tests/e2e/character-life-navigation.helpers.ts
@@ -617,4 +617,18 @@ export async function expectReport(
     expect(levy[5] ? milli(levy[5]) : 0).toBe(shortfall);
   } else await expect(purse).toHaveCount(0);
+  const mansion = panel.locator('[data-letter="steward"] .letter-rows dt:text-is("Mansion") + dd');
+  await expect(mansion).toHaveCount(expected.mansion ? 1 : 0);
+  if (expected.mansion) {
+    const value = (await mansion.textContent()) ?? '';
+    const parts = /^Comfort ([\d,]+) \/ ([\d,]+) · Upkeep ([\d,.]+) Gold (paid|unpaid) · Authority \+([\d,]+)$/.exec(value);
+    if (!parts) throw Error('Invalid Mansion row: ' + value);
+    actual.mansion = {
+      comfortSupply: Number(parts[1].replaceAll(',', '')),
+      comfortNeed: Number(parts[2].replaceAll(',', '')),
+      upkeepMilli: milli(parts[3]),
+      upkeepPaid: parts[4] === 'paid',
+      authority: Number(parts[5].replaceAll(',', '')),
+    };
+  }
   const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;
   expect(actual).toEqual(baseReport);
```
