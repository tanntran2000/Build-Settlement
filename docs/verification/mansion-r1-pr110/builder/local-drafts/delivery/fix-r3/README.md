# Mansion R1 round 3 fix evidence

Owner (Tân), verbatim “Sửa thêm 1 vòng nhỏ”.

| Reference | Value |
| --- | --- |
| Branch | `feat/mansion-rooms` |
| Astra round 3 baseline | `b6365646a4f13c0eb21babbcbae953b19400b52b` |
| Review baseline tree | `94f60e007e1c51e3722407e2a70495a3605539c7` |
| Main base | `8d37d16ca24420987e6b1294257da13bcdefb5a2` |
| Tested and pushed head | `02246aaef51ebe45c5c0508fdd3ef09764ed64ef` |
| Tested tree | `7d6ba6d57c74132c2178a6e84b6f0ad8d573efc4` |
| Binding correction 6 | `624c8da51508483ea4683c996aead38b195a2888` |
| Plan SHA-256 | `5ae1eeeded2c429309d6537fb14900ccee5d97a98e538839729232bbe7605648` |
| Builder and gate runner | Codex (Sol 6.2), 2026-11-28 UTC |
| Review input | [Astra round 3](../../astra-review/astra-round3.md) |

## Findings

| Finding | RED at `b6365646` | Fix commit | GREEN |
| --- | --- | --- | --- |
| R3-01 · Unconditional migration guard | Three row sets inserted after an empty preliminary read were preserved but each received a marker. The probes used the ordinary factory, without a caller policy. [Memory RED](red-memory-01.txt) · [Chromium RED](red-chromium-01-02.txt) | `c64d87f` · Chromium probes in `02246aa` | Both adapters consult the same guard under the migration transaction or synchronous memory operation. Each interleaving preserves the original data and marker absence. Chromium recorded zero put, delete or clear operations inside the migration transaction. All three round-2 missing-metadata cases also pass. [Unit GREEN](green-unit-regression.txt) · [Chromium GREEN](green-chromium-regression.txt) |
| R3-02 · Damaged current title checkpoint | With v15 metadata present, city missing and marker removed, the title displayed both the correct alert and “No local checkpoint.” [Chromium RED](red-chromium-01-02.txt) | `02246aa` | The damaged alert appears by itself and Continue is disabled. An empty title still shows the exact existing empty-slot text. The damaged rows survive unchanged. [Chromium GREEN](green-chromium-regression.txt) |

## Existing expectations updated by R3-01

| Tests at baseline | Change required by the shared guard |
| --- | --- |
| `packages/persistence/src/__tests__/game-store.test.ts:14–16,37–40` | An occupied slot preserves its rows without receiving a marker. With writes disabled, an occupied migration returns the exact prior rows and an empty migration still rejects with “Write aborted.” Slot and marker checks remain exact. |
| `packages/ui/src/__tests__/character-life-session.test.ts:312,315,343` | An existing or concurrently inserted slot receives zero writes. The service still returns the newest checkpoint, preserves the original bytes, and preserves a marker written by a competing migration. |
| `tests/e2e/storage.spec.ts:118,176–188` | Previously unmarked occupied slots stay unmarked with zero write operations. In the marker-winner branch, the competitor now migrates into a genuinely empty slot before releasing the held read. The reader then preserves the independently created marker and current rows. The original legacy text, exact loaded state and transactional activity still have assertions. |

The [exact expectation diff](existing-expectations-R3-01.diff) lists the changed bytes. The [scope audit](exact-head-scope.txt) checks all 11 paths, the expectation diff, both prior assertion audits and the golden path comparison. Digest literals and fixtures match the round-two head. [Existing R1 digest evidence](../digest-changes.md)

The round-one and round-two recheck ran 298 focused unit tests and 75 Chromium tests across the Mansion, storage and title specs. It included blocked-storage notices, the volatile Main menu path, slot preservation and detached workshop rows, both incompatible bed pairs and the exact schema diagnostics. The deliberate wrong-diagnostic probe still fails the assertion as expected. [Focused unit log](green-unit-regression.txt) · [Chromium recheck](green-chromium-regression.txt) · [Diagnostic probe](recheck-exact-diagnostic.txt)

## Exact-head gates

| Check | Result |
| --- | --- |
| 1. `git diff --check origin/main...HEAD` | Exit 0 |
| 2. `npm run lint` | Exit 0 |
| 3. `npm run typecheck` | Exit 0. Svelte found zero errors and zero warnings. |
| 4. `npm run check:architecture` | Exit 0 |
| 5. `npm run test:architecture` | 154 passed, exit 0 |
| 6. `npm test` | 3,501 passed across 160 files, exit 0 |
| 7. `npm run build` | Exit 0 |
| `CI=1 npm run test:smoke` | 450 passed, exit 0. One Chromium worker, 41.5 minutes. |

The run started at 3% host CPU with ports 4173 and 4174 free. The runner recorded top processes and kept Windows awake through the full run. [Ordered gate and smoke log](R1.5-exact-head.txt) · [Runner](run-r1-gates.ps1)

The branch advanced by fast-forward. The remote SHA matched the tested head and the worktree remained clean. [Pre-push scan](pre-push-scan.txt) · [Push and remote verification](push.txt) · [SHA-256 manifest](SHA256SUMS.txt)
