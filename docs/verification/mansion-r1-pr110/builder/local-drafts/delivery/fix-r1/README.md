# Mansion R1 review fixes

Owner (Tân), verbatim “Duyệt sửa cả 10”.

| Reference | Value |
| --- | --- |
| Branch | `feat/mansion-rooms` |
| Review baseline | `d306f686876aca47bd9f4176a366380aa56fc774` |
| Review baseline tree | `3b69492a313493bee86294be35ec7871550ccaf7` |
| Main base | `8d37d16ca24420987e6b1294257da13bcdefb5a2` |
| Tested and pushed head | `b3d1278ee02e374f1c3cf1eceee48a0dc0fbcbf7` |
| Tested tree | `f3417d01d5176f50a488f1f2564767a15afe19b7` |
| Binding correction 4 | `8e4dbbc04c1c52c2f2d1231bbcdf6c4d2d3598fd` |
| Plan SHA-256 | `39ed9147623dbf810d1f4abeeff1ffc2444a12296b0eed80623a14e002e80d03` |
| Builder and gate runner | Codex (Sol 6.2), 2026-11-28 |
| Review input | [Astra round 1](../../astra-review/astra-round1.md) |

## Finding verification

| Finding | RED at `d306f68` | Fix commit | GREEN |
| --- | --- | --- | --- |
| 1 · Blocked IndexedDB with a v14 Continue | Title warning absent and volatile save said “Saved in this browser.” [Browser RED](red-browser-01-both-assertions.txt) | `046633d` · `b3d1278` | Continue remains available alongside the one-time warning. Save reports session-only storage. [Browser GREEN](green-browser-targeted.txt) |
| 2 · Marker on damaged v14 | Both a missing and a current outer version caused a migration marker write for a damaged nested v14. [Unit RED](red-unit-02-03-04-05-06-07-09.txt) | `046633d` | Both sources give the exact old-version alert and leave the local copy, rows and marker untouched. [Unit GREEN](green-unit-precommit-final.txt) |
| 3 · IndexedDB item row layout | The reader accepted an inline v14 item collection. [Unit RED](red-unit-02-03-04-05-06-07-09.txt) | `b163990` | The reader rejects inline collections at `city:city`. Detached v14 rows rebuild before the upgrade. Portable files load through the file reader. [Unit GREEN](green-unit-precommit-final.txt) |
| 4 · Permanent starter rooms | The v15 file decoder accepted missing and substituted starter rooms. [Unit RED](red-unit-02-03-04-05-06-07-09.txt) | `d927b16` | All four invalid checkpoints return `INVALID_SAVE_STATE`. [Unit GREEN](green-unit-precommit-final.txt) |
| 5 · Master Suite moves in R1 | The shared move rule allowed a loaded Concubine into the Suite. [Unit RED](red-unit-02-03-04-05-06-07-09.txt) | `d927b16` | The shared rule and both commands return `SUITE_ROLE_ONLY`. Command refusals preserve the whole state. [Unit GREEN](green-unit-precommit-final.txt) |
| 6 · Independent catalog schema | A wrong-typed scalar and missing root and nested values passed import. [Unit RED](red-unit-02-03-04-05-06-07-09.txt) | `d927b16` | All three mocked JSON imports fail at the expected field paths. [Unit GREEN](green-unit-precommit-final.txt) |
| 7 · Catalog-derived room and furniture IDs | Adding a room and a bed piece failed at the hard-coded room key list. [Unit RED](red-unit-02-03-04-05-06-07-09.txt) | `d927b16` | The new IDs load from data and the additional bed works. Shipped IDs still pin 8 rooms, 8 roles and 16 pieces. [Unit GREEN](green-unit-precommit-final.txt) |
| 8 · Exact assertions | The source audit found 12 partial assertion sites. [Audit RED](red-08-10.txt) | `d927b16` · `b163990` · `046633d` | The audit found zero partial assertion sites in the affected R1 files. [Exact-head audit](exact-head-scope.txt) |
| 9 · Context-free society validation | The society type guard accepted null Mansion data, invalid rooms and unknown furniture. [Unit RED](red-unit-02-03-04-05-06-07-09.txt) | `d927b16` | The society reader refuses all three. Full readers also check the estate and household occupancy. [Unit GREEN](green-unit-precommit-final.txt) |
| 10 · Missing browser integrations | The source audit found both required cases absent. [Coverage RED](red-08-10.txt) | `b3d1278` | Canonical v14 IndexedDB rows rebuild NPCs, workshop order and ready items without writing over the existing marker. Successful in-game import preserves the local checkpoint and performs no write transaction. [Browser GREEN](green-browser-targeted.txt) |

Finding 10 exposed missing coverage. Both newly registered cases pass against the baseline browser build. An initial baseline run exposed a test fixture error that treated NPC rows as separate from the characters table. After correcting the fixture projection, both baseline browser cases passed. The first run, corrected baseline run, and final GREEN run are retained. [Initial baseline](red-browser-01-baseline-10.txt) · [Corrected baseline](baseline-browser-10.txt) · [Final browser regression run](green-browser-targeted.txt)

The catalog now carries the starter slot, Suite admission policy, v14 placement order, Report access, additional bed behavior and default build selection. The selection still starts on Bedrooms. Browser saves report whether progress is confined to the current session. The injected-store test API still confirms that the supplied store accepted the snapshot. The pre-push scope audit checks all 21 touched paths, every previously approved test and fixture substitution, the serialized golden path diff and SHA-256 literals. The existing digest evidence applies to this head. [Exact-head scope and byte proof](exact-head-scope.txt) · [R1 digest evidence](../digest-changes.md)

## Exact-head checks

| Check | Result |
| --- | --- |
| 1. `git diff --check origin/main...HEAD` | Exit 0 |
| 2. `npm run lint` | Exit 0 |
| 3. `npm run typecheck` | Exit 0. Svelte found zero errors and zero warnings. |
| 4. `npm run check:architecture` | Exit 0 |
| 5. `npm run test:architecture` | 154 passed, exit 0 |
| 6. `npm test` | 3,494 passed across 160 files, exit 0 |
| 7. `npm run build` | Exit 0 |
| `CI=1 npm run test:smoke` | 442 passed, exit 0. One Chromium worker, 40.5 minutes. |

The gate process started on a clean checkout at 4% host CPU with no listeners on 4173 or 4174. It recorded top processes and kept Windows awake through all gates and smoke. [Full exact-head log](R1.5-exact-head.txt) · [Runner](run-r1-gates.ps1)

The final head was pushed by fast-forward and matched the remote branch. The worktree was retained for the Orchestrator. [Pre-push scan](pre-push-scan.txt) · [Push and remote verification](push.txt) · [SHA-256 manifest](SHA256SUMS.txt)
