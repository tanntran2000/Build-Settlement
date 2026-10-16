# Supported Lint & Historical Markdown Format Implementation Plan — v1.0

> **For agentic workers:** Use `superpowers:executing-plans` task-by-task. Antigravity is the only Builder; Codex reviews and the independent Tester verifies. Do not spawn additional writers. Steps use checkbox syntax; no commit/push/merge in this work packet.

**Goal:** Replace EOL ESLint with a supported compatible release and clear the remaining 372 saved-file Markdown diagnostics without changing game code, design/spec content or historical decisions.

**Architecture:** Change one installed lint tool version, retaining the already compatible parser/plugin and six safety rules. Apply only enumerated presentation transformations to four previously frozen documents; compare before/after content, code blocks, links and normalized rendered structure. Runtime, save/content and architecture contracts stay unchanged.

**Tech Stack:** npm workspaces, Node 24.19.0/npm 11.17.0, TypeScript 5.9.3/Svelte 5.57.1; candidate ESLint 10.12.0, @typescript-eslint/parser 8.71.2, eslint-plugin-svelte 3.23.1, svelte-eslint-parser 1.9.0; installed Markdownlint 0.41.1 via VS Code extension 0.62.1.

**Spec:** AGENTS.md LAW-01/02/03/06/07/08 and G1–G4; existing WP-FOUNDATION-PREPUBLICATION-01. Human explicitly approved this supplementary scope (“ok tôi đồng ý”, Sentinel_0e2dfa5b5d688191a711374c4873b7d1) after the proposal to upgrade supported compatible ESLint and format frozen/history docs, with no content/spec change. This packet records that narrow exception; it does not rewrite previous approvals. Coordinator records this exact v1.0/hash when handing it to Builder.

## Global constraints / exact starting checkpoint

Repo `D:\NghienCuuTiemNang\Build-Settlement`, Admin-PC only; branch `fix/foundation-state-boundaries-01`; HEAD `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`. Starting 86-file snapshot `9b36f36ac2dc1383dbd45e8905f2908df3dcb698a30c925758b27d9989691c65` (SHA256 of JSON-encoded sorted path→raw SHA256 map); 12 tracked modified + 6 untracked, nothing staged. Exact hash map is `support-format-wp-before.json` alongside this packet. State must still match before any edit; otherwise coordinate, do not overwrite/reset.

Previous Tester `dc9f2a89...` proved the prior toolchain, not this upgrade. Previous five-document correction is independently PASS and has 0 diagnostics. Preserve its history/proof identities. No gameplay/refactor, application/test changes, fresh dependencies for formatting, CI weakening, script approval/policy change, broad formatter run, new ignore/exclude, disabled rule, `--force`, `--legacy-peer-deps`, `|| true`, or skip. No Legal Tool/TUF/credential reads. Keep test/build artifacts outside repo and in one independent runner; never install into another active writer/tester's live node_modules.

## Exact file allowlist

| Path | Allowed change |
| --- | --- |
| package.json | Only devDependency pins: eslint 10.12.0; existing parser 8.71.2 and plugin 3.23.1 pinned to preserve the checked peer set. No script/rule-policy change. |
| package-lock.json | Normal npm resolution for that candidate; inspect every changed dependency and retain unrelated direct versions. |
| docs/ENCYCLOPEDIA_MECHANICS.md | Presentation fixes for the 132 diagnostics below; no text, formula, decision or order change. |
| docs/work_packages/POP-01A_Implementation_Plan.md | Presentation fixes for 67 diagnostics; the exact second-title heading change below only. |
| docs/work_packages/WP-HAVEN-02_Unified_v1.0.md | Presentation fixes for 160 diagnostics; exact second-title and D20 break changes below only. |
| docs/superpowers/plans/2026-10-02-medal-core-loadout-foundation.md | Presentation fixes for 13 diagnostics; retain original blob provenance in verification record. |
| HANDOFF.md; docs/INTERNAL_PROGRESS_TRACKER.md | Append dated evidence/current state; preserve old checkpoints and historical source/blob references. Do not replace historical ESLint-9 results with ESLint-10 claims. |
| docs/work_packages/WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01.md | Create exact approved packet/version/provenance for portability. |
| docs/verification/SUPPORTED-LINT-HISTORICAL-FORMAT-01.md | Create concise before/after hashes, semantic comparisons, tool/gate results, log references and original historical blob trace. |

