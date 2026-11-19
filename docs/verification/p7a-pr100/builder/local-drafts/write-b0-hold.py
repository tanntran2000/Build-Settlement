"""Build the complete Step 0 review package from read-only scan/proposal artifacts."""
from pathlib import Path
import hashlib
import json

OUT = Path(__file__).resolve().parent
ROOT = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
BASE = 'dac604054d7cbbf14a0a42209a3ff560380f2956'
edits = json.loads((OUT / 'B0-proposed-edits.json').read_text(encoding='utf-8'))
files = json.loads((OUT / 'B0-proposed-files.json').read_text(encoding='utf-8'))
inventory = json.loads((OUT / 'B0-byte-inventory.json').read_text(encoding='utf-8'))
base_info = {row['path']: row for row in inventory['files']}
planned = [
    ('packages/simulation/src/npc-life-week.ts', 'new', 'Task B1 direct product allowlist; weekly step, report type and reusable existing-history append helper'),
    ('packages/simulation/src/character-life-command.ts', 'existing', 'Task B1 direct product allowlist; post-transition history and post-tile END_WEEK call/report attachment'),
    ('packages/core/src/trial/items.ts', 'existing', 'Task B1 direct product allowlist; skip exhausted NPC post skills and item traits'),
    ('packages/core/src/trial/types.ts', 'existing', 'Task B1 direct product allowlist; optional npcLife report property'),
    ('packages/simulation/src/__tests__/npc-life-week.test.ts', 'new', 'Task B1 explicit new test path; full acceptance RED matrix below'),
    ('packages/simulation/src/__tests__/character-life-command.test.ts', 'existing', 'Step 0 approval requested for E01-E02 only'),
    ('packages/simulation/src/__tests__/society-stock-integrity.test.ts', 'existing', 'Step 0 approval requested for E03-E04 only'),
    ('tests/e2e/character-life-navigation.helpers.ts', 'existing', 'Step 0 approval requested for E05-E06 only; test helper, no UI product edit'),
    ('packages/persistence/src/__tests__/fixtures/society-v10/life-5-weeks.json', 'existing', 'B1 fixture clause; Step 0 approval requested for E07 only'),
    ('packages/persistence/src/__tests__/fixtures/society-v10/life-laws.json', 'existing', 'B1 fixture clause; Step 0 approval requested for E08 only'),
    ('packages/simulation/src/__tests__/fixtures/catalog-golden.json', 'existing', 'B1 golden clause; Step 0 approval requested for E09 and its W01 formatting delta'),
    ('packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.ts', 'new', 'User brief explicitly requires this path-diff script when golden changes'),
    ('packages/simulation/src/__tests__/fixtures/p7a-week-path-diff.txt', 'new', 'User brief explicitly requires committed path-diff output when golden changes'),
]
(OUT / 'B0-planned-paths.json').write_bytes((json.dumps([{'path':p,'status':s,'authorization':a} for p,s,a in planned],indent=2)+'\n').encode('utf-8'))

def link(path, label=None):
    return f'[{label or Path(path).name}]({str(path).replace(chr(92), "/")})'


