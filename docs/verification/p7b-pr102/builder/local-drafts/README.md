# P7-B B1 evidence

Open the [Correction 6 Builder evidence](builder-b1/correction-6/README.md). At `7e1aca45e35be17772ff770c3a4595c8213b0d3b`, both approved review fixes are verified. The seven gates passed and the full `CI=1` smoke passed 407/407. The byte comparison found zero golden or fixture changes from `ced2f88`.

[Correction 6 SHA256SUMS](builder-b1/correction-6/SHA256SUMS.txt) · [Full evidence SHA256SUMS](SHA256SUMS.txt)

## Correction 5 archive

Open the [Correction 5 Builder evidence](builder-b1/correction-5/README.md). At `ced2f88a67daffb8f9fe01fff67f966e82474fc1`, all seven gates passed and the full `CI=1` smoke passed 407/407. All 56 cases that failed after Correction 4 now pass.

[Mansion screenshot](builder-b1/correction-5/mansion-panel-1280x900.png) · [Correction 5 SHA256SUMS](builder-b1/correction-5/SHA256SUMS.txt) · [Full evidence SHA256SUMS](SHA256SUMS.txt)

## Correction 4 archive

Open the [Correction 4 Builder HOLD](builder-b1/HOLD-after-correction-4.md) for the final Builder result. All seven gates passed at `8fd333807147d07e21695d4f156f917d5c1379d2`. The full `CI=1` smoke finished with 351 passed and 56 failed. The same report reconstruction difference reproduced in all 56 isolated reruns.

[Both screenshots and bundle](builder-b1/HOLD-after-correction-4.md#owner-screenshots-and-bundle) · [Full evidence SHA256SUMS](SHA256SUMS.txt) · [Builder SHA256SUMS](builder-b1/SHA256SUMS.txt)

## Step 0 archive

Open [STEP0-HOLD.md](STEP0-HOLD.md) for the proposed edits, owner decisions and the B1.1 RED list.

| File | Contents |
| --- | --- |
| [source-replacements.json](source-replacements.json) | 157 exact hunks over 66 existing source and test files. Each hunk carries its baseline line range, Git and checkout before/after text, and approval status. |
| [generated-byte-proposals.json](generated-byte-proposals.json) | Full before/after strings and SHA-256 for the three-seed golden and ten proposed v11 fixture files. The v10 originals remain baseline inputs. |
| [generated-path-diff.json](generated-path-diff.json) and [preflight-probes.json](preflight-probes.json) | Exact projected leaf changes, catalog hashes, event checks and selected upkeep calculations. |
| [repository-scan.json](repository-scan.json) | 502 tracked paths, 424 targeted line matches and the unchanged historical fixture census. |
| [SHA256SUMS.txt](SHA256SUMS.txt) | SHA-256 over every file in this handoff directory other than the manifest itself, including both binding documents. |

The working commit is `952985c4fafaffeee44a4eb8932c178858659a40`. Its tree `a0ea6329441e75df363b356052528f1426233281` matches the pinned `27f4dc2` base. Apply source line ranges from bottom to top when reading the proposals. The JSON escape sequences describe literal indentation and line endings.

The read-only projection reproduces the baseline golden and evaluates equivalent startup data for the proposed economy. It supplies bytes for review. B1.1 implementation, RED execution and fixture generation remain pending the owner’s Step 0 approval. The seven quality gates and full smoke are part of B1.2.

[B1 Builder HOLD](builder-b1/README.md) records the blockers found after Correction 1.

[B1 HOLD after Correction 2](builder-b1/HOLD-after-correction-2.md) records the 17 precommit regressions and the current worktree evidence.

[B1 HOLD after Correction 3](builder-b1/HOLD-after-correction-3.md) records the current results and the proposed fixes for the five locked files.
