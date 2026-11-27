# Money M2.0 Step 0 packet

[HOLD decision and inventory](STEP0-HOLD.md) · [file index](change-index.md) · [manifest](SHA256SUMS.txt)

Base `f1fac9498f47fc7be8f6498ee3321800e14f2894`, tree `7c8f6cb1b85a2193358bbab86d43f3c7d807cd50`. Approved plan and spec inputs are included. The proposed branch is `feat/money-purse`.

- [Existing files](existing-file-replacements.json) has 39 UTF-8 before/after sets with literal replacement spans and newline metadata.
- [Generated files](generated-byte-proposals.json) has 10 full UTF-8 file proposals.
- [Baseline data](BASELINE-f1fac94.json) and [baseline log](BASELINE-run.txt) record the 0% run at the pinned source.
- [Base source hits](source-scan-base.txt) and [composed source hits](source-scan-proposed.txt) record runtime, test, UI, guard and pin searches.
- [Initial run](scratch-verification-1.txt) and [composed run](scratch-verification-2.txt) record all commands and exit codes. The final composition passed TypeScript, ESLint, 3,361 Vitest unit tests and an explicit strict TypeScript check of script/e2e sources. Browser and build gates belong to the implementation stage.
- [Worktree evidence](base-worktree-check.txt) records HEAD, tree and clean status. Scratch is a Git archive copy at `C:/Users/Admin/.t3/local-drafts/money-prM2-scratch-f1fac94/packet` with copied existing dependencies and local workspace junctions.

JSON strings preserve decoded UTF-8 bytes including line endings. The sealer re-applied recorded spans to archived bytes and compared full SHA-256 values for both file sets. The binding documents and all files in this packet are covered by the manifest. Proposed tuning inputs are provisional and the decisions in the HOLD still require approval.
