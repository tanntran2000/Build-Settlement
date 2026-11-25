# P7-B PR B3 — Correction 17 Builder HOLD

**HOLD under the scope rule.** The approved annotation cleared TS2345 in the acquisition ID parser. Typecheck advanced into the simulation workspace and stopped with three TS2339 diagnostics at `packages/simulation/src/__tests__/character-life-command.test.ts:38,42`. The retained-purchase fixture reads `r.report`, while TypeScript inferred the result variant that exposes only `success` and `next`. A fixture type edit requires separate approval.

- Reviewed HEAD `8aa7dc4cefbc759ce2a7d158937011c3afe71549`, tree `a44d6bcd31a26f3519a39f5b71e481045a2b9318`.
- Branch `feat/p7b-acquisition-market`, reviewed worktree status empty, ports 4173 and 4174 free.
- Local `origin/main` `b184357d235d164478584e36b96d063551124e66`, matching the successful Correction 16 fetch.
- Correction 17 has no candidate commit. Logs carry UTC timestamps, tested HEAD and tree, command, and exit code.

Owner (Tân), verbatim “Duyệt sửa kiểu + fixture (Recommended)”.

[Binding Correction 17](../../binding-plan-98fccdf.md) · [Typecheck log](candidate-typecheck.txt) · [Final worktree proof](final-worktree.txt)

## RED and candidate GREEN

| Finding | RED at the reviewed head | Correction 17 runtime result |
| --- | --- | --- |
| R2-1 | JSON and store rows accepted both a missing paused group and an empty sentinel with a current-week recruit. | Both reject both variants. |
| R2-2 | Both readers accepted source and purchase-week edits after rollover, with an active market or empty sentinel. | Both reject all four variants. |
| R2-3 | Both readers accepted an extra departure implying 101 opening residents. | Both reject the checkpoint. |
| R2-4 | World serialization and `LOAD_TRIAL` refused a legal Guild build. | The original world state round-trips through JSON and `LOAD_TRIAL` succeeds with a rebased revision. |

All 8 RED cases reproduced at `8aa7dc4` in Correction 16. All 8 passed on the recovered and annotated candidate. The full candidate unit suite passed all 3,263 cases. [Baseline RED](red-baseline.txt) · [Correction 17 focused GREEN](green-round2.txt) · [Candidate unit log](candidate-unit.txt)

## Bytes and recovery

The verifier checked the 86-path approved baseline with Corrections 12–14. The held patch reapplied byte-exact across all ten files and 30 Correction 16 byte spans. Correction 17 inserted 85 UTF-8 bytes at zero-based offset 2802 of `packages/core/src/trial/acquisition-replay.ts`:

```ts
: { boughtWeek: number; source: AcquisitionSource; slot: number | 'lot' } | undefined
```

The parser continues to select the literal `'lot'` or convert the numeric slot explicitly. The verifier found zero extra paths. The fixture hashes matched the approved candidate. The path-diff proof passed for 3 golden seeds, 93 historical fixtures, and 10 v13 siblings.

The archived patch contains the exact Correction 16 candidate plus the Correction 17 annotation. Reverse applicability was checked before restoring all ten original file hashes. Forward applicability and clean status were checked after restoration.

[Recovery log](reapply-held-bytes.txt) · [Type byte inventory](correction17-type-inventory.json) · [Composed candidate verifier](held-candidate-verifier.txt) · [Held patch](candidate-held.patch) · [Archive log](archived-and-restored.txt) · [Path diff](candidate-path-diff.txt)

## Verification status

| Check | Status |
| --- | --- |
| Candidate diff check and runtime tests | Passed |
| Candidate typecheck | Exit 2 in the parity fixture |
| Exact-head gates 1–7 and `CI=1` smoke | Pending a corrected commit |
| Bundle, IndexedDB/JSON largest save, paired deltas and noise | Pending a corrected commit |

## Resume point

With a fresh approval, reapply the archived candidate and annotate the fixture result as the existing `delegates.WorldNpcCityResult` type. It accommodates both branches and exposes the optional report. This is a proposed fixture-only annotation. The archived patch preserves the approved fixture bytes and assertions.

[Risk register](risk-register.md) · [SHA-256 manifest](SHA256SUMS.txt)