**Config/scripts to modify: none expected.** Freeze `eslint.config.mjs` (SHA256 `29a843a7e0e9f4a7d5006192bff4bfd5963b05d47d795ecbd57dd5e755cf08b0`), CI, UI package, TS/Svelte/Vite configs, all source/tests and every file outside the allowlist. If ESLint 10 needs a nontrivial config or additional package change, HOLD and report the exact failure instead of broadening scope. Existing `lint` remains `eslint . --max-warnings=0`.

## Review focus

Check that npm resolves without forced peers; six safety rules still reject bad TS/JS/Svelte fixtures; nested fence content and language never change; formulas/decision tables/links/heading text remain identical; source provenance is kept even when the formatted Plan no longer has the original Git blob ID. Tests for these are included in Tasks 1–3. Raw rendered AST equality must not be falsely claimed for the two declared heading changes or HTML break replacement.

## Task 1 — supported compatible lint tool

**Files:** package.json, package-lock.json. Consumes starting hashes and existing flat config; produces an ordinary npm-resolved lint tree with the same parsers/rules and fresh clean-install evidence.

- [ ] Check release/registry metadata before editing: `npm view eslint@10.12.0 version deprecated engines dist.integrity --json --registry=https://registry.npmjs.org`; save UTC/output/exit. Expected version 10.12.0, no deprecated marker, engine compatible with Node 24.19.0. Also verify exact parser/plugin peers. No install if unavailable/deprecated/incompatible; do not substitute `latest` automatically.
- [ ] In the coordinated isolated candidate, execute ordinary `npm install --save-dev --save-exact eslint@10.12.0 @typescript-eslint/parser@8.71.2 eslint-plugin-svelte@3.23.1`. Only ESLint's installed version changes; the other two pins bind already installed compatible versions. No new framework/config presets. Regenerated lock must keep unrelated direct versions, Vite/Vitest/YAML fixes and app sources intact. Builder then transfers only reviewed allowlisted diffs, never whole node_modules.
- [ ] Before accepting, run clean `npm ci` in a fresh isolated copy (no copied node_modules), `npm ls --all --json`, audit including dev and `npm run lint`. Expected exit 0, no invalid/missing peer, no EOL ESLint install warning. Record all deprecation/allowScripts notices honestly; do not approve scripts or change policy to silence them.
- [ ] Re-run the existing six stdin fixtures outside repo: clean TS, JS, Svelte each exit 0; corresponding `debugger` variants each exit 1 with `no-debugger`. Preserve assertions and parser routes. Additionally capture `--print-config` for representative `.ts`, `.js`, `.mjs`, `.svelte`: all six rules remain error (`no-debugger`, `no-dupe-args`, `no-unsafe-finally`, `no-unreachable`, `constructor-super`, `valid-typeof`), same file coverage/ignores. ESLint 10 changes config lookup; ensure no file silently escapes the root config.

Compatibility already verified statically: parser 8.71.2 peers ESLint `^8.57.0 || ^9 || ^10`, TS `>=4.8.4 <6.1`; plugin 3.23.1 peers ESLint `^8.57.1 || ^9 || ^10`, Svelte `^3.37 || ^4 || ^5`; svelte-eslint-parser 1.9.0 peers Svelte ^3/^4/^5 and is already consumed by the plugin. Node 24.19 satisfies ESLint 10.12 `^20.19 || ^22.13 || >=24`. No currently observed peer blocker; runtime compatibility is not yet proven. Upgrade adds no browser feature or runtime dependency; dev-tool maintenance is one supported major and the existing peer set. Verify UI bundle stays within budget rather than inventing an upgrade bundle size.

