P6-B PR C Builder (crafting UI: workshop panel, Brew tab, item-card upgrade hint, Quartermaster rows)

You are the P6-B Builder, now on PR C. Claude is Orchestrator and Tester. Astra reviews. Only dot or the owner merges. PR B (#97) is merged: main = 43fcb9b856c66606230d6d7ba49140ae94cfaa00.

Owner (Tân), 2026-11-15, verbatim: "Giao Builder C".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; create no other worktree or clone). Run `git fetch origin`, check `git status` is clean and ports 4173/4174 are free, then create `feat/p6b-crafting-ui` from `origin/main` = 43fcb9b.

Binding documents (read fully before any code):
- Plan: C:/Users/Admin/.t3/local-drafts/p6b-prC/binding-plan-16e48a1.md (approved; corrections 1–4 still bind). PR C = Tasks C0–C3. Apply Global Constraints (UI copy, keyboard paths, rarity by frame and label, e2e at 1280 and 1600 with 320/375 still passing, bundle), the PR C file allowlist plus each task's **Files** line.
- Spec: C:/Users/Admin/.t3/local-drafts/p6b-prC/binding-spec-cd1b18a.md (v0.1), especially §9 (UI) and §6 (orders, capacity, fees, ready outputs).
- AGENTS.md in the repo (Hard Laws, §4 anti-loop, §6 evidence).
You may use the executing-plans approach (task by task, in this thread, no subagents).

Owner rules that bind the UI:
- All UI text in English, ledger style (wood frames, parchment, letter reports). No other game's name anywhere.
- PC first: design and e2e at 1280 and 1600; the existing 320/375 tests must keep passing.
- Rarity by frame and label, never colour alone. A keyboard path for every action; focus returns to a control that still exists after an action removes one.
- No free-text numeric input in PR C (each Place button places one order). If you find you need a number field, it must accept digits only and validate before dispatch — and HOLD first.
- UI never edits state directly; everything goes through the existing command dispatcher (`PLACE_CRAFT_ORDER`, `CANCEL_CRAFT_ORDER`) (LAW-02). No new dependency.
- Item names are already unique ("Lord's" / "Retainer's" prefixes); the report parser can map names to ids.

**Task C0 — Step 0 preflight, before any RED or product edit.** Search the whole repo (unit and e2e) for every existing test, fixture, accessibility baseline or parser that PR C changes, for example:
- the InsideCity building panels (Smithy panel mount; Hospital and Drug Store PotionPanel gaining a Brew tab);
- the item card tests (new "Can upgrade at the Smithy" hint);
- the e2e visible-report parser and report-letter tests (new crafted / waiting / idle rows);
- accessibility baselines and reflow audits that will now include new panels;
- screenshots or snapshots that pin panel text.
For each: file:line, the current assertion, why PR C changes it, and the exact proposed after-text. List any file you need outside the allowlist and why. Then **HOLD once with the full list**; the owner decides. Do not edit any existing test before that answer.

Key rules for PR C (from the plan; HOLD if anything conflicts and name the line):
- **C1:** WorkshopPanel for the Smithy (recipes the city can make now, grouped Refine / Upgrade; upgrade before → after card; fee; "N of M this week"; Cancel per order; ready outputs waiting for room; command errors shown); a Brew tab on the Hospital and Drug Store panels with the herb recipes; keyboard paths; e2e at 1280: build a Smithy, refine 2 Iron, upgrade a Plain Ring for the Player, cancel an order, brew a Heal Potion, End Week, see the outputs.
- **C2:** the item card shows "Can upgrade at the Smithy" with the needed material (not for Epic or Legendary); Quartermaster rows for crafted, refined, brewed, waiting for room and idle workshop; accessibility audit of the new panels at 1280 and 1600; the visible report parser reads the new rows.
- At least one 1280px screenshot per new panel (Smithy panel with a queue, Brew tab, Steward/Quartermaster rows) for the owner to see the look.
- **Tests and order:** each task's full RED list before any product edit; existing-test edits only as approved after Step 0; nothing loosened; no new per-test timeout (measure and HOLD).
- **C3 gates**, sequentially at the clean final head, on a quiet machine: record CPU load and top processes first and start only when no other test, build or review job runs; gates 1–7 (`git diff --check origin/main...HEAD`, lint, typecheck, `check:architecture`, `test:architecture`, `npm test`, build); then in the same shell `echo "CI=$CI"` and `CI=1 npm run test:smoke`. If the smoke fails, rerun each failed test alone once, report both, and HOLD. If any test times out, measure it alone three times and HOLD.
- **Ports:** 4173/4174 free before the smoke; if held, report and HOLD; kill nothing.
- **Evidence:** C:/Users/Admin/.t3/local-drafts/p6b-prC/: Step 0, RED/GREEN per task, edit inventory + verifier (clear final-mode argument), immutable check (golden, fixtures, pins byte-identical to 43fcb9b), accessibility summary, screenshots, gate logs with HEAD/tree/UTC/exit/CPU, smoke log with CI=1, bundle vs main (JS 132.14 kB, CSS 6.74 kB gzip) with script and raw artifact, README, SHA256SUMS.txt (every file except the top manifest, nested manifests included). UTF-8 only. No `docs/` files on the product branch. Keep Playwright traces out of the evidence folder or list them in a LOCAL-ONLY manifest.
- **Commits:** one per task (C1, C2), with the plan's commit messages, each ending `Co-authored-by: Codex <noreply@openai.com>`. Do not push, open a PR or merge. Leave ports 4173/4174 free.
- **Anti-loop:** if one failure is still failing after 2 attempts, HOLD. A queued message never overrides a HOLD.

After the Step 0 HOLD is answered and the work is done, reply with: HEAD and tree, empty git status; the commits; RED and GREEN per task; the edit inventory count; the immutable check; CPU load at gate start; the gate table and smoke total with CI=1; the bundle; the screenshot paths; the evidence paths.
