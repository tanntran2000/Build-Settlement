# IMPORT-ALERT-01 independent review · round 1

**PASS. P0 0 · P1 0 · P2 0 · P3 0.** The Money M3 round 2 finding is closed. Importing a current checkpoint with an unbacked robbery card now tells the player that the file cannot be loaded and that their game was preserved. Every historical Society fixture from v1 through v13 still takes the old-version branch.

Reviewed by Astra 6.2 on 2026-11-27. The first checkout check, `git rev-parse HEAD 'HEAD^{tree}'`, returned head `d1753a41e3c9c8ddcb12b651edc861de30290067` and tree `17ba075806d8551634e9c3cea18e85b8f72ef59c`, exit 0. The clean branch `fix/import-alert-copy` matches its origin tracking ref. Its sole commit, `fix(ui): import alert for damaged checkpoints`, has parent `bcd643fcd66a787904989051b08e85e4304608a2`, tree `0ac0120539e03a9a1ed2e1ab05ce7dbc63428095`.

## Per-file ledger

| Reviewed path and line | Change and verification |
|---|---|
| `packages/ui/src/TileManagement.svelte:19, 215–220` | Imports the new constant. A decoder failure now selects the alert by error code and returns. An unplayable successful read still returns with the old alert. Only a playable success reaches the existing load call. |
| `packages/ui/src/character-life-session.ts:7` | Adds the adjacent named constant with the exact approved English text, “This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved.” The new copy contains no game name. |
| `tests/e2e/home-robbery.spec.ts:154` | The same in-game upload has 4,001 milli of exposure against 4,000 milli of Money. Only the expected string changes. The exact alert, live session, stored records and stored text assertions still cover the original rejection. |
| `tests/e2e/character-life-navigation.spec.ts:427` | Both age-17 uploads, Player and NPC, reach current-state validation. The exact alert assertion changes its expected text. The profile, open dossier and UI preservation checks still run. |
| `tests/e2e/storage.spec.ts:77, 126` | Both uploads contain the malformed JSON fragment `{`. The first supersedes a pending Continue, the second a pending Save with both completion outcomes. Each alias still feeds exact alert checks before and after releasing the older operation. |
| `tests/e2e/import-alert.spec.ts:11, 31–101` | Five Chromium cases at 1280 × 900 use the real shell alert and whole-string `toHaveText`. The v13 fixture, broken JSON, edited purse, 1,048,577-byte file and Report guard each have an independent expected literal. |

The six paths and +112/−6 diff exactly match the WP and accepted Step 0 packet. I rehashed the base and final Git blobs, reconstructed the five existing files from the approved byte offsets, and compared the new file to the complete proposed text. Four existing expectation lines changed. Every other existing assertion retains its bytes, including title-screen import, Continue and incompatible in-game imports. The patch introduces no partial matcher, skip or timeout and removes no case. The two production files are in the UI package (LAW-02). The title entry at `CharacterLifeApp.svelte:53` and local Continue paths retain their previous copy.

## Classification and preservation

At `TileManagement.svelte:216`, `INCOMPATIBLE_SAVE` retains “This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.” The same literal is used at line 219 if a successful read fails the playability check. The three other errors emitted by the decoder, `INVALID_SAVE`, `INVALID_SAVE_STATE` and `SAVE_TOO_LARGE`, take the damaged-file branch. The Report guard at line 209, file metadata size guard at line 210, superseded-read check at line 213, thrown-read message at line 221 and downstream load messages at lines 181–187 retain their original behavior. In particular, an actual over-limit file is refused before reading its text and still gets “Checkpoint exceeds the 1 MiB limit.”

I ran the checked-out decoder in memory with Node and the workspace TypeScript compiler, exit 0. All 13 historical new-game fixtures returned `INCOMPATIBLE_SAVE`. The untouched v14 control succeeded. The v14 robbery exposure one milli above Money returned `INVALID_SAVE_STATE`, truncated JSON returned `INVALID_SAVE`, and over-limit decoded text returned `SAVE_TOO_LARGE`.

**One kind of damaged current file still reads as old.** Removing `state.city.society` from the accepted v14 control produced `INCOMPATIBLE_SAVE` at `packages/persistence/src/character-life-save.ts:35`. Damage to the format, schema or ruleset identifiers can reach the same classification at lines 29–35. The UI follows the explicitly approved code mapping in these cases. This is a pre-existing classification boundary, outside the requested UI fix.

For LAW-06, all new refusal branches return before session publication and perform no storage write. In the four Planning cases, lines 59–71 compare the raw downloaded UTF-8 text, all IndexedDB rows and the reconstructed main-slot checkpoint text before and after the refusal. The stored baseline must exist. The helpers enumerate all stores and sort the rows before strict comparison (`tests/e2e/storage.helpers.ts:4, 16`).

The Report test first proves the input is disabled, changes only that DOM property, then uploads a valid Planning file through the real change handler. The game remains in Report when the handler checks the phase. The test verifies the exact phase alert, disabled Export, identical revision and Report text, and exact stored rows and checkpoint text. Export is unavailable in Report, so this case uses those live-state observations in place of a second export. That matches the accepted packet and exercises the guard independently of the disabled control.

## Execution evidence

| Evidence | Verified result |
|---|---|
| [RED on the base](../task2-3/red-1.txt) | Only the new spec was present over the clean base product. Exactly the malformed-JSON and edited-card cases failed at line 67, expected damaged and received old. The other three passed. Exit 1. |
| [Focused GREEN](../task2-3/green-1.txt) | All 104 cases across the four affected specs passed, exit 0, with the six proposed files in the working tree before commit. |
| [Committed-head gates and smoke](../task2-3/gates-1.txt) | The log opens and closes with the reviewed head and tree. Diff check, lint, typecheck, architecture check, architecture tests, unit tests and build each exited 0 in order. 3,419/3,419 unit tests passed across 154 files. Unfiltered `CI=1` Chromium smoke passed 435/435, exit 0. |
| Quiet windows | Recomputed from the two sets of six CPU samples in the gate log. Before gates, mean 3.88% and peak 10.22%. Before smoke, mean 4.31% and peak 7.24%. Both meet the 10% mean and 20% peak limits, with zero listeners on the checked ports. |
| [Push log](../task2-3/push-1.txt) | Exit 0. The logged remote branch SHA matches the reviewed commit. |
| [Evidence manifest](../task2-3/SHA256SUMS.txt) | All 133 unique entries matched their SHA-256 digest and covered every other file in the evidence directory. Manifest SHA-256 `0a72b68068979deaf6e8dad5de2de92ae3f7ac1939d14007013f20d8c30dbac1`. |

The binding WP matched its supplied SHA-256 and its Git blob at `a486150`. The Step 0 report, byte inventory, Builder README and manifest matched the supplied hashes. The Orchestrator accepted option A with Tân’s decisions “Fix import alert”, “Câu ngắn rõ (Recommended)” and “Duyệt, giao Builder”.

The suite results above come from the Builder’s logs. My independent checks covered Git identity and scope, byte and evidence integrity, the source paths, direct decoder execution and `git diff --check origin/main...HEAD` (exit 0). The assigned worktree was retained for the branch. Storage reclaimed was 0 bytes.

VERDICT: PASS