## Task 2 — formatting-only exception for four frozen/history docs

**Files:** the four Markdown paths in the table below. Consumes exact before bytes + original canonical source; produces formatted copies and an explicit semantic equivalence report. This supplementary Human approval permits formatting these paths only; it does not permit editing approved requirements, formulas, examples or implementation steps.

| File | Count | Rules/counts |
| --- | ---: | --- |
| docs/ENCYCLOPEDIA_MECHANICS.md | 132 | MD004 86; MD022 22; MD031 2; MD032 22 |
| docs/work_packages/POP-01A_Implementation_Plan.md | 67 | MD004 10; MD022 13; MD025 1; MD031 39; MD032 4 |
| docs/work_packages/WP-HAVEN-02_Unified_v1.0.md | 160 | MD004 125; MD022 11; MD025 1; MD031 8; MD032 13; MD033 1; MD060 1 |
| docs/superpowers/plans/2026-10-02-medal-core-loadout-foundation.md | 13 | MD032 8; MD047 1; MD060 4 |

- [ ] Before modifying, copy exact bytes to external evidence, hash each file, collect Markdown tokens/rendered AST or HTML plus ordered text, heading text/slugs, table cells, inline/fenced code (language and content), formulas, link/image/reference destinations/titles and list item order. Store an immutable baseline. Existing installed engine/harness may be reused; do not add repo parsing dependencies.
- [ ] Apply only marker/blank-line/table-delimiter-spacing/end-newline fixes. Use the same Markdownlint 0.41.1/extension-default config as baseline, keeping all effective rules. Scope the formatter to these four files; do not reflow prose, rename headers, repair wording, alter examples or run global formatting. Keep all fenced code contents/language strings exact after LF normalization.
- [ ] Two MD025 fixes: in POP-01A line 2 and WP-HAVEN-02 line 2, change only `#` to `##`; keep heading text, order and generated slug unchanged. These are subtitle/presentation-depth changes, not new spec sections. Record these exact two depth deltas. One MD033 fix: WP-HAVEN-02 original line 422, replace only the `<br>` between `**ARCHITECTURE DIRECTION**` and the existing italic note in D20 with one space; preserve all words, emphasis and cell boundaries.
- [ ] Compare content and rendered structure. Drop source positions, raw bullet/fence markers, delimiter padding and soft whitespace from AST comparisons; normalize list tight/paragraph wrappers only when caused by inserted blank lines. Permit **only** the two enumerated heading depths and one HTML-break→space at D20. All other heading levels/order, node types/nesting, ordered visible text, math, code, table-cell content and link/image/reference targets must match. Do not implement a comparator that ignores all heading levels, all HTML or all text whitespace indiscriminately. Render before/after and inspect these three explicit exceptions. If raw AST equality is requested literally, it cannot coexist with MD025 zero; report that constraint conflict rather than falsely claiming identity.
- [ ] Require exact fenced-code/language hashes, formula strings, heading text/slugs and links; compare ordered inline prose tokens allowing only the declared presentation whitespace. Any missing/reclassified code fence, changed list hierarchy, broken link/anchor, number/formula/assertion/example/decision change is a blocker. If existing malformed markup makes before/after parsing differ beyond the whitelist, HOLD for inspection; do not reinterpret spec content to make lint green.
- [ ] Preserve Plan provenance outside its body: original ref `da2b13b7a4d3b9aa38df7fe06c3c6faca195b0bb:docs/superpowers/plans/2026-10-02-medal-core-loadout-foundation.md`, original Git blob `bbb17416f92d28d5f49e9d593c9dc425d16e283a`, original working-file SHA256 from baseline, new formatted SHA256/blob, this formatting exception, and semantic comparison evidence. Keep historical statements with dates; append a new checkpoint saying the working Plan is now a formatting derivative. Never relabel new bytes as the original canonical blob.