lines = [
    '# PR B Step 0 — HOLD before RED or product edits',
    '',
    'Owner Tân, 2026-11-17, verbatim: "Giao Builder B".',
    '',
    f'**Status: B0 inventory complete; HOLD for the owner.** Base/HEAD `{BASE}`, tree `d2f31706d77d308a310b61857a8b293a898280e7`, branch `feat/p7a-npc-life-week`. No product file, existing test or fixture was edited. No test, build, fixture generator or golden generator was run. All after-text below is a proposal in local drafts.',
    '',
    '## Owner decisions requested together',
    '',
    '1. **D1 — Approve the exact inventory (recommended):** E01–E09, W01, the 13 paths below, and the sole new acceptance-test path. No other existing-test edit, whitespace change or EOF change is approved by this proposal.',
    '2. **D2 — Approve the weekly clock/history convention (recommended):** call the weekly step with `week = next.city.world.week` and `authority = next.city.society!.order.authority`, both after the tile week. Evaluate exhaustion/recovery after the Stress update. Record actual post transitions in the Character Life wrapper by comparing input/output `postTileId` after successful delegation, including automatic clears after replacement; a no-op or refusal records no event. All events and report ID arrays keep NPC order. Report arrays contain stable NPC IDs. No extra persisted tracking field and no `character.age` or NPC health mutation.',
    '3. **D3 — Resolve the numeric-source conflict (recommended):** keep 0/100 as fixed LAW-04 stat-schema bounds, exhaustion at the fixed stat maximum, and 1/2 as event-count/halving arithmetic. Every tunable value (4, 5, 70, 70, 80, 10, 40, 20) comes from `P7A_TRIAL`. Do not add catalog fields or couple Stress to `sexExpCaps.novice`. If literal “all values from P7A_TRIAL” includes schema/arithmetic constants, do not proceed: the data file, validator and catalog-pin scope must first be revised by the owner.',
    '4. **D4 — Approve report/UI staging (recommended):** E05–E06 compare every existing rendered report field and exclude only the new optional, unrendered `npcLife` metadata until PR C. The existing exact-equality assertion and all other rendered assertions remain. New simulation tests assert the complete `npcLife` payload, omission rule and frozen report contract. No UI product file changes.',
    '',
    '## Preflight and exact authority',
    '',
    f'- `git fetch origin` exited 0. `origin/main` is exactly `{BASE}`; its tree matches the owner-provided PR A merge tree.',
    '- Before branching: clean status and free ports 4173/4174. Created only `feat/p7a-npc-life-week` in the assigned worktree. No clone, worktree, dependency install or cleanup.',
    '- `feat/p7a-npc-life-data` is unchanged at `56124513aef2d85de128fe76bf3001654290c1c0`.',
    '- Read the approved plan/spec/AGENTS fully. The task brief supplies the new PR B base; the plan/spec historical base remains the earlier PR A context. Plan corrections 1–3 are retained. In particular, the E54 EOF newline in `packages/core/src/trial/__tests__/society.test.ts:107` is protected byte-for-byte.',
    '- No `.codegraph/` exists. Memory list/status/search/coverage reports this worktree unindexed; no index was created. Direct tracked source reads/searches supply the evidence. Other worktree indexes were not used.',
    '',
    'The scan covers **494 tracked files, 493 UTF-8 text files, 1,648 matching lines in 257 files**, including unit/e2e tests, fixture data, pins, generators, docs, CI and tools. Git status has no untracked source. Dependency/build/trace outputs are not authored tracked source and are excluded. The full matched text and byte/EOF hashes are retained in `B0-all-matches.json` and `B0-byte-inventory.json`.',
    '',
    '## Conflicts and conventions requiring the HOLD',
    '',
    '- **C1 / D3:** the brief requires all values from `P7A_TRIAL`, but `packages/core/src/data/npc-life.json:54–78` contains no named stat bounds or exhaustion threshold. Lines 64–71 provide all listed rates/thresholds/caps except fixed 0/100. `sexExpCaps.novice` at line 73 is an unrelated limit. The plan Global Constraints (“all numbers TRIAL”) and the brief therefore need the explicit D3 interpretation before implementation. Otherwise new data/validator/pin edits fall outside this inventory.',
    '- **D2:** plan line 49 says “after the tile week” but does not specify which clock is passed. `tile-trial-week.ts:115` increments the clock; line 138 labels the report with the prior resolved week. Starter `birthWeek = 1 - age*40` (`npc-life.ts:42`). Passing the post-tile clock gives one birthday at 41 across the 60-week golden, rather than tagging the initial week 1. The exact proposed data below depends on this explicit choice.',
    '- **D2 history:** plan line 54 asks for post-assigned/cleared history, while `runNpcLifeWeek(npcs, {week,authority})` has no previous-post input. `world-npc.ts:27–29,53` changes/clears posts before the wrapper sees the next state. Comparing the two states in the already-allowed Character Life wrapper records those actual transitions without a new state key, migration, or edits to `world-npc.ts`.',
    '- **D4:** plan line 57 adds optional report metadata and PR C owns rendering. The existing e2e parser at `character-life-navigation.helpers.ts:467–468` compares all remaining expected keys to rendered fields. Calendar tests at `character-life-navigation.spec.ts:265–297` cross the birthday boundary. The narrow projection adjustment is required to keep B within the approved no-UI scope.',
    '',
    '## Existing-file transformations — full exact after-text',
    '',
    'The authoritative machine-readable list is '+link(OUT/'B0-proposed-edits.json')+'. It contains the complete before/after text, not an abbreviated diff. Full before/after file copies are linked below; the worktree originals remain untouched. All line numbers refer to the pinned base.',
    '',
]
for edit in edits:
    lines += [f"### {edit['id']} — `{edit['file']}:{edit['line']}`", '', edit['reason'], '']
    if edit['id'] not in ('E07','E08','E09'):
        lines += ['Before:', '```ts', edit['beforeText'].replace('\r\n','\n'), '```', 'After:', '```ts', edit['afterText'].replace('\r\n','\n'), '```', '']
    else:
        file = next(row for row in files if row['file']==edit['file'])
        lines += ['Exact whole-file before: '+link(file['beforeCopy'])+'. Exact whole-file after: '+link(file['afterCopy'])+'.', '']
        if edit['id']=='E07':
            lines += ['Line 1, `state.npcs.[0,1,2].life.arousal`: `[0,0,0] → [10,15,10]`. All other JSON values and the no-EOF-newline encoding are identical.', '']
        elif edit['id']=='E08':
            lines += ['Line 1, `state.npcs.[0,1,2].life.arousal`: `[0,0,0] → [6,9,6]`. All other JSON values and the no-EOF-newline encoding are identical.', '']
        else:
            lines += ['Golden session strings are at lines **8, 16, 24** for seeds **0, 42, 20261028**. For each of the three NPCs per seed: `life.arousal: 0 → 100`; `life.history.counters: {} → {"birthday":1}`; `life.history.recent: [] → [{"week":41,"kind":"birthday"}]`. The 36 exact changed leaves are listed in `B0-projected-data-paths.json`. Outer scenario metrics and save envelopes are identical. W01 below is also part of this full after-file.', '']
