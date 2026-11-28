# Mansion R1 round 2 fix evidence

Owner (Tân), verbatim “Duyệt sửa vòng 2”.

| Reference | Value |
| --- | --- |
| Branch | `feat/mansion-rooms` |
| Astra round 2 baseline | `b3d1278ee02e374f1c3cf1eceee48a0dc0fbcbf7` |
| Review baseline tree | `f3417d01d5176f50a488f1f2564767a15afe19b7` |
| Main base | `8d37d16ca24420987e6b1294257da13bcdefb5a2` |
| Tested and pushed head | `b6365646a4f13c0eb21babbcbae953b19400b52b` |
| Tested tree | `94f60e007e1c51e3722407e2a70495a3605539c7` |
| Binding correction 5 | `a32b543ada526696fe9735674784047c95ac1cd6` |
| Plan SHA-256 | `bcbbf13e3ca94aa47d1f6914e946d9c30360ca0c0aa8a6677e2aad69a8a8b8a7` |
| Builder and gate runner | Codex (Sol 6.2), 2026-11-28 UTC |
| Review input | [Astra round 2](../../astra-review/astra-round2.md) |

## Finding verification

| Item | RED at `b3d1278` | Fix commit | GREEN |
| --- | --- | --- | --- |
| R2-01 · Damaged v14 slot preservation | Chromium wrote a marker for all three metadata-missing slots. The archived v13 and valid v15 localStorage backups overwrote the old city. Unit probes also detected writes for an unreadable current slot and a damaged v14 inserted after the preliminary read. [Chromium RED](red-chromium-01-02.txt) · [Unit RED](red-unit-01.txt) | `d1005ee`, regression cases in `84bfd66` | All three Chromium variants preserved every row and localStorage byte and recorded zero migration writes. Continue stayed disabled with the existing old-version message. Current unreadable and interleaved slots pass the unit guards. [Chromium GREEN](green-chromium-r1-r2.txt) · [Exact-head units](exact-head-recheck-units.txt) · [Full smoke](R1.5-exact-head.txt) |
| R2-02 · Session-only Main menu and Quit | Main menu bypassed the warning and Quit returned the close-tab message. The injected fallback reported no volatility. [Chromium RED](red-chromium-01-02.txt) · [Unit RED](red-unit-02-03.txt) | `84bfd66` | Main menu shows the existing session-only message and offers Export before returning to the title. Quit still warns if the last save was volatile. Continue restores the new Bedroom in the same tab and Export reads the current state. Injected fallback reports `volatile: true`. [Chromium GREEN](green-chromium-r1-r2.txt) · [Exact-head units](exact-head-recheck-units.txt) |
| R2-03 · Bed compatibility | The full checkpoint decoder accepted Guest Room / Single Bed and Bedroom / Guest Cot. Each pair gave capacity 2. [Unit RED](red-unit-02-03.txt) | `72290ae` | Both mismatches give base capacity 1, fail the structure guard, and return `INVALID_SAVE_STATE` from the public decoder. Compatible Guest Room / Guest Cot still round-trips with capacity 2. Migration uses the same predicate and the 30-resident fixture still upgrades. [Exact-head units](exact-head-recheck-units.txt) |
| R2-04 · Exact diagnostics | The pre-fix audit found three string-argument error matchers. A corrected mutation probe ran exactly one baseline test and confirmed it accepted the wrong message. [Audit RED](red-audit-04.txt) · [Baseline mutation RED](red-diagnostic-baseline-replay.txt) | `b5fe15a` | All catalog diagnostics compare exact messages. The same mutation fails the exact-message test. The expanded AST audit finds zero partial matcher sites. [Mutation and audit GREEN](green-diagnostic-04.txt) · [Exact-head units](exact-head-recheck-units.txt) |

