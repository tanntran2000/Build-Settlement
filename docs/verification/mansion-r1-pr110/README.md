# Mansion R1 PR #110 verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/110 — Mansion rooms core and the first save upgrade (v14 → v15).
- **Tested head:** `02246aaef51ebe45c5c0508fdd3ef09764ed64ef`, tree `7d6ba6d57c74132c2178a6e84b6f0ad8d573efc4`.
- **Base:** `main` `8d37d16ca24420987e6b1294257da13bcdefb5a2`, tree `17ba075806d8551634e9c3cea18e85b8f72ef59c`. 15 commits, 108 files (+3,329/−276).
- **Plan:** `docs/superpowers/plans/2026-11-28-mansion-rooms.md` on `docs/mansion-design`, approved `150131e`, corrections 1–6, binding `624c8da` (SHA-256 `5ae1eeeded2c429309d6537fb14900ccee5d97a98e538839729232bbe7605648`). **Spec:** `docs/superpowers/specs/2026-11-28-mansion-rooms-design.md` v0.1 (G1 `e18e7ac`).
- **Tester:** Claude (Orchestrator/Tester), 2026-11-28. **Builder:** Codex Sol 6.2 xhigh (T3 thread `mcp:5934f9e4-9a70-4589-a5f5-6a5b67f931fa`). **Reviewer:** Astra 6.2 high (T3 thread `mcp:98be5e79-ee6d-417f-a048-344aab2f88d7`).

## Results at `02246aa`

| Check | Who | Result |
|---|---|---|
| Gate 1 `git diff --check origin/main...HEAD` | Claude | exit 0 |
| Gate 2 `npm run lint` | Claude | exit 0 |
| Gate 3 `npm run typecheck` | Claude | exit 0 |
| Gate 4 `npm run check:architecture` | Claude | exit 0 |
| Gate 5 `npm run test:architecture` | Claude | exit 0, 154/154 |
| Gate 6 `npm test` | Claude | exit 0, 3,501/3,501 tests, 160 files |
| Gate 7 `npm run build` | Claude | exit 0 |
| `CI=1 npm run test:smoke` | Claude | exit 0, 450/450 first run, 39.4 min |
| Gates 1–7 + full smoke | Builder | exit 0 at the same head; smoke 450/450 (`builder/local-drafts/delivery/fix-r3/R1.5-exact-head.txt`) |
| Independent review | Astra | round 1 `d306f68` FAIL (1 P1, 7 P2, 2 P3); round 2 `b3d1278` FAIL (1 P1, 3 P2); round 3 `b636564` FAIL (1 P2, 1 P3); **round 4 `02246aa` PASS, 0 findings** |

Claude run: 2026-11-28 09:18:05–10:01:44Z, clean tree, ports 4173/4174 free, keep-awake on. The six CPU samples before the run were 5–74 % with short spikes; a per-process sample showed no heavy process (top: Defender 2.2 %, Word 2.1 %) (`claude-tester/quiet-machine-before-02246aa.txt`). No re-run was needed.

## Review history (AGENTS.md §4)
- Round 1 → fix round 1 (`d927b16`..`b3d1278`, correction 4, owner "Duyệt sửa cả 10").
- Round 2 → fix round 2 (`b5fe15a`..`b636564`, correction 5, owner "Duyệt sửa vòng 2"). The first Builder smoke at `84bfd66` failed 23 cases; `b636564` fixed them without changing tests (`builder/local-drafts/delivery/fix-r2/README.md`).
- Round 3 → HOLD to the owner; one extra narrow round granted (`c64d87f`, `02246aa`, correction 6, owner "Sửa thêm 1 vòng nhỏ").
- Round 4 → PASS.

Hash literals changed only under plan correction 3 item 2, each with a projection proof (`builder/local-drafts/delivery/digest-changes.md`). Existing expectations changed in fix rounds are listed with the item that requires them (`delivery/fix-r2/README.md`, `delivery/fix-r3/README.md`, `delivery/fix-r3/existing-expectations-R3-01.diff`); Astra checked each.

## Layout
- `claude-tester/` — gate runner, quiet-machine record, full gate 1–7 + smoke log.
- `builder/local-drafts/` — binding plans (every correction) and spec, Step 0 brief, HOLD, answers, fix briefs, Builder delivery for R1 and fix rounds 1–3 (RED/GREEN, gate logs, scope proofs, their own SHA256SUMS), Builder thread export. `builder/LOCAL-ONLY-ARTIFACTS.txt` lists 74 files kept local (Playwright traces, files ≥ 200 KiB, paths over 180 characters, the T3 settings backup) by SHA-256, so the nested Builder manifests that name them cannot be re-checked inside git for those entries.
- `review/` — Astra briefs 1–4, verdicts `astra-review/astra-round1.md`..`astra-round4.md`, thread export.
- `owner-approval-record.md` — every owner decision, verbatim.
- `SHA256SUMS.txt` — every file in this folder except itself.

Open playtest risks carried: R-026, R-028, R-031.