lines += ['## Whitespace and EOF inventory', '',
          '**W01 (inside E09):** `catalog-golden.json` has 26 CRLF line endings in this checkout. The existing generator writes 26 LF endings and one final LF. EOF remains present, changing from CRLF (2 bytes) to LF (1 byte). No other existing-file normalization, trailing-space change, BOM change or EOF addition/removal is proposed.', '',
          '| Existing file | Before → after line endings | EOF before → after |', '|---|---|---|']
for row in files:
    style_before = f"CRLF {row['beforeCrLf']}, lone LF {row['beforeLoneLf']}"
    style_after = f"CRLF {row['afterCrLf']}, lone LF {row['afterLoneLf']}"
    lines += [f"| `{row['file']}` | {style_before} → {style_after} | {row['beforeTrailingNewlineBytes']} → {row['afterTrailingNewlineBytes']} newline bytes |"]
lines += ['', 'Added source lines retain their file’s existing CRLF/LF style. All four new tracked files will use UTF-8 without BOM and exactly one final LF. Existing product files retain their baseline styles and EOF status. Every other tracked file is protected by the full byte inventory, including the PR A E54 newline.', '',
          '## Complete planned path set and allowlist accounting', '',
          'There are **13 planned paths: 9 existing and 4 new**. The four product paths are within the direct PR B allowlist/Task B1 Files line. The three existing test sources need this Step 0 approval. The three data artifacts plus two new diff artifacts are not in the four-file product list; they are requested explicitly under Task B1’s fixture/golden clause and the brief’s path-diff requirement. There is no additional out-of-allowlist product path under the recommended decisions.', '',
          '| Path | Status / authority |', '|---|---|']
for path,status,why in planned:
    lines.append(f'| `{path}` | {status}; {why} |')