The first mutation harness invocation matched zero tests. Its output is retained as a harness diagnostic. The corrected probe used the exact baseline assertion bytes and validated that one case ran on each side. The first focused unit run also detected a compatibility issue with the `migrateSlot` call arguments. The final implementation checks the race inside the store while keeping the existing three-argument call. [Initial harness output](red-diagnostic-mutation-04.txt) · [Initial unit run](green-units-r1-r2.txt) · [Exact-head recheck](exact-head-recheck-units.txt)

## Round-one regression recheck

| Prior findings | Re-run coverage |
| --- | --- |
| 1–2 · Blocked storage and v14 no-write load | Exact blocked warning on v14 Continue, truthful manual Save, original outer/nested malformed legacy cases and three missing-metadata browser variants. [Browser run](green-chromium-r1-r2.txt) · [Exact-head units](exact-head-recheck-units.txt) |
| 3–5 · Detached rows, starter rooms and Suite moves | Inline v14 refusal, detached workshop reconstruction, missing/substituted starters, and both loaded-Concubine refusals. [Exact-head units](exact-head-recheck-units.txt) |
| 6–9 · Schema, catalog extension, exact assertions and society guard | All three imported-JSON diagnostics, both original catalog pins and extension behavior, both matcher audits, and context-free Mansion validation. [Exact-head units](exact-head-recheck-units.txt) · [Matcher and scope audit](exact-head-scope.txt) |
| 10 · v14 integrations | The marked IndexedDB slot reconstructed NPCs and order/ready rows. Successful in-game v14 import preserved the existing slot. [Browser run](green-chromium-r1-r2.txt) · [Full smoke](R1.5-exact-head.txt) |

Correction 5 directly changes three previously existing assertions or test flows. The corrupt current-row case expects the damaged message (2A), the known injected fallback checks the explicit volatile result, and the blocked-storage Main menu case acknowledges the new Export prompt before returning to the title. The scope audit compares those two test files to the baseline using only those exact substitutions. Mansion data, fixtures, goldens and digest literals match the round-one head. [Exact-head scope and byte proof](exact-head-scope.txt) · [R1 digest evidence](../digest-changes.md)

## Recovery after the first full smoke

The first exact-head run at `84bfd66` passed gates 1–7 and finished smoke with 423 passes and 23 failures. Four Home Robbery and Purse cases found duplicate save notices in the closed dialog. Eighteen Tile checkpoint cases and one World Session case expected the existing “left unchanged” wording in the in-game Continue alert. Commit `b636564` renders prompt content only while open and retains the local preservation wording alongside the damaged-checkpoint classification. The focused Chromium re-run passed all 32 checks, including every previously failing case, without changing their tests. [First full smoke](R1.5-first-smoke-failed.txt) · [Duplicate notice example](first-smoke-home-robbery-error.md) · [Local alert example](first-smoke-tile-continue-error.md) · [Focused Chromium recovery](green-smoke-regressions.txt)

## Exact-head checks

| Check | Result |
| --- | --- |
| 1. `git diff --check origin/main...HEAD` | Exit 0 |
| 2. `npm run lint` | Exit 0 |
| 3. `npm run typecheck` | Exit 0. Svelte found zero errors and zero warnings. |
| 4. `npm run check:architecture` | Exit 0 |
| 5. `npm run test:architecture` | 154 passed, exit 0 |
| 6. `npm test` | 3,498 passed across 160 files, exit 0 |
| 7. `npm run build` | Exit 0 |
| `CI=1 npm run test:smoke` | 446 passed, exit 0. One Chromium worker, 41.2 minutes. |

The clean-worktree gate run started at 0% CPU with both smoke ports free. The runner captured the top processes and kept Windows awake until the gate process finished. [Full exact-head log](R1.5-exact-head.txt) · [Runner](run-r1-gates.ps1)

The regular push advanced the branch to the tested commit. A separate remote read confirmed the SHA. The worktree was retained for the Orchestrator. [Pre-push scan](pre-push-scan.txt) · [Push and remote verification](push.txt) · [SHA-256 manifest](SHA256SUMS.txt)
