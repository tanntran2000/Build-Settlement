# P7-B PR B3 — Correction 16 Builder HOLD

**HOLD at candidate typecheck.** Two candidate typechecks failed with TS2345 in the acquisition ID parser. The returned key inferred an auction slot as `string | number`. The seeded-name helper accepts `number | 'lot'`. The held candidate is archived as a forward- and reverse-checked patch.

- Reviewed HEAD `8aa7dc4cefbc759ce2a7d158937011c3afe71549`, tree `a44d6bcd31a26f3519a39f5b71e481045a2b9318`.
- Branch `feat/p7b-acquisition-market`. Git status empty. Ports 4173 and 4174 free.
- Fetched main `b184357d235d164478584e36b96d063551124e66`. Initial fetch and two retries could not connect to GitHub on port 443. The third retry succeeded.
- Builder Codex. Preflight, candidate and recovery logs carry their own UTC timestamps and exit codes. Correction 16 has no candidate commit.

Owner (Tân), verbatim “Sửa cả 4 (Recommended)” and “Ghi sổ rủi ro, không chặn B3 (Recommended)”.

[Binding plan](../../binding-plan-6f83a48.md) · [Astra round 2](../../astra-review/astra-round2.md) · [Successful fetch](fetch-4.txt) · [Clean checkout proof](final-worktree.txt)

## RED and candidate GREEN

| Finding | RED at the reviewed head | Candidate result |
| --- | --- | --- |
| R2-1 | JSON and store rows accepted a missing paused group and an empty sentinel with its current-week recruit still owned. | Both reject either edit, including the sentinel. |
| R2-2 | Both readers accepted source and purchase-week edits after rollover, with either an active market or the empty sentinel. | Both refuse all four edits. |
| R2-3 | Both readers accepted a seed-correct extra departure implying 101 opening residents. | Both refuse it with the current roster and admissions intact. |
| R2-4 | The legal seed-42 Guild build succeeded, but world serialization and `LOAD_TRIAL` both refused the result. | Both accept the built city. World JSON restores the identical state and `LOAD_TRIAL` rebases the revision. |

[RED, 8 expected failures](red-round2.txt) · [Focused candidate, 24 passing tests](green-round2.txt) · [Final candidate, 3,263 passing unit tests](candidate-unit-recheck.txt)

The first candidate unit run exposed seven synthetic-fixture incompatibilities. Current-week Guild fixtures now carry retained offers; arbitrary equipment IDs remain synthetic; the market-free large roster starts after the last seeded purchase; full-state and report comparisons include the exact seeded household rows. The unit recheck passed with every case retained. The first candidate typecheck and the recheck both reported the same slot type error. [Initial unit run](candidate-unit.txt) · [First typecheck](candidate-types.txt) · [Second typecheck](candidate-types-recheck.txt)

## Byte and path proof

The verifier rechecked the approved 86-path packet with Corrections 12–14 at the reviewed head and reconstructed 30 exact byte spans across the ten paths of the held candidate, with zero extra paths. The path-diff check passed for 3 golden seeds, 93 historical fixtures, and 10 v13 siblings. Ruleset stays `tile-society-13` and the candidate has no save-shape change.

The held patch was reverse-checked on the candidate. After restoration Git showed a stale stat for one file whose raw content already matched HEAD. The final check verified all ten restored file hashes, clean status, and forward patch applicability.

[Held patch](candidate-held.patch) · [Byte inventory](correction16-byte-inventory.json) · [Verifier log](held-candidate-verifier.txt) · [Path-diff log](candidate-path-diff.txt) · [Archive trace](archived-and-restored.txt)

## Exact-head gates and measurements

All Correction 16 exact-head gates remain pending. The candidate diff check passed and the unit recheck passed; the two candidate typechecks exited 2. Exact-head lint, architecture checks and tests, unit, build, `CI=1` smoke, bundle, IndexedDB/JSON size, and paired timings need a corrected commit.

[Risk register including Correction 15](risk-register.md) · [SHA-256 manifest](SHA256SUMS.txt)

## Resume point

After authorization, reapply the held patch and explicitly type the acquisition key’s return value so the `slot` property retains `number | 'lot'`. Verify the composed candidate before the commit and exact-head gates.