lines += ['', '## Golden / fixture path contract', '',
          '- Mutable data set, exactly: `catalog-golden.json`, `society-v10/life-5-weeks.json`, `society-v10/life-laws.json`. Projected semantic changes: **42 leaves**, all under `npcs.*.life.*` (36 golden, 6 fixture). The full list is in '+link(OUT/'B0-projected-data-paths.json')+'.',
          '- Golden will be regenerated **once**, after RED and product implementation, with the existing unchanged `fixtures/make-catalog-golden.ts` and environment flag. Only the two changing fixtures will use their existing generators. No generation has happened in B0; these files are independent projections for owner approval.',
          '- The new `p7a-week-path-diff.ts/.txt` will verify the allowed state whitelist (`npcs.*.life.*`, and report fields under `npcLife` if present), unchanged envelopes/ruleset 10, unchanged outer golden metrics, and protected fixture/generator hashes. Any other semantic path or unexpected generated byte is a new HOLD.',
          '- All **63 v1–v9 historical fixtures** and the other **8 v10 fixtures** are protected unchanged. New-game tile/life, pre-week crime, Demand and Rebellion inputs do not run a life week before serialization. The serialized `TileTrialState` has no report member (`types.ts:22–29`); the optional transient report property is not a checkpoint shape change. Existing history counters/events already accept the new kinds; **no ruleset bump or migration** is proposed.',
          '- `SOCIETY_TRIAL`, `NPC_ORIGINS`, `NPC_HOBBIES`, `P7A_TRIAL`, `SOCIETY_RULESET`, all catalog pins, and `craft-week.test.ts:13–15` report/item/city hashes remain unchanged. Its no-order scenario calls `runTileTrialWeek` directly with no NPCs. Existing PR A and earlier path-diff scripts/output stay unchanged.',
          '', '## Reviewed consumers that require no source edit', '',
          '| Consumer / assertion | Why the existing after-text stays identical |', '|---|---|',
          '| `catalog-golden.test.ts:5–12,26` | Reads the changed data and compares the complete generated scenario. Keep equality, metrics, mutation check and existing 20 s timeout. |',
          '| `crisis-fixtures.test.ts:6–11`; `law-fixture.test.ts:29–37` | Existing byte equality consumes regenerated fixture files; no assertion or test source change is needed. |',
          '| `society-new-game-fixture.test.ts:6–35`; `npc-life-records.test.ts:54–77`; persistence save tests | New-game bytes stay fixed; v10 schema, old-save refusal, strict life validation and stored-byte protection stay unchanged. Recovery across save/load is added to the new simulation suite. |',
          '| `world-npc.test.ts:125–130` | This lower-level NPC-world command path intentionally does not call Character Life’s new weekly step. Its NPC equality remains exact. |',
          '| `items.test.ts:28–33`; `item-effects.test.ts:123–153`; `craft-week.test.ts:19–34` | Existing fixtures have working NPCs or no NPCs. New exhausted context coverage is added in the new simulation suite. |',
          '| `lord-health.test.ts:73–84`; `society-renewable-support.test.ts:160`; crime/crisis tests | NPC health is untouched and existing assertions remain. Existing owner-approved 15 s limits stay unchanged; no new timeout. |',
          '| `character-life-observation.test.ts:42–85,304–338`; UI report-letter tests | The observation/letter models explicitly project existing UI fields. Optional backend metadata does not add a rendered key in PR B. |',
          '| `character-life-boundary.spec.ts:263–270,296–303`; `world-session.spec.ts:43–44` and shared e2e helpers | Expected sessions come from the real Character Life dispatcher, so moving life values are included automatically. Only the central report parser needs E05–E06. |',
          '| UI workshop forecast tests and character/profile tests | Their active-NPC fixtures and current UI output remain unchanged. New exhausted-NPC presentation/report rows belong to PR C; no UI product edits are requested. |',
          '', 'The complete scan artifacts retain every matched file:line, including unchanged literal pins and fixture references, so later verification can reject any additional existing-test modification.', '',
          '## Full B1 RED list to write/run after approval, before product edits', '',
          'Only new test source: `packages/simulation/src/__tests__/npc-life-week.test.ts`. The acceptance matrix below is a test contract, not a claim that tests have run.', '',
          '| Family | RED cases |', '|---|---|',
          '| Stress and halving | Unposted 0 floors at 0; rest subtracts 5; posted +4; 96+4 reaches 100; 99+4 clamps; Authority/affection combinations 69/69,69/70,70/69,70/70; both ≥70 halves with floor; disabled-but-assigned remains posted. |',
          '| Exhaustion and context | true→false reports/increments once; already exhausted produces no repeated event; post retained; false posted gives no skill or worn-trait effect while Player context stays; resting false 86→81 stays false and 85→80 resumes; reassign after recovery restores effect next week. |',
          '| Arousal / ageing | Lust 9/10 flooring, normal increments and saturation at 100; immutable lustBase/mind/beauty/sexExp/health; birthday boundary below/at/after; post-tile year 40→41 integration; derived age/title at 29→30 and 49→50; frozen input unchanged. |',
          '| History | actual assignment, clear, auto-clear after REPLACE; no duplicate event for same-post or already-unassigned; rejected actions append nothing; simultaneous events keep defined order; 21 events retain newest 20 and counters continue; counter overflow fails atomically. |',
          '| Save/report/determinism | v10 saved false/95 loads and recovers only after reaching ≤80; unassign exhausted then rest next week; birthday once across save/load and normal command guards; NPC-order report IDs; empty optional report omitted; no-NPC full result bytes identical; existing report freeze maintained; equal inputs give equal results and no uncontrolled RNG. |',
          '| Performance | A valid 100-adult-NPC session over 60 End Weeks; a separate quiet-machine measurement script records every raw per-tick duration and checks max <50 ms, plus weekly-step-only timing. The RED script first fails on the missing new API. No per-test timeout is introduced. |',
          '', 'The RED command set will include the new suite, the three affected test-source/consumer suites, the golden/changed-fixture consumers, item-context/health/world-session persistence checks and the perf script. All named RED cases/scripts precede the first product edit. Tests whose contract is unchanged may pass in RED; the newly specified behavior must fail for the intended reason.', '',
          '## Handoff boundary', '',
          'B0 is complete as an inventory; PR B is **not implemented**. No RED/GREEN, performance result, gate PASS, new commit, golden regeneration or smoke result is claimed. Evidence stays in local drafts; no `docs/` file is on the product branch. No push, PR or merge. Ports stay free and the PR A branch stays unchanged.', '',
          'The task explicitly requires: “Then HOLD once with the full list; the owner decides. Do not edit any existing test before that answer.” D1–D4 are pending. An unrelated queued message does not release this HOLD.', '',
          '**Next owner action:** approve D1–D4 as written, or identify the item to revise. Do not start B1 until that answer.', '']
