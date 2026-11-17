# Astra independent review: PR #99

HEAD: 56124513aef2d85de128fe76bf3001654290c1c0
Tree: d2f31706d77d308a310b61857a8b293a898280e7
Base: 753e4503673df86830fba2ef2c9ef1e64a843729

## Findings
P0: 0; P1: 1; P2: 0; P3: 0.

### P1: `packages/core/src/trial/__tests__/society.test.ts:107` - EOF newline added
The complete Git blob differs from the reconstruction of the approved E edits. The review instruction explicitly assigns P1 to any additional existing-test change. This is formatting only, with no observed assertion weakening, but it fails the binding byte-exact requirement. Restore the original EOF bytes or obtain explicit approval. Builder verify-edit-inventory.py uses splitlines followed by a forced trailing newline, masking this difference.

## All 60 changed paths

| Path | Authorization | Result |
|---|---|---|
| `packages/core/src/__tests__/catalog-data.test.ts` | E01, E02, E03, E04 | Within approved scope |
| `packages/core/src/data/npc-life.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/core/src/data/tuning.json` | E05 | Within approved scope |
| `packages/core/src/data/validate.ts` | E06, E07 | Within approved scope |
| `packages/core/src/index.ts` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/core/src/trial/__tests__/crime.test.ts` | E08 | Within approved scope |
| `packages/core/src/trial/__tests__/crisis.test.ts` | E09 | Within approved scope |
| `packages/core/src/trial/__tests__/items.test.ts` | E10 | Within approved scope |
| `packages/core/src/trial/__tests__/law.test.ts` | E11 | Within approved scope |
| `packages/core/src/trial/__tests__/order.test.ts` | E12 | Within approved scope |
| `packages/core/src/trial/__tests__/outside.test.ts` | E13 | Within approved scope |
| `packages/core/src/trial/__tests__/society.test.ts` | E14 | P1 above |
| `packages/core/src/trial/society.ts` | E15 | Within approved scope |
| `packages/core/src/world/__tests__/npc-life.test.ts` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/core/src/world/__tests__/npc.test.ts` | E16 | Within approved scope |
| `packages/core/src/world/__tests__/session.test.ts` | E17 | Within approved scope |
| `packages/core/src/world/npc-content.ts` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/core/src/world/npc-life.ts` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/core/src/world/npc.ts` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/character-life-save.test.ts` | E18, E19 | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-5-weeks.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-crime-death.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-crime-raid.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-crime-robbery.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-crime-wound.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-demand-card.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-laws.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-new-game.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/life-rebellion-last-week.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/fixtures/society-v10/new-game.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/item-records.test.ts` | E20, E21 | Within approved scope |
| `packages/persistence/src/__tests__/items-rebuild-order.test.ts` | E22 | Within approved scope |
| `packages/persistence/src/__tests__/npc-life-records.test.ts` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/__tests__/session-records.test.ts` | E23 | Within approved scope |
| `packages/persistence/src/__tests__/society-new-game-fixture.test.ts` | E24, E25, E26, E27, E28, E29, E30 | Within approved scope |
| `packages/persistence/src/__tests__/society-v9-fixture.test.ts` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/persistence/src/session-records.ts` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/simulation/src/__tests__/craft-week.test.ts` | E51, E52, E53 | Within approved scope |
| `packages/simulation/src/__tests__/crime-fixtures.test.ts` | E31 | Within approved scope |
| `packages/simulation/src/__tests__/crisis-fixtures.test.ts` | E32 | Within approved scope |
| `packages/simulation/src/__tests__/fixtures/catalog-golden.json` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/simulation/src/__tests__/fixtures/p7a-path-diff.ts` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/simulation/src/__tests__/fixtures/p7a-path-diff.txt` | PR A allowlist / correction 1 inventory | Within approved scope |
| `packages/simulation/src/__tests__/law-fixture.test.ts` | E33 | Within approved scope |
| `packages/simulation/src/__tests__/law-week.test.ts` | E34 | Within approved scope |
| `packages/simulation/src/__tests__/lord-health.test.ts` | E35 | Within approved scope |
| `packages/simulation/src/__tests__/smithy-data.test.ts` | E36 | Within approved scope |
| `packages/ui/src/__tests__/character-life-session.test.ts` | E37 | Within approved scope |
| `packages/ui/src/__tests__/world-session.test.ts` | E38 | Within approved scope |
| `tests/e2e/crime.spec.ts` | E39 | Within approved scope |
| `tests/e2e/crisis.spec.ts` | E40 | Within approved scope |
| `tests/e2e/garrison.spec.ts` | E41 | Within approved scope |
| `tests/e2e/items.spec.ts` | E42 | Within approved scope |
| `tests/e2e/laws.spec.ts` | E43 | Within approved scope |
| `tests/e2e/ledger.spec.ts` | E44 | Within approved scope |
| `tests/e2e/society.spec.ts` | E45 | Within approved scope |
| `tests/e2e/storage.spec.ts` | E46 | Within approved scope |
| `tests/e2e/tile-save.spec.ts` | E47 | Within approved scope |
| `tests/e2e/title.spec.ts` | E48, E49 | Within approved scope |
| `tests/e2e/world-session.spec.ts` | E50 | Within approved scope |

## E01-E53 reconstruction

Independently parsed binding Markdown Before/After blocks, applied replacements at original base line numbers descending, and compared complete UTF-8 Git blobs without normalizing EOF. All approved replacements match. Additional whole-file differences are identified above.

| Edit | Base location | Result |
|---|---|---|
| E01 | `packages/core/src/__tests__/catalog-data.test.ts:8` | Approved replacement exact; whole file exact |
| E02 | `packages/core/src/__tests__/catalog-data.test.ts:21` | Approved replacement exact; whole file exact |
| E03 | `packages/core/src/__tests__/catalog-data.test.ts:86` | Approved replacement exact; whole file exact |
| E04 | `packages/core/src/__tests__/catalog-data.test.ts:111` | Approved replacement exact; whole file exact |
| E05 | `packages/core/src/data/tuning.json:181` | Approved replacement exact; whole file exact |
| E06 | `packages/core/src/data/validate.ts:308` | Approved replacement exact; authorized validator addition also present |
| E07 | `packages/core/src/data/validate.ts:628` | Approved replacement exact; authorized validator addition also present |
| E08 | `packages/core/src/trial/__tests__/crime.test.ts:7` | Approved replacement exact; whole file exact |
| E09 | `packages/core/src/trial/__tests__/crisis.test.ts:6` | Approved replacement exact; whole file exact |
| E10 | `packages/core/src/trial/__tests__/items.test.ts:8` | Approved replacement exact; whole file exact |
| E11 | `packages/core/src/trial/__tests__/law.test.ts:12` | Approved replacement exact; whole file exact |
| E12 | `packages/core/src/trial/__tests__/order.test.ts:33` | Approved replacement exact; whole file exact |
| E13 | `packages/core/src/trial/__tests__/outside.test.ts:21` | Approved replacement exact; whole file exact |
| E14 | `packages/core/src/trial/__tests__/society.test.ts:8` | Approved replacement exact; see finding |
| E15 | `packages/core/src/trial/society.ts:14` | Approved replacement exact; whole file exact |
| E16 | `packages/core/src/world/__tests__/npc.test.ts:62` | Approved replacement exact; whole file exact |
| E17 | `packages/core/src/world/__tests__/session.test.ts:32` | Approved replacement exact; whole file exact |
| E18 | `packages/persistence/src/__tests__/character-life-save.test.ts:18` | Approved replacement exact; whole file exact |
| E19 | `packages/persistence/src/__tests__/character-life-save.test.ts:91` | Approved replacement exact; whole file exact |
| E20 | `packages/persistence/src/__tests__/item-records.test.ts:32` | Approved replacement exact; whole file exact |
| E21 | `packages/persistence/src/__tests__/item-records.test.ts:33` | Approved replacement exact; whole file exact |
| E22 | `packages/persistence/src/__tests__/items-rebuild-order.test.ts:58` | Approved replacement exact; whole file exact |
| E23 | `packages/persistence/src/__tests__/session-records.test.ts:14` | Approved replacement exact; whole file exact |
| E24 | `packages/persistence/src/__tests__/society-new-game-fixture.test.ts:8` | Approved replacement exact; whole file exact |
| E25 | `packages/persistence/src/__tests__/society-new-game-fixture.test.ts:9` | Approved replacement exact; whole file exact |
| E26 | `packages/persistence/src/__tests__/society-new-game-fixture.test.ts:12` | Approved replacement exact; whole file exact |
| E27 | `packages/persistence/src/__tests__/society-new-game-fixture.test.ts:25` | Approved replacement exact; whole file exact |
| E28 | `packages/persistence/src/__tests__/society-new-game-fixture.test.ts:26` | Approved replacement exact; whole file exact |
| E29 | `packages/persistence/src/__tests__/society-new-game-fixture.test.ts:31` | Approved replacement exact; whole file exact |
| E30 | `packages/persistence/src/__tests__/society-new-game-fixture.test.ts:38` | Approved replacement exact; whole file exact |
| E31 | `packages/simulation/src/__tests__/crime-fixtures.test.ts:9` | Approved replacement exact; whole file exact |
| E32 | `packages/simulation/src/__tests__/crisis-fixtures.test.ts:7` | Approved replacement exact; whole file exact |
| E33 | `packages/simulation/src/__tests__/law-fixture.test.ts:27` | Approved replacement exact; whole file exact |
| E34 | `packages/simulation/src/__tests__/law-week.test.ts:80` | Approved replacement exact; whole file exact |
| E35 | `packages/simulation/src/__tests__/lord-health.test.ts:26` | Approved replacement exact; whole file exact |
| E36 | `packages/simulation/src/__tests__/smithy-data.test.ts:22` | Approved replacement exact; whole file exact |
| E37 | `packages/ui/src/__tests__/character-life-session.test.ts:13` | Approved replacement exact; whole file exact |
| E38 | `packages/ui/src/__tests__/world-session.test.ts:95` | Approved replacement exact; whole file exact |
| E39 | `tests/e2e/crime.spec.ts:9` | Approved replacement exact; whole file exact |
| E40 | `tests/e2e/crisis.spec.ts:9` | Approved replacement exact; whole file exact |
| E41 | `tests/e2e/garrison.spec.ts:22` | Approved replacement exact; whole file exact |
| E42 | `tests/e2e/items.spec.ts:133` | Approved replacement exact; whole file exact |
| E43 | `tests/e2e/laws.spec.ts:24` | Approved replacement exact; whole file exact |
| E44 | `tests/e2e/ledger.spec.ts:11` | Approved replacement exact; whole file exact |
| E45 | `tests/e2e/society.spec.ts:17` | Approved replacement exact; whole file exact |
| E46 | `tests/e2e/storage.spec.ts:14` | Approved replacement exact; whole file exact |
| E47 | `tests/e2e/tile-save.spec.ts:12` | Approved replacement exact; whole file exact |
| E48 | `tests/e2e/title.spec.ts:149` | Approved replacement exact; whole file exact |
| E49 | `tests/e2e/title.spec.ts:185` | Approved replacement exact; whole file exact |
| E50 | `tests/e2e/world-session.spec.ts:23` | Approved replacement exact; whole file exact |
| E51 | `packages/simulation/src/__tests__/craft-week.test.ts:13` | Approved replacement exact; whole file exact |
| E52 | `packages/simulation/src/__tests__/craft-week.test.ts:14` | Approved replacement exact; whole file exact |
| E53 | `packages/simulation/src/__tests__/craft-week.test.ts:15` | Approved replacement exact; whole file exact |

## Acceptance assessment

Decisions 1-3: six English origins, eight hobbies and exact TRIAL values; NpcLife shape matches and is last in WorldNpc. Independent identity-salted RNG adds no draws on existing streams. Starter ages 27/31/24 and health remain unchanged. Age arithmetic uses 40 weeks; title boundary tests cover 18,29,30,49,50. Current validation enforces adult female NPCs, safe integer stats in [0,100], known/distinct hobbies, experience caps and recent history cap, with no writes to imported state. Required malformed-life cases are covered by core and persistence tests.

Decision 4: v10 always requires life. Historical three-key validator is restricted to explicit 01-09 rulesets; v9 refusal and reconstruction tests preserve source bytes. No migration or missing-life fallback. Exhausted life and full history round-trip tests support the PR B handoff.

LAW-02/03/04/06: inspected product diff contains no DOM/UI import, new clock, ambient RNG, mutation of historical saves or partial import writes. Required JSON type attribute is present. No new dependency, docs/ or .github/ change. English catalog text names no other game.

Executed node packages/simulation/src/__tests__/fixtures/p7a-path-diff.ts successfully, exit 0: 3 golden seeds, 10 scenarios, 841 allowed leaves, zero forbidden paths; envelope-only ruleset replacement; 63 historical fixtures and 9 generator/evidence blobs unchanged. Inspected whitelist expansion, existing NPC checks and golden summary/scenario checks. Retained golden-generation-count.txt records one unchanged-generator invocation; final content alone cannot prove invocation count.

Inspected supplied Claude gate log: exact target HEAD/tree; gates 1-7 exit 0, 3031/3031 tests in 130 files, smoke 387/387 exit 0. Smoke not rerun. Builder README retains initial failed smoke, approved baseline comparison and approved successful rerun. GitHub CI run 44083910462 success is requester-supplied; remote run not independently queried.

G5 additionally requires Orchestrator to commit evidence and review on the WP docs branch. No G5 completion claimed. No repository edits, commits, pushes, comments, merge, builds or servers performed. Worktree retained; storage reclaimed 0 bytes.

VERDICT: FAIL
