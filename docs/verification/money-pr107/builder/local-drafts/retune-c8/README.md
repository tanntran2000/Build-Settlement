# Money M2.1 retune approval packet

- [Retune HOLD](RETUNE-HOLD.md)
- [All seed and levy outcomes as CSV](calibration-table.csv) and [JSON](calibration-table.json)
- [Round 1 raw run](round-1.json) and [round 1 data](round-1-tuning.json)
- [Round 2 raw run](round-2.json) and [round 2 data](round-2-tuning.json)
- [Exact proposed tuning bytes](proposed-tuning-bytes.json), [changed expectations](changed-test-expectations.json), [Correction 8 delta](changes-from-step0-bytes.json), [all M2.1 bytes](m21-byte-inventory.json)
- [Worktree status](worktree-status.txt) and [candidate file SHA-256](working-tree-sha256.json)
- [SHA-256 manifest](SHA256SUMS.txt)

Base `f1fac9498f47fc7be8f6498ee3321800e14f2894` and tree `7c8f6cb1b85a2193358bbab86d43f3c7d807cd50`. Candidate is uncommitted on `feat/money-purse`. The data and expectation inventories preserve the line endings and EOF in JSON strings. Both raw calibration commands logged source hashes and their SHA-verified runner is identical. Only the candidate tuning file changed between measurement runs. Both 0% traces match all pre-existing fields of the M1 baseline exactly. The calculation script in the worktree is `scripts/money-calibration.ts`; [summary producer](summarize-m21.py) normalizes the two endpoints required by Correction 8.