(OUT / 'STEP0-HOLD.md').write_bytes(('\n'.join(lines)).encode('utf-8'))
readme = f'''# P7-A PR B — Step 0 evidence

**B0 HOLD — owner approval pending.** Base/HEAD `{BASE}`, tree `d2f31706d77d308a310b61857a8b293a898280e7`, branch `feat/p7a-npc-life-week`. Owner Tân: "Giao Builder B".

Read [STEP0-HOLD.md]({str(OUT/'STEP0-HOLD.md').replace(chr(92),'/')}) for the full exact inventory and D1–D4. Nothing in the product worktree was edited, and no RED test/build/generator was run.

- `B0-fetch.txt` / `B0-preflight.json`: fetch, pinned main, branch creation, clean status, free ports, unchanged PR A branch.
- `B0-byte-inventory.json` / `B0-all-matches.json`: all 494 tracked files, 493 text files, 1648 matched lines; raw byte hashes, BOM, line endings and EOF status.
- `B0-proposed-edits.json` / `B0-proposed-files.json` / `proposals/`: nine exact transformations across three test sources and three data artifacts, including whole before/after bytes. Proposals are outside the worktree.
- `B0-planned-paths.json` / `B0-projected-data-paths.json`: 13 planned paths, 42 projected allowed life leaves; no extra persistence shape, catalog pin or city hash change.
- `verify-step0.py` / `B0-verification.json` / `SHA256SUMS.txt`: read-only preflight/proposal integrity, unchanged source and final byte coverage. B1/B2 evidence is pending approval and execution.

All after-values are predicted from the approved rules and proposed D2 clock convention. No golden or fixture has been regenerated. The existing generator is reserved for B1, once. The fixed-bound numeric source issue is explicitly pending D3; no hidden data/validator extension is proposed.
'''
(OUT / 'README.md').write_bytes(readme.encode('utf-8'))
(OUT / 'progress.md').write_bytes(('''# SDD ledger — plan: C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-a770dc0.md

Task B0: branch from exact merged main; full binding documents and AGENTS read; no subagents, new worktree, clone, dependencies, product/test edits or test run.
Pre-flight: PR A supplies NpcLife/P7A_TRIAL; PR B consumes them. Optional reports remain transient, and existing history fields suffice. D2 clock/post-event convention, D3 fixed-schema numeric interpretation and D4 UI projection await explicit owner approval with the exact D1 edit list.
Task B0: inventory complete; HOLD. Nine transformations, three existing test sources, three data artifacts, 13 planned paths, 42 projected life leaves, explicit W01 and all other EOF bytes preserved.
Task B1: not started. Full RED matrix pending B0 approval.
Task B2: not started.
User scope controls over skill defaults: no subagents; independent Astra review is orchestrated separately; preserve all local evidence and use the assigned evidence directory, with no product docs or extra worktree.
''').encode('utf-8'))
print(json.dumps({'holdReport':str(OUT/'STEP0-HOLD.md'),'transformations':len(edits),'plannedPaths':len(planned),'scanFiles':inventory['trackedFiles'],'matchedLines':inventory['matchedLines']},indent=2))