Baseline tracked warning counts at HEAD were 45/128/32 for Encyclopedia/POP/WP respectively, now 132/67/160 (net +154 across those three). The restored Plan has 13 in its exact historical source. Do not label all 372 as pre-existing at HEAD or all as introduced by the latest correction. Five previously corrected current docs remain at 0 and must not regress; new WP/evidence docs must also be clean.

## Task 3 — final evidence and independent verification

**Files:** new WP/verification record, HANDOFF, tracker. Consumes Tasks 1–2, produces one stable candidate and evidence bound to its exact hashes; no publishing operation.

- [ ] Single runner performs fresh clean install, npm ls, audit including dev, lint, six fixtures/print-config, all 5-workspace typecheck, full unit, explicit build and Chromium smoke. Expected exit 0; unit 220/no skips; smoke 1; 28 independent boundary + 1 contract may be reused unchanged and run on the upgraded tree (record separately, no inflated counts). Preserve two targeted GREEN controls and isolated-base RED controls; never reset shared checkout. ESLint upgrade means old runtime/toolchain PASS cannot stand in for these fresh checks.
- [ ] Scan all 9 originally changed Markdown plus newly created WP/evidence and appended handoff/tracker with the same effective rules: **0 diagnostics**. Save per-file/rule/count before/after and exact engine/config hashes. Check relative links and semantic comparison evidence. Keep raw baseline archived even though working Plan's formatted bytes now differ.
- [ ] Review full diff against exact allowlist; code/tests/config/CI/UI package and all other files must have baseline raw SHA unchanged. Inspect lock for unrelated churn and unsupported/deprecated resolved lint components; audit total 0 is necessary but not a substitute for support/peer evidence. `git diff --check` and targeted secret scan final diff, with honest limitations.
- [ ] Append concise checkpoints with actual candidate hash, Node/npm/installed versions, commands, exits, artifact paths and original→formatted provenance; separate old FAIL, prior PASS and this new run. Do not embed logs or replace historical test identities. Independent Reviewer/Tester inspect one frozen snapshot before closure.

**Stop criteria / HOLD:** any peer conflict or deprecated selected ESLint, registry fetch/permission block (report exact action/target/error, no bypass), install/gate failure, changed protected source, content/AST difference outside the enumerated presentation whitelist, lost provenance/history, nonzero scoped diagnostics, concurrent writes/hash drift, required additional package/config/feature outside scope, or the same failure unresolved after two repair iterations. Stop code/mutations, preserve logs and report. Do not waive known failures, mask CI or auto-expand work. Do not commit/push/merge/release; those require coordinator's later gate decision and Human retains merge authority.

## Sources and verification limits

[ESLint support policy](https://eslint.org/version-support/) identifies v10 Current and v9 EOL; [v10.12.0 official release](https://github.com/eslint/eslint/releases/tag/v10.12.0) and [package metadata](https://raw.githubusercontent.com/eslint/eslint/v10.12.0/package.json) bind the candidate; [v10 migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0) covers Node/config/API changes. Exact peer evidence: [TS parser 8.71.2](https://raw.githubusercontent.com/typescript-eslint/typescript-eslint/v8.71.2/packages/parser/package.json), [Svelte plugin 3.23.1](https://raw.githubusercontent.com/sveltejs/eslint-plugin-svelte/eslint-plugin-svelte@3.23.1/packages/eslint-plugin-svelte/package.json), [Svelte parser 1.9.0](https://raw.githubusercontent.com/sveltejs/svelte-eslint-parser/v1.9.0/package.json); matches installed metadata/lock. The candidate is the checked stable supported major with these peers, not an unverified `latest` command. Direct registry metadata URLs were unavailable to the web tool; no permission bypass or CLI fallback was attempted. Builder must verify exact official npm publication before install as Task 1 states. No install/ESLint-10 execution or semantic-format PASS has occurred in this planning step.
