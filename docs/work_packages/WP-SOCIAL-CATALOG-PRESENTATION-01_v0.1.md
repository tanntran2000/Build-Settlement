# WP-SOCIAL-CATALOG-PRESENTATION-01 v0.1 — Proposed Implementation Packet

**Status:** G1 approved for the presentation/catalog slice; implementation candidate awaits verification and independent review. **Date:** 2026-10-20.
**Proposed base:** `7ca4c2348f11740babd3b4fa4272b4e1e047cd5b` (PR #24 merge).
**Design:** [Social Groups, Requirements and City Status — Draft 01](../design/SOCIAL-REQUIREMENTS-STATUS-DRAFT-01.md).

**Historical documentation-phase restriction:** This was a reviewable proposal, not permission to implement. The current task ends with local documents and read-only inspection. No code, commits, pushes, PR creation, merge, deployment or ZIP publication is authorized. The earlier draft PR rejection remains in force; writing this packet is not approval to retry it.

**Subsequent Human approval — 2026-10-20:** After the assistant explicitly asked to approve this presentation WP for implementation, testing and opening a PR, the user replied “ok tôi đồng ý”. This approval supersedes the earlier documentation-only restriction for exactly section 1 and P01–P08, and supplies the agreed implementation plan previously missing for draft PR creation. The approved base was reverified unchanged. Preserve the preceding nine document edits as design context. Commit/push of this feature branch and draft PR preparation are authorized; merge, deployment and ZIP publication remain prohibited pending independent Reviewer/Tester audit on the exact SHA. No production, Law, numerical or migration decisions are added.

## 1. Proposed next slice: presentation and inert catalog

Player outcome: the Weekly page can explain the three planned groups and the separation between physical stocks, city Requirements and city Status without implying that those systems are simulated.

Proposed implementation, only after Human approves this exact WP version under AGENTS.md G1:

1. Add an inert content module with exactly three group descriptors: labor / intellectual-scientific / merchants, their proposed full English names, UI labels Makers / Luminaries / Merchants and the duties in the design. Add display descriptors for four planned inputs, two planned finished goods, Food/Goods Requirements and Happiness/Security/Corruption Status. Keep labels display-only; they are not runtime resource keys, membership records, recipes or gameplay parameters. No generalized registry/config framework.
2. Add a compact static “Planned city systems” panel to Weekly. Show group descriptions, the six planned inventory names, Food/Goods as city-wide Requirements and only Happiness/Security/Corruption as Status (design range 0–100). Explain shared group influence and building-only Wheat processing qualitatively. Mark names as proposed and systems as planned; no live bars, headcounts, mock quantities, fake zeros or controls.
3. Retain the live four-stock Stocks section and Farm Field report as they are. Do not relabel current Food as Wheat, attach current residents to new groups, or consume new descriptors in any simulation/state validator. Keep static planned content visually separate from live stock values.
4. State the Law integration boundary as deferred. Do not add a Law tab, state, API, command, voting, privilege formula or Civic Charter placeholder.

No dependency, global style redesign, effect lifecycle change, localization framework or navigation redesign is needed for this slice.

## 2. Proposed file allowlist

Only files needed for the agreed presentation/catalog behavior may change:

| Path | Permitted purpose |
| --- | --- |
| `packages/content/src/city-design.ts` (new) | Inert display descriptors only; no numeric gameplay defaults |
| `packages/content/src/index.ts` | Export the static descriptors |
| `packages/content/src/__tests__/city-design.test.ts` (new) | Semantic category checks, if not fully covered by browser assertions; avoid duplicate tests that merely mirror literals |
| `packages/ui/src/WeeklyManagement.svelte` | Static panel and locally scoped presentation |
| `tests/e2e/weekly-management.spec.ts` | Visible category/planned-state assertions alongside existing Weekly behavior |
| This WP and the linked design record | Record approved clarifications and execution evidence without rewriting historical records |

The UI already declares `@haven/content: "*"`, whose export points to `src/index.ts`; reuse this dependency without changing package metadata or lockfiles. Reconfirm that import boundary before G1 approval. Any additional file or behavior requires an explicit scope revision. Existing `buildings.json`, all `packages/core/**`, `packages/simulation/**`, `packages/persistence/**`, R1 UI/regression entry, global CSS, package metadata/lockfiles, CI configuration, error logger and unrelated tests remain outside the proposed change surface. No save schema, inventory validator, fixture, profile multiplier, root clock, command or simulation math changes.

## 3. Invariants and acceptance criteria

Applicable repository rules: LAW-01 scope; LAW-02 pure core/simulation and command boundaries; LAW-03 determinism/one clock; LAW-04 atomic commands and nonnegative stock; LAW-06 persistence integrity; LAW-07 evidence; LAW-08 publication and merge authority. These are repository governance rule identifiers, not proposed gameplay Law mechanics.

| ID | Required evidence for a future implementation |
| --- | --- |
| P01 | Preview has exactly three social groups and the specified proposed names, labels and duties; no legacy-class-to-group conversion or live group population |
| P02 | Food/Goods appear as planned city-wide Requirements separately from finished inventory; exactly three Status names, with 0–100 labeled as design range; no fabricated simulation values |
| P03 | Planned inputs and finished stocks are distinct; same-week Wheat processing is building-only; live Stocks still show Gold/Food/Wood/Iron and Food keeps its name |
| P04 | Both content and rendered descriptions explain shared Status influence without one-group-per-Status mapping or intrinsic merchant corruption; Law is deferred with no controls |
| P05 | Existing Weekly fixture assigning 4 WF still reports Gold 6 / Food 12; fractional assignment, partial funding, report lock, Plan next week, reload and invalid-input behavior retain existing coverage |
| P06 | Static panel never dispatches a command or changes runtime state; core/simulation/persistence and historical building JSON have no diff |
| P07 | Full existing lint/typecheck/unit/build/browser smoke/audit checks pass without weakening gates; production and R1 regression artifact isolation remains intact |
| P08 | No new numeric gameplay parameter, trade/economic mechanic, save/data migration, Law integration or external dependency appears in the final allowlist diff |

Tests should prove visible distinctions and unchanged runtime behavior, not just copy descriptor literals into expectations. Use existing regression coverage where it already proves the behavior.

## 4. Work held for separate decisions and WPs

| Follow-up | Decisions needed before a new implementation plan |
| --- | --- |
| Live six-stock inventory and building production | Recipes/input consumption, output, capacity, construction cost, stock units/initialization and within-week ordering that permits harvested Wheat to enter building processing the same week |
| City Food/Goods Requirements | Demand and consumption rates, units, allocation priority, shortage and fulfillment semantics; stock and Requirement values must stay separate |
| City Happiness/Security/Corruption | Initial values, causal changes from all three groups/conditions/buildings, thresholds and effect coefficients; resolver and effect consumer boundaries |
| Live group membership and workforce | Membership/assignment representation, population conservation and workforce rules; no one-to-one Slave/Low/Middle/High conversion; separate compatibility decision before touching stored/existing data |
| Save/data migration | Explicit separate authorization, ownership/schema/compatibility decisions and corruption/rollback safeguards; none is authorized here |
| Trade/economic mechanics | Separate scope and rules; Merchants and exchange Goods alone do not authorize prices, markets, taxes, transport, Gold income or new exchange commands |
| Law / Civic Charter | Deferred; only the pending integration boundary exists. No Law mechanics, voting or privilege formulas specified |

Recipes, capacities, consumption rates, thresholds and effect coefficients remain unapproved, including the previous trial numerical proposal. Historical runtime numbers are not defaults for these follow-ups.

## 5. Future execution and review gates

Before future code, verify exact main again, inspect a clean isolated checkout and current AGENTS.md/skills, then obtain Human approval of a concrete WP version and base. If main has moved, reassess the packet's scope and compatibility; do not silently execute against a substituted base. This documentation task does not create a branch or implementation worktree.

After an approved implementation, collect exact SHA, final diff/allowlist, commands/logs/exit codes and acceptance mapping for review. Expected local commands are `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:smoke`, `npm audit --audit-level=moderate` and `git diff --check`. Builds and browser checks belong to that future implementation; this task does not run them or generate release artifacts. Follow the repository's two-failed-iterations HOLD rule.

Any future commit, push, PR or publication step requires authorization applicable to that step; this packet supplies none. Human retains merge authority. Do not treat a drafted implementation plan as an agreed plan or the lifting of the earlier PR block.

## 6. Implementation candidate — local verification, not merge acceptance

Implemented only the inert `CITY_DESIGN` descriptor export and the static Weekly panel, plus two browser acceptance tests and one focused content regression test. Reused the existing content dependency; no package metadata or lockfile changes. The original nine authorized design-document edits travel with this candidate as documentation-phase context. Their earlier G1-pending/no-code notices describe that phase; the subsequent approval above is the current authorization. Section 1 and P01–P08 are unchanged. No G6 closeout, full simulation, demo approval or release readiness is claimed.

Local evidence is under `/tmp/social-catalog-presentation-01/` in the saved cloud environment. Setup initially failed to create npm's default cache; retry using `npm_config_cache=/tmp/social-catalog-presentation-01/npm-cache` installed 189 packages without changing dependency metadata. A premature baseline command before setup completed could not find Vitest; after setup the baseline passed 617 units and build. Two new browser tests then failed because the preview region was absent (RED exit 1); after implementation both passed (GREEN exit 0).

| Gate | Actual local result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npm run typecheck` | Exit 0; all five workspaces, Svelte 0 errors / 0 warnings |
| `npm test` | Exit 0; 618 tests in 18 files |
| `npm run build` | Exit 0; core, simulation and production UI |
| `CI=1 npm run test:smoke -- --config=/tmp/social-catalog-presentation-01/playwright.config.ts` | Exit 0; 31 browser tests, including the two new acceptance tests and existing Weekly/R1/logger/artifact-isolation coverage |
| `npm audit --audit-level=moderate` | Exit 0; 0 vulnerabilities, with external writable npm cache |
| `npm ls --all` | Exit 0; dependency tree valid |
| Scope / integrity / bounded secret-pattern scan / `git diff --check` | Exit 0; 14-file scope = nine carried documents + five implementation files; 99 other tracked files byte-identical to base; existing tests retained; Weekly script unchanged except content import; no panel handlers, bindings or business-state reads |

The external Playwright config preserves the repository's tests, assertions, projects and both preview servers; it sets checkout/output paths and uses the installed `/usr/bin/chromium`, as documented in cloud onboarding. This is local system-Chromium evidence, not exact parity with CI's bundled browser. Final SHA, draft PR and exact-SHA CI/independent review status belong in the handoff. Merge/deployment/ZIP remain blocked until separately authorized; this record does not substitute for independent Reviewer/Tester acceptance.


Pre-PR source review examined exact candidate `b5adbf8b74878af4fbde86e2bc9d0773178b0cb9` and found one P04 gap: shared-influence text was rendered but absent from the content catalog. A focused content test reproduced the missing descriptor (RED exit 1). The correction adds one inert `groupInfluence` description and renders it in the existing paragraph (GREEN exit 0); browser assertions are unchanged. All gates in the table were rerun after that code change, including 618 units and 31 browser tests. This supersedes the earlier 617-unit candidate; the final SHA is reported in the handoff. No other source-review finding or deferred minor was reported. Independent Reviewer/Tester acceptance of the final SHA and GitHub CI are still separate gates.
