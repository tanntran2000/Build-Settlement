P6-A PR C Builder (UI: equipment view, item card, inventory, Market, potions, item reports, lord health, death letter)

You are the Builder for P6-A PR C in Haven (repo tanntran2000/Build-Settlement). Claude is Orchestrator and Tester. Astra reviews. Only dot or the owner merges. PR B (#94) is merged: main = 2c04321ba342871e6a858110ea2320a8e4df0d5d.

Owner (Tân), 2026-11-14, verbatim: "Giao Builder C".

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01 (reuse it; create no other worktree or clone). Run `git fetch origin`, check `git status` is clean and ports 4173/4174 are free, then create `feat/p6a-item-ui` from `origin/main` = 2c04321.

Binding documents (read fully before any code):
- Plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-3acfafd.md (approved, Plan corrections 1–7). PR C = Tasks C1–C3. Apply Global Constraints (UI copy, bundle, tests, gates, evidence), the PR C file allowlist plus each task's **Files** line, and Decisions 1–13 where the UI shows them.
- Spec: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-spec-17e7aaf.md (v0.3), especially §4 (catalog, §4.2 class colours, Exclusive labels), §6 (health line), §7 (sources, limits), §9 (UI), §12.
- AGENTS.md in the repo (Hard Laws, §2 quality guidelines, §4 anti-loop, §6 evidence).
You may use the executing-plans approach (task by task, in this thread, no subagents).

Owner rules that bind the UI:
- All UI text in English, ledger style (wood frames, parchment, letter reports). No other game's name anywhere.
- PC first: design and e2e at 1280 and 1600; the existing 320/375 tests must keep passing.
- Rarity by frame and label, never colour alone. A keyboard path for every action.
- Any numeric input accepts digits only and is validated before dispatch.
- UI never edits state directly; everything goes through the existing command dispatcher (LAW-02). No new dependency.

**Step 0 — preflight, before any RED or product edit.** PR C renders data that existing tests treat as absent or pin. Examples:
- PR B's P-edits made the e2e visible-report parser exclude the unrendered `items` field (`tests/e2e/character-life-navigation.helpers.ts` and spec); once Quartermaster and Steward rows render, that exclusion or its expected text changes;
- the sentence "NPC post skills apply at End Week." in `CharacterLifeCharacters.svelte` and its 2 e2e asserts;
- accessibility baselines, report-letter tests, Characters destination and InsideCity building-panel tests, CityFallen copy tests, health text in the life shell.
Search the whole repo (unit and e2e) for every existing test or fixture that PR C breaks or whose expected output changes. For each, give file:line, the current assertion, why PR C changes it, and the exact proposed after-text. Also list any file you need outside the PR C allowlist and task Files lines (for example `report-letters.ts` types or a store helper), and say whether any golden, fixture or pin byte would change (none is expected). Then **HOLD once with the full list**; the owner decides. Do not edit any existing test before that answer.

Key rules for PR C (from the plan; HOLD if anything conflicts and name the line):
- **C1:**
  - paper-doll with 8 slots, and the 3 intimate slots locked on NPCs; flat silhouette portrait;
  - totals column like `combat 42 (+8)`, and Regen for the Player;
  - filters All, Player, NPC, this slot, Equipment, Accessory, Outfit; a Materials tab with rarity and count;
  - item card with a before → after preview; §4.2 class colours plus the "Exclusive <Class>" label;
  - Destroy needs a confirmation;
  - e2e at 1280: buy, equip on a posted NPC, then the next report shows the post effect.
- **C2:**
  - Market panel: 8 offers with price and rarity, and a Sell list that includes materials; Legendary items and Legendary materials show no Sell;
  - potion panel at an operating Hospital and at the Drug Store;
  - Quartermaster rows: material found, item found, storage-full loss, expired item, and the 999-stack loss;
  - Steward row: the Legendary earned. **Plan correction 6:** also a Steward line for rewards still waiting (`pendingLegendary`) that tells the Player to make room;
  - `Health 63 / 100 · Regen +4/week`;
  - death letter "Your Lord Has Died" / "Your wounds proved fatal." (check what PR A correction 1 already added to CityFallen and society-view; do not duplicate it);
  - accessibility audit of the new panels at 1280 and 1600;
  - e2e: sell, destroy, claim from storage, use a potion, and the death letter.
- **Tests and order:**
  - run each task's full RED list before any product edit;
  - existing-test edits only as approved after Step 0, each listed as file:line, before → after; nothing loosened;
  - no new per-test timeout: measure it and HOLD.
- **C3, gates**, sequentially at the clean final head:
  1. `git diff --check origin/main...HEAD`
  2. lint
  3. typecheck
  4. `check:architecture`
  5. `test:architecture`
  6. `npm test`
  7. build

  Then, in the same shell, `echo "CI=$CI"` and `CI=1 npm run test:smoke`. One runner at a time. If the smoke fails, rerun that test alone once, report both runs, and HOLD.
- **Ports:** 4173/4174 must be free before the smoke. If a leftover `vite preview` holds them, report it and HOLD; kill nothing.
- **Bundle** vs main 2c04321 (JS 116.52 kB, CSS 5.81 kB gzip), with its script and a raw artifact; stay under 200 KB gzip total.
- **Evidence:** C:/Users/Admin/.t3/local-drafts/p6a-prC/. Include:
  - the Step 0 preflight;
  - RED and GREEN logs per task;
  - the edit inventory and a verifier script;
  - an immutable check that golden, fixtures and pins are byte-identical to 2c04321;
  - the accessibility audit output;
  - at least one screenshot per new panel at 1280 (PNG, for the owner to see the look);
  - gate logs with HEAD, tree, UTC and exit at the top;
  - the smoke log showing CI=1;
  - the bundle;
  - a README and SHA256SUMS.txt (cover every file except the top-level manifest itself, including any nested manifests).

  All UTF-8. No `docs/` files on the product branch. Put large Playwright artifact folders outside the evidence folder or list them in a LOCAL-ONLY manifest with SHA-256.
- **Commits:** one per task, with the plan's commit messages, each ending `Co-authored-by: Codex <noreply@openai.com>`. Do not push, open a PR or merge. Leave ports 4173/4174 free.
- **Anti-loop:** if one failure is still failing after 2 attempts, HOLD.

After the Step 0 HOLD is answered and the work is done, reply with:
- HEAD and tree, and the empty git status;
- the commits;
- RED and GREEN per task;
- the edit inventory count;
- the immutable check;
- the gate table, and the smoke total showing CI=1;
- the bundle;
- the screenshot paths;
- the evidence paths.
