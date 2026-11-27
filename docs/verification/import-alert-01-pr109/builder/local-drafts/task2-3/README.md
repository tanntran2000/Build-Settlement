# IMPORT-ALERT-01 · Task 2–3 evidence

| Item | Value |
| --- | --- |
| Branch | fix/import-alert-copy |
| Commit | d1753a41e3c9c8ddcb12b651edc861de30290067 |
| Tree | 17ba075806d8551634e9c3cea18e85b8f72ef59c |
| Base and origin/main at verification | bcd643fcd66a787904989051b08e85e4304608a2 |
| Base tree | 0ac0120539e03a9a1ed2e1ab05ce7dbc63428095 |
| Builder | Codex Sol 6.2 |
| Verification UTC date | 2026-11-27 |

Tân’s decisions are quoted verbatim.

- “Fix import alert”
- “Câu ngắn rõ (Recommended)”
- “Duyệt, giao Builder”

The approved Step 0 packet was verified by SHA-256 before creating the branch. [Accepted byte inventory](C:/Users/Admin/.t3/local-drafts/import-alert-01/byte-inventory.json) · [seed-red-1.txt](C:/Users/Admin/.t3/local-drafts/import-alert-01/task2-3/seed-red-1.txt)

## RED and focused GREEN

- RED on the base product and the proposed spec returned exit 1. The malformed-JSON and edited robbery-card cases both failed at the exact alert assertion. They expected the damaged-file copy and received the old-version copy. The v13, Report, and oversized-file cases passed. [red-1.txt](C:/Users/Admin/.t3/local-drafts/import-alert-01/task2-3/red-1.txt)
- Focused GREEN returned exit 0 with 104 passing Chromium cases across the new spec, the robbery spec, the navigation spec, and the storage spec. The new cases exercise exact alert text and compare the live export and local checkpoint before and after refusal where export is available. [green-1.txt](C:/Users/Admin/.t3/local-drafts/import-alert-01/task2-3/green-1.txt)
- The six committed blobs match the accepted byte inventory. The commit log records the staged path audit and verifies the final parent, tree, and clean checkout. [commit-1.txt](C:/Users/Admin/.t3/local-drafts/import-alert-01/task2-3/commit-1.txt)

## Gates on the committed head

| Gate | Command | Exit | UTC start | UTC finish | Elapsed seconds |
| --- | --- | ---: | --- | --- | ---: |
| 1 | git diff --check origin/main...HEAD | 0 | 2026-11-27T15:28:24+00:00 | 2026-11-27T15:28:24+00:00 | 0.041 |
| 2 | npm run lint | 0 | 2026-11-27T15:28:24+00:00 | 2026-11-27T15:28:37+00:00 | 12.669 |
| 3 | npm run typecheck | 0 | 2026-11-27T15:28:37+00:00 | 2026-11-27T15:29:11+00:00 | 33.697 |
| 4 | npm run check:architecture | 0 | 2026-11-27T15:29:11+00:00 | 2026-11-27T15:29:18+00:00 | 7.033 |
| 5 | npm run test:architecture | 0 | 2026-11-27T15:29:18+00:00 | 2026-11-27T15:30:14+00:00 | 56.043 |
| 6 | npm test | 0 | 2026-11-27T15:30:14+00:00 | 2026-11-27T15:31:33+00:00 | 79.729 |
| 7 | npm run build | 0 | 2026-11-27T15:31:33+00:00 | 2026-11-27T15:32:00+00:00 | 26.194 |
| Full smoke | CI=1 npm run test:smoke | 0 | 2026-11-27T15:32:32+00:00 | 2026-11-27T16:11:28+00:00 | 2336.249 |

The unit suite passed 3,419 tests. Full Chromium smoke passed 435 tests. All gates were run on the same head. The smoke command used an output directory inside this evidence package to preserve existing Playwright artifacts. [gates-1.txt](C:/Users/Admin/.t3/local-drafts/import-alert-01/task2-3/gates-1.txt)

The host load was sampled before the gate sequence and again before smoke. Each window has six aggregate CPU samples at five-second intervals. Both preview ports were free.

| Window | Mean CPU | Peak CPU | Port listeners |
| --- | ---: | ---: | ---: |
| before gates | 3.88% | 10.22% | 0 |
| before full smoke | 4.31% | 7.24% | 0 |

## Remote and checksums

The push verified that origin refs/heads/fix/import-alert-copy resolves to d1753a41e3c9c8ddcb12b651edc861de30290067. [push-1.txt](C:/Users/Admin/.t3/local-drafts/import-alert-01/task2-3/push-1.txt)

The assigned worktree is retained on fix/import-alert-copy with a clean Git status. No storage was reclaimed. [SHA256SUMS.txt](C:/Users/Admin/.t3/local-drafts/import-alert-01/task2-3/SHA256SUMS.txt)
