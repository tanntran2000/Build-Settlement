# Claude Tester runner (how the exact-head logs were produced)

The Claude Tester gate and smoke logs in this folder were produced by the two scripts committed next to this file. Each was run from Git Bash on the Tester's Windows machine, with its output redirected to the log file.

| Script | SHA-256 (as run) | Last modified (local, +07:00) | Used for |
|---|---|---|---|
| `run-gates.sh` | `d6a545db063ad1d90300b7c8c830522f13c5443221f9939e382060a092c9622d` | 2026-11-11 10:14:28 | gates 1–7 **and** the full smoke |
| `run-gates-1-7.sh` | `1243ecb5bd51779cf261e78af72bef9d0e370ad170b091d49f86d595caa6e5ad` | 2026-11-12 18:58:03 | gates 1–7 only |

## `CI=1` for the full smoke
`run-gates.sh` runs gates 1–7 and then does `export CI=1` before `run npm run test:smoke`. Its `run` helper echoes only the command (`npm run test:smoke`), not the environment, so the log header does not show `CI=1`. The script does set it.

## The exact-head run at `1ad295b`
- Invocation: `bash run-gates.sh > tester-gates-smoke-1ad295b.txt 2>&1`
- `run-gates.sh` was last modified on 2026-11-11, before this run (UTC 2026-11-13T02:27:22Z to 03:18:43Z, as printed in the log). The SHA-256 above is the file's hash today.
- The log `tester-gates-smoke-1ad295b.txt` is the original raw output, unchanged. Its SHA-256 is `8293856b47b80099f61c4af6a1ab4ec36248fc707bef3f7c29ef75289bd5efb3`, the same as the source file outside the repo.

The same `run-gates.sh` produced `tester-gates-smoke-c1faf87.txt`. The `tester-gates-1-7-*.txt` logs come from `run-gates-1-7.sh` and contain no smoke.
