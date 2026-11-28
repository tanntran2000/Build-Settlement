# Mansion R2 PR #111 verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/111 — Mansion staff roles, Comfort, upkeep and room terms.
- **Tested head:** `bded79d6ccd0e4e97c11d3e98f22370485e827fd`, tree `1b9a6b1a892f188400379539a1806c31b90dc0d7`.
- **Base:** `main` `13cf5b165c36872d1ac216e4a8a161b79f3fb7c5`, tree `7d6ba6d57c74132c2178a6e84b6f0ad8d573efc4`. 8 commits, 37 files (+1,466/−100). Ruleset stays `tile-society-15`.
- **Plan:** `docs/superpowers/plans/2026-11-28-mansion-rooms.md` on `docs/mansion-design`, approved `150131e`, R2 corrections 7–10, binding `25aadfe` (SHA-256 `cf493dc60f242ce1424b95267c0a5acab300df82cb97fa89894c9193d9c0d5e9`). **Spec:** `docs/superpowers/specs/2026-11-28-mansion-rooms-design.md` v0.1 (G1 `e18e7ac`).
- **Tester:** Claude (Orchestrator/Tester), 2026-11-28. **Builder:** Codex Sol 6.2 xhigh (T3 thread `mcp:c544949a-6279-4156-955b-ff692198c558`). **Reviewer:** Astra 6.2 high (round 1 `mcp:22f00934-9f18-4469-b709-33fa778b62e0`, round 2 `mcp:16ddc9f8-60d1-45e2-966a-264f0288042d`).

## Results at `bded79d`

| Check | Who | Result |
|---|---|---|
| Gate 1 `git diff --check origin/main...HEAD` | Claude | exit 0 |
| Gate 2 `npm run lint` | Claude | exit 0 |
| Gate 3 `npm run typecheck` | Claude | exit 0 |
| Gate 4 `npm run check:architecture` | Claude | exit 0 |
| Gate 5 `npm run test:architecture` | Claude | exit 0, 154/154 |
| Gate 6 `npm test` | Claude | exit 0, 3,554/3,554 tests, 163 files |
| Gate 7 `npm run build` | Claude | exit 0 |
| `CI=1 npm run test:smoke` | Claude | exit 0, 452/452 first run, 38.9 min |
| Gates 1–7 + full smoke | Builder | exit 0 at the same head; smoke 452/452 (`builder/local-drafts/delivery/fix-r1/R2.5-correction-10-retry.txt`) |
| Independent review | Astra | round 1 `a601047` FAIL (0 P0, 0 P1, 4 P2, 2 P3); **round 2 `bded79d` PASS, 0 findings** |

Claude run: 2026-11-28 16:25:16–17:07:59Z, clean tree, ports 4173/4174 free, CPU 9 % at start, keep-awake on (`claude-tester/quiet-machine-before-bded79d.txt`). No re-run was needed. Claude also ran gates 1–7 and smoke at the round-1 head `a601047`: all exit 0, 154 architecture, 3,548 unit, 452/452 smoke in 38.2 min (`claude-tester/claude-gates-1-7-and-smoke-a601047.txt`).

## Performance (R-026)
- Isolated `runMansionWeek` median 0.0050 ms Normal / 0.0020 ms Easy over 20,000 samples (owner rule ≤ 0.05 ms).
- Paired End Week, 100 NPCs plus a full Mansion, 16 alternating blocks of 24 dispatches per side with a matched A/A control (correction 8 item 3): +1.4620 ms median / +4.9765 ms p95 Normal, +1.7471 ms / +2.9391 ms Easy, above the control (`delivery/fix-r1/perf-exact-head/measurement-summary.json`).
- CPU profile (correction 9): base and head do the same simulation work (116 clone calls with matching payload digests, 400 NPC rows validated, same crime, robbery and crisis branches); Mansion work is about 0.05–0.1 ms; no avoidable R2 overhead found (`delivery/fix-r1/f3-attribution/`). The 128 `.cpuprofile` files stay local (listed below).
- The owner accepted the measured shift for R2 (correction 10, "Chấp nhận, đi tiếp"). R-026 stays open; no threshold changed.

## Review history (AGENTS.md §4)
- Step 0 HOLD → five owner answers → correction 7 `00df6a7`.
- Round 1 → fix round 1 (`2a8da29`, `47996a9`, `bded79d`, correction 8, owner "Duyệt sửa cả 6"). F3 perf HOLD → profile first (correction 9, "Đo nguyên nhân trước") → profile HOLD → accepted (correction 10, "Chấp nhận, đi tiếp").
- Round 2 → PASS.

Existing test bytes changed only by the six approved correction 7 substitutions (`delivery/existing-expectations.diff`, `delivery/fix-r1/correction-7-substitutions.diff`); round-1 fix expectation changes are listed in `delivery/fix-r1/round1-test-expectations.diff`. 124 fixture blobs unchanged; no digest or golden changed. Astra checked each.

## Layout
- `claude-tester/` — gate runner, quiet-machine records, full gate 1–7 + smoke logs at `a601047` and `bded79d`.
- `builder/local-drafts/` — binding plans (corrections 7–10) and spec, Step 0 brief, HOLD and byte inventory (if under 200 KiB), answers, fix briefs, Builder delivery for R2 and fix round 1 (RED/GREEN, gate logs, scope proofs, calibration, perf, their own SHA256SUMS), Builder thread export. `builder/LOCAL-ONLY-ARTIFACTS.txt` lists 148 files kept local (CPU profiles, Playwright traces, files ≥ 200 KiB, the T3 settings backups) by SHA-256, so the nested Builder manifests that name them cannot be re-checked inside git for those entries.
- `review/` — Astra briefs 1–2, verdicts `astra-review/astra-round1.md` and `astra-round2.md`, thread exports.
- `owner-approval-record.md` — every owner decision, verbatim.
- `SHA256SUMS.txt` — every file in this folder except itself.

Open playtest risks carried: R-026, R-028, R-031. Smoke runs on Chromium only.
