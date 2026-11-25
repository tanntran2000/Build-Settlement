# P7-B B3.0 Step 0 packet

Review the [HOLD report](STEP0-HOLD.md) and approve the version, save history and additional paths before B3.1 RED. The signed-off baseline for this proposal is `b184357d235d164478584e36b96d063551124e66` and tree `961567de7ef638861a55a42589be203037e123c9`.

| File | Contents |
|---|---|
| [STEP0-HOLD.md](STEP0-HOLD.md) | Owner decisions, exact path index, release and verification plan |
| [source-replacements.json](source-replacements.json) | Full before and after hunks for 60 existing Git blobs, with UTF-8 offsets and EOF metadata |
| [generated-byte-proposals.json](generated-byte-proposals.json) | Complete UTF-8 text and digests for 23 proposed paths |
| [repo-impact.json](repo-impact.json) | Repository-wide baseline source search, retained callers and 93 historical fixture hashes |
| [graph-queries.txt](graph-queries.txt) | Local graph version, dataset hash, queries and exits |
| [SHA256SUMS.txt](SHA256SUMS.txt) | SHA-256s for this packet, including the binding documents |

Each replacement hunk uses zero-based byte offsets in the original Git blob with an exclusive end. Apply hunks from the highest offset down. `baselineLine` and `proposedLine` are one-based. An insertion has zero baseline lines. JSON string escape sequences round-trip to the exact UTF-8 source text. `finalNewline` records presence at EOF. A checkout may autocorrect line endings, so compare or recompose from Git blob bytes.

The external scratch snapshot can be reproduced with [compose-step0.py](compose-step0.py) and its ordered `draft-part-*.py` inputs. It reads the baseline with Git archive and binds installed tooling to the scratch workspace. [verify-step0.py](verify-step0.py) runs no-emit TypeScript, Svelte Check, ESLint, the path proof, Playwright discovery and the scoped unit suites. The first-pass and full-suite logs remain as execution history. The full suite invoked the existing Data Inspector build test in scratch, which exceeded the no-build instruction. The scoped command avoids that test.

The actual repository still points at the detached baseline. Browser execution, screenshots and R-026 timing remain verification work for an approved B3 branch.
