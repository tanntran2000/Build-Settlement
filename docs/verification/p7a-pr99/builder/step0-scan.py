"""Read-only A0 inventory; writes evidence outside the product worktree only."""
from __future__ import annotations

import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(r"C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01")
OUT = Path(__file__).resolve().parent
BASE = "753e4503673df86830fba2ef2c9ef1e64a843729"


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT).decode("utf-8").strip()


def canonical(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


tracked = git("ls-files", "-z").split("\0")
texts = {}
for file in tracked:
    try:
        raw = (ROOT / file).read_bytes()
        if b"\0" not in raw:
            texts[file] = raw.decode("utf-8-sig")
    except (UnicodeError, OSError):
        pass

patterns = {
    "ruleset-and-fixture": r"tile-society-09|society-v9|\bv9\b",
    "npc-shape-and-starters": r"WorldNpc|isWorldNpcList|WORLD_STARTER_NPCS|postTileId|npc_starter_[123]|kind\s*:\s*['\"]npc['\"]",
    "golden-and-pins": r"catalog-golden|SOCIETY_TRIAL|NPC_ORIGINS|NPC_HOBBIES|P7A_TRIAL",
    "keys-and-snapshots": r"Object\.keys|Reflect\.ownKeys|toMatchSnapshot|toMatchInlineSnapshot|\.snap\b",
}
matches = []
for file, source in sorted(texts.items()):
    for line, text in enumerate(source.splitlines(), 1):
        cats = [name for name, pattern in patterns.items() if re.search(pattern, text)]
        if cats:
            matches.append({"file": file, "line": line, "categories": cats, "text": text})
(OUT / "step0-search-matches.json").write_text(json.dumps(matches, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

product = [
    "packages/core/src/data/npc-life.json",
    "packages/core/src/data/validate.ts",
    "packages/core/src/data/tuning.json",
    "packages/core/src/world/npc-life.ts",
    "packages/core/src/world/npc.ts",
    "packages/core/src/world/npc-content.ts",
    "packages/core/src/trial/society.ts",
    "packages/core/src/index.ts",
    "packages/persistence/src/session-records.ts",
]
changes = []
for file, source in sorted(texts.items()):
    is_test = file.endswith((".test.ts", ".spec.ts"))
    if not (is_test or file in product):
        continue
    for line, text in enumerate(source.splitlines(), 1):
        after = text.replace("tile-society-09", "tile-society-10").replace("society-v9", "society-v10")
        if file.endswith("/item-records.test.ts"):
            after = after.replace("every new v9 Character Life", "every new v10 Character Life")
        if after != text:
            reason = "Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact."
            if "society-v9" in text:
                reason = "This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions."
            if file.endswith("/session-records.test.ts"):
                reason = "Only v10 is current; v9 joins the unchanged historical refusal branch."
            changes.append({"file": file, "line": line, "before": text, "after": after, "reason": reason, "task": "A2"})

def replace_line(file: str, line: int, after: str, reason: str, task: str) -> None:
    changes.append({"file": file, "line": line, "before": texts[file].splitlines()[line-1], "after": after, "reason": reason, "task": task})

replace_line("packages/core/src/world/__tests__/npc.test.ts", 62,
    "    expect(a.npcs.map(({ character, traits, postTileId }) => ({ character: { ...character, name: '' }, traits, postTileId })))\n"
    "      .toEqual(b.npcs.map(({ character, traits, postTileId }) => ({ character: { ...character, name: '' }, traits, postTileId })));",
    "New life is seed-dependent. Preserve exact cross-seed equality for every pre-P7 field; new life determinism/ranges are asserted separately in the new npc-life.test.ts. Lines 10 and 38 stay unchanged, including the full seed-0 template equality.", "A1")

catalog = {
    "origins": {
        "frontier": {"name": "Frontier", "summary": "Raised in a frontier settlement."},
        "port_town": {"name": "Port Town", "summary": "Raised in a coastal trading town."},
        "farming_village": {"name": "Farming Village", "summary": "Raised in a farming community."},
        "workshop_district": {"name": "Workshop District", "summary": "Raised among craft workshops."},
        "scholar_district": {"name": "Scholar District", "summary": "Raised in a community of scholars."},
        "caravan": {"name": "Caravan", "summary": "Raised along established trade routes."},
    },
    "hobbies": {
        "reading": {"name": "Reading"}, "gardening": {"name": "Gardening"},
        "cooking": {"name": "Cooking"}, "music": {"name": "Music"},
        "walking": {"name": "Walking"}, "sewing": {"name": "Sewing"},
        "board_games": {"name": "Board Games"}, "stargazing": {"name": "Stargazing"},
    },
    "P7A_TRIAL": {
        "marker": "TRIAL", "lustBase": [20, 40], "beauty": [40, 80],
        "stressWork": 4, "stressRest": 5, "stressHalveAuthority": 70,
        "stressHalveAffection": 70, "stressResume": 80, "arousalDivisor": 10,
        "weeksPerYear": 40, "recentCap": 20,
        "sexExpCaps": {"novice": 100, "professional": 200, "expert": 300},
    },
}
(OUT / "step0-proposed-npc-life.json").write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
tuning = json.loads(texts["packages/core/src/data/tuning.json"])
trial = dict(tuning["SOCIETY_TRIAL"], rulesetId="tile-society-10")
pins = {
    "SOCIETY_TRIAL": {"before": sha(canonical(tuning["SOCIETY_TRIAL"]).encode()), "after": sha(canonical(trial).encode()), "task": "A2"},
    **{name: {"before": None, "after": sha(canonical(catalog[key]).encode()), "task": "A1"}
       for name, key in [("NPC_ORIGINS", "origins"), ("NPC_HOBBIES", "hobbies"), ("P7A_TRIAL", "P7A_TRIAL")]},
}
pin_file = "packages/core/src/__tests__/catalog-data.test.ts"
replace_line(pin_file, 86,
    "  { name: 'SOCIETY_TRIAL', value: SOCIETY_TRIAL, hash: '" + pins["SOCIETY_TRIAL"]["after"] + "' },",
    "The sole existing hash change is the ruleset string 09 → 10, calculated without importing or editing product code.", "A2")
replace_line(pin_file, 8,
    "  NPC_ORIGINS, NPC_HOBBIES, P7A_TRIAL,\n} from '../index.js';",
    "Import the three new explicitly pinned catalog views.", "A1")
case_add = "  { file: 'npc-life.json', validator: 'validateNpcLife', view: () => ({ origins: NPC_ORIGINS, hobbies: NPC_HOBBIES, P7A_TRIAL }),\n    path: ['origins', 'frontier', 'name'], wrong: 7, message: 'npc-life.json#frontier.name: expected nonempty string' },"
pin_add = "\n".join("  { name: '" + name + "', value: " + name + ", hash: '" + pins[name]["after"] + "' }," for name in ("NPC_ORIGINS", "NPC_HOBBIES", "P7A_TRIAL"))
changes += [
    {"file": pin_file, "line": 21, "before": "] as const;", "after": case_add + "\n] as const;", "reason": "Add a case to all existing validation, exact error, missing-root and deep-freeze checks; retain every existing case.", "task": "A1"},
    {"file": pin_file, "line": 111, "before": "});", "after": "});\nit.each([\n" + pin_add + "\n])('$name keeps the P7-A canonical JSON hash', ({ value, hash }) => {\n  expect(catalogHash(value)).toBe(hash);\n});", "reason": "Add the three new canonical hashes in a separate P7-A pin test; all other pins stay byte-for-byte the same.", "task": "A1"},
]

changes.sort(key=lambda r: (r["file"], r["line"], r["task"]))
(OUT / "step0-proposed-edits.json").write_text(json.dumps(changes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

v9prefix = "packages/persistence/src/__tests__/fixtures/society-v9/"
fixtures = sorted(f for f in tracked if f.startswith(v9prefix))
fixture_rows = []
for file in fixtures:
    data = json.loads(texts[file])
    state = data["state"]
    tile = "city" not in state
    npc_summary = [] if tile else [{"id": n["character"]["id"], "age": n["character"]["age"], "keys": list(n)} for n in state["npcs"]]
    fixture_rows.append({"source": file, "target": file.replace("society-v9", "society-v10"), "sourceLine": 1, "sourceSha256": sha((ROOT/file).read_bytes()), "envelopeKey": "rulesetId" if tile else "cityRulesetId", "stateRulesetPath": "society.rulesetId" if tile else "city.society.rulesetId", "npcs": npc_summary})
(OUT / "step0-fixture-set.json").write_text(json.dumps(fixture_rows, indent=2) + "\n", encoding="utf-8")

test_files = sorted({r["file"] for r in changes if r["file"].endswith((".test.ts", ".spec.ts"))})
new_tests = ["packages/core/src/world/__tests__/npc-life.test.ts", "packages/persistence/src/__tests__/npc-life-records.test.ts", "packages/persistence/src/__tests__/society-v9-fixture.test.ts"]
new_artifacts = ["packages/simulation/src/__tests__/fixtures/p7a-path-diff.ts", "packages/simulation/src/__tests__/fixtures/p7a-path-diff.txt"]
golden = "packages/simulation/src/__tests__/fixtures/catalog-golden.json"
inventory = sorted(set(product + test_files + new_tests + [r["target"] for r in fixture_rows] + new_artifacts + [golden]))
(OUT / "step0-expected-paths.txt").write_text("\n".join(inventory) + "\n", encoding="utf-8")

report = [
    "# P7-A PR A — Step 0 preflight (owner HOLD)",
    "", "Status: A0 research complete; HOLD before RED, existing-test edits, or product edits.",
    f"UTC: {dt.datetime.now(dt.timezone.utc).isoformat()}",
    f"Base / current HEAD: {git('rev-parse','HEAD')}", f"Tree: {git('rev-parse','HEAD^{tree}')}",
    f"Branch: {git('branch','--show-current')}",
    "Owner authority: Tân, 2026-11-17: \"Duyệt P7-A\" and \"Duyệt, giao Builder A\".",
    "The worktree was reused. git fetch origin exited 0. Before branch creation, git status --porcelain=v1 was empty and neither 4173 nor 4174 had a listener. No process was killed; no dependency was installed. No test, build, generator, or smoke has run in A0.",
    "", "## Scope and method", "",
    f"Read all binding documents and repo AGENTS.md in UTF-8. Scanned {len(tracked)} tracked paths ({len(texts)} readable text files), including unit, e2e, tools, historical fixtures and docs. Used rg first for literals and git ls-files for the complete tracked-file pass. Full matched lines are in step0-search-matches.json; exact proposed line edits are in step0-proposed-edits.json.",
    "No .codegraph directory exists in this worktree. The codebase-memory list_projects/index_status/search_graph tools were tried; this path is not indexed. Other indexed worktrees are not evidence for this head. Direct source reads and the complete tracked-path scan are the fallback; no index was created.",
    "The executing-plans task-by-task approach applies after this mandatory A0 HOLD. The explicit instruction to use no subagents takes precedence over its reviewer delegation guidance. Claude remains Tester/Orchestrator; Astra reviews separately.",
    "", "## Decisions required in this one HOLD", "",
    "1. Approve the exact existing-test line edits below and the listed new test paths. This includes current-fixture consumers in simulation, UI unit tests and e2e under the plan's 'edits approved at Step 0' provision. No UI product file changes are proposed.",
    "2. Clarify the historical NPC record scope: binding-plan-2761d05.md:65 restricts session-records.ts to 'v9 historical only', but strict WorldNpc.life makes its line 169 reject ALL v1–v9 NPC rows. Existing session-records.test.ts:12,19 and society-v8-fixture.test.ts:15–18 require exact historical reconstruction and refusal. Recommended: explicitly allow preserving the prior three-key historical NPC validator in session-records.ts for rulesets 01–09, while current v10 always requires life. No life insertion, migration, mutation, missing-life tolerance on v10, or assertion removal. The concrete proposed validator and branch replacement follow below.",
    "3. Clarify golden/envelope scope: binding-plan-2761d05.md:48,100 require only city.society.rulesetId / npcs.*.life.* in the state diff, but serializeCharacterLifeSave at character-life-save.ts:18 also writes outer cityRulesetId. Recommended: keep the strict state whitelist and separately assert that the envelope differs ONLY by cityRulesetId: 'tile-society-09' → 'tile-society-10' (tile fixture outer rulesetId likewise). This mirrors the existing p6b-crafting-path-diff.ts:21–26; it does not permit other state paths.",
    "4. Approve the A1 persistence test filename (new core/persistence tests are globally allowed but binding-plan-2761d05.md:92 only names npc-life.test.ts and catalog-data.test.ts), and settle the A1/A2 GREEN staging conflict described below (plan :95 vs :98–101). Recommended: A1 GREEN covers its full acceptance suite and directly affected current-factory checks; historical/current-fixture integration GREEN is A2 after ruleset 10 and new fixtures. Approve the necessary seeded life initialization in createNpcWorldSession (npc.ts:75–76), in addition to the named WorldNpc/isWorldNpcList changes. These remain in the named product files.",
    "", "## Full existing-test / literal / pin edit list", "",
    f"{len(changes)} exact line replacements/additions across {len(set(r['file'] for r in changes))} existing files; {len(test_files)} are existing test files. Numbers are source lines at the base commit. Multi-line replacements are shown in full. There are no wildcard or blanket test rewrites.",
]
for index, row in enumerate(changes, 1):
    report += [f"### E{index:02d} — {row['file']}:{row['line']} ({row['task']})", "", row["reason"], "", "Before:", "```ts" if not row["file"].endswith(".json") else "```json", row["before"], "```", "After:", "```ts" if not row["file"].endswith(".json") else "```json", row["after"], "```", ""]

report += ["## WorldNpc keys, starter literals, and existing checks", "",
    "- npc.ts:13: `export interface WorldNpc { character: NamedCharacter; traits: string[]; postTileId: string | null }` → `export interface WorldNpc { character: NamedCharacter; traits: string[]; postTileId: string | null; life: NpcLife }` (life last).",
    "- npc.ts:50: `if (!hasWeeklyKeys(npc, ['character', 'traits', 'postTileId'])) return false;` → `if (!hasWeeklyKeys(npc, ['character', 'traits', 'postTileId', 'life']) || !isNpcLife(npc.life)) return false;`. Current NPCs must be female adults; the generic shared NamedCharacter validator stays generic. Validate derived age at the single city world week; preserve character.health unchanged.",
    "- npc-content.ts:27,29,31: append respectively `life: createNpcLife(0, 'npc_starter_1', 27)`, `life: createNpcLife(0, 'npc_starter_2', 31)`, `life: createNpcLife(0, 'npc_starter_3', 24)` after `postTileId: null`. Template ages, names, health, skills, traits and ordering remain exact.",
    "- npc.ts:76: retain the exact existing name-draw order/stream, then initialize each `npc.life = createNpcLife(base.value.outside.seed, npc.character.id, npc.character.age);` using the independent NPC life stream. No draws added to the name/outside/item streams.",
    "- npc.test.ts:10,38 stay unchanged (full template comparison at seed 0). The cross-seed assertion at :62 changes only as E-listed; every old field remains exactly compared. New tests cover life on all three starters, same seed/id determinism, seed/id variation, deep isolation and ages 27/31/24 at week 1.",
    "- character/__tests__/validate.test.ts:308–314 already validates lists made by the factory; no literal edit needed. :264 tests changed character.age boundary values; do not add an unrequested character.age === derived-age invariant. Existing shared-character and UI age fixtures stay unchanged.",
    "- character/__tests__/session.test.ts:132–133,139–160,193–199; character/__tests__/describe.test.ts:8,19; world-npc-session.spec.ts:7,34 and historical inline NPC snapshots in character-life.spec.ts:297 / ui character-life-session.test.ts:62 stay unchanged. Profile fixtures are CharacterProfile/NamedCharacter, not a raw WorldNpc missing life. Historical checkpoint strings remain original bytes and continue to be refused.",
    "- No tracked .snap files were found. Observation key tests (character-life-observation.test.ts:65,81) describe the existing observation DTO, not WorldNpc, and stay unchanged. UI NPC sheet/weekly/report expansion belongs to PR B/C.",
    "", "## Historical NPC record preservation — concrete scope amendment proposal", "",
    "The following is proposed text only, not applied. It preserves the exact old list checks in the persistence module. A2 changes the existing historical city regex at session-records.ts:18 from `/^tile-society-0([1-8])$/` to `/^tile-society-0([1-9])$/`. That regex must not be the only compatibility edit.",
    "In A2 at the NPC branch, use current validation when meta.rulesetId === SOCIETY_RULESET; use the historical validator only for /^tile-society-0[1-9]$/. Keep all id/profile/order checks and error refs unchanged. A1/A2 sequencing is unresolved until the owner answers; see the next paragraph.",
    "A1/A2 dependency conflict: A1 adds life while SOCIETY_RULESET remains 09 until A2. The nine existing v9 fixtures have no life and are still treated as current in session-records.test.ts:14. A1 cannot both require life for current records and keep all existing fixture tests GREEN without an approved staging policy. Recommended owner correction: A1 GREEN is its complete RED acceptance suite plus directly affected current-factory checks; full legacy/current-fixture GREEN is A2 after ruleset 10 and v10 fixtures. A1 must not introduce a temporary missing-life acceptance for v9 current saves. Historical validation is added in A2 under the strict old-ruleset branch. Alternative sequencing needs an explicit owner correction, not a silent builder choice.",
    "Proposed A2 helper (imports isNamedCharacterRecord, managerSlotTileIds, WORLD_TRAITS and type TileTrialState from the existing core exports; local descriptor-only dense reader keeps the previous rejection behavior):", "```ts",
    "function isHistoricalNpcList(raw: unknown, city: TileTrialState): boolean {\n  try {\n    if (!Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype ||\n        Reflect.ownKeys(raw).length !== raw.length + 1) return false;\n    const slots = managerSlotTileIds(city), traitIds = WORLD_TRAITS.map(t => t.id);\n    const ids = new Set<string>(), posts = new Set<string>();\n    for (let i = 0; i < raw.length; i++) {\n      const entry = Object.getOwnPropertyDescriptor(raw, String(i));\n      if (!entry?.enumerable || !('value' in entry)) return false;\n      const npc = entry.value;\n      if (!hasWeeklyKeys(npc, ['character', 'traits', 'postTileId'])) return false;\n      const c = npc.character, traits = npc.traits;\n      if (!isNamedCharacterRecord(c) || ids.has(c.id) || !Array.isArray(traits) ||\n          Object.getPrototypeOf(traits) !== Array.prototype || Reflect.ownKeys(traits).length !== traits.length + 1) return false;\n      const seenTraits = new Set<string>();\n      for (let j = 0; j < traits.length; j++) {\n        const trait = Object.getOwnPropertyDescriptor(traits, String(j));\n        if (!trait?.enumerable || !('value' in trait) || typeof trait.value !== 'string' ||\n            !traitIds.includes(trait.value) || seenTraits.has(trait.value)) return false;\n        seenTraits.add(trait.value);\n      }\n      const post = npc.postTileId;\n      if (post !== null && (typeof post !== 'string' || !slots.includes(post) || posts.has(post))) return false;\n      ids.add(c.id); if (post !== null) posts.add(post);\n    }\n    return true;\n  } catch { return false; }\n}", "```", "",
    "Replace only the validator subexpression in session-records.ts:169:", "```ts",
    "// Before\n!isWorldNpcList([...npcs.map(n => n.npc), v.npc], city)\n// After (A2 only)\n!(meta.rulesetId === SOCIETY_RULESET\n  ? isWorldNpcList([...npcs.map(n => n.npc), v.npc], city)\n  : /^tile-society-0[1-9]$/.test(meta.rulesetId) && isHistoricalNpcList([...npcs.map(n => n.npc), v.npc], city))", "```", "",
    "No existing historical assertion changes beyond the v10 current-branch selector listed above. Historical rows are reconstructed unchanged solely for the existing old-checkpoint refusal. No migration is implemented.",
    "", "## Expected fixture and golden path set", "",
    "Exactly 10 new fixtures under packages/persistence/src/__tests__/fixtures/society-v10/; every society-v1…v9 file remains byte-identical. Source lines are 1 because these files are minified JSON. The state transforms are ruleset only plus each existing NPC gets life as its last key; envelope transforms are separately exact-checked. Seed and existing NPC character.age feed createNpcLife, without rewriting any pre-existing state field. All 9 Character Life scenarios use the same three NPCs (ages 27,31,24).",
]
for row in fixture_rows:
    report += [f"- `{row['source']}:1` → `{row['target']}`; envelope `{row['envelopeKey']}` 09 → 10; state `{row['stateRulesetPath']}` 09 → 10" + ("; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`." if row["npcs"] else "; no NPC/life paths (tile-only fixture).")]

gold = json.loads(texts[golden])
report += ["", f"`{golden}` (existing, {len(gold)} entries):", "",
    "- Keep seeds [0,42,20261028], 60 weeks, crimeEvents/crisisReports/outsideReports and array order exact. Each session is a JSON string; decode it for the path diff and separately exact-check its outer envelope. The current source lines containing session strings are 8,16,24 (confirmed by the scanner).",
    "- Allowed state leaves: `city.society.rulesetId`; `npcs.{0,1,2}.life.{mind,lust,lustBase,arousal,stress,beauty,birthWeek,origin,hobbies.{0,1},working,sexExp.{hand,mouth,breast,vagina,ass}.{level,exp},history.{counters,recent}}`. Report `npcLife` is not expected in PR A. Every other diff is HOLD. Added life objects must be expanded into leaves or explicitly checked as the complete life subtree; absence must not bypass the whitelist.",
    "- Use the unchanged existing make-catalog-golden.ts once with GENERATE_CATALOG_GOLDEN=1. Preserve the base JSON outside the worktree before removal, because the generator uses flag 'wx' and refuses overwrite. Do not edit the generator, scenario, its consumers, historical path-diff scripts or past path-diff outputs.",
    "- New committed artifacts: `packages/simulation/src/__tests__/fixtures/p7a-path-diff.ts` and `.txt`. Compare base 753e450 against the generated golden/v10 set; assert all historical fixture and generator Git blobs unchanged. Keep every existing golden test exact, including its existing 20 s timeout and mutation-detection test.",
    "", "## Pin changes", "", "Hashes are SHA-256(JSON.stringify(view)); proposed new catalog text is step0-proposed-npc-life.json. These are computed from data only, before product imports or edits.", "",
]
for name, row in pins.items():
    report += [f"- `{name}` ({row['task']}): `{row['before'] or '(new)'}` → `{row['after']}`."]

report += ["", "## New tests and acceptance placement", "",
    "- A1 `packages/core/src/world/__tests__/npc-life.test.ts`: full approved catalog validation/exact malformed-copy messages; deterministic independent NPC RNG, distinct hobbies, fixed starts and ranges; deep isolation; title edges 18/29/30/49/50 and 40-week boundaries; isNpcLife rejects all Review Focus 5 cases plus malformed/untrusted shapes; three starter lives and unchanged shown ages. No weekly-rule code/tests added.",
    "- A1 proposed addition `packages/persistence/src/__tests__/npc-life-records.test.ts`: each Review Focus 5 imported-life case yields StoreRecordError with ref characters:npc_starter_1; original stored rows and serialized bytes stay unchanged; actual store import failure preserves the previously stored session. This path needs explicit per-task scope approval. A2 can add the byte-identical v10 life save/load acceptance to this file.",
    "- A2 `packages/persistence/src/__tests__/society-v9-fixture.test.ts` (new): mirror the entire existing v8 refusal matrix for the 9 v9 Character Life files plus tile fixture, including store reconstruction, exact state/source-byte preservation, old-checkpoint message, and absence of life migration. Existing v8 tests stay untouched.",
    "", "## Allowlist / task Files exceptions and unchanged candidates", "",
    "Existing test edits outside specifically named task Files (requested under Step 0's edit-approval clause):", "",
]
for file in test_files:
    if file != pin_file:
        report += [f"- `{file}` — " + ("A1 preserves the pre-P7 cross-seed assertion for existing fields." if file.endswith("/npc.test.ts") else "A2 current ruleset/fixture reference; exact affected lines are E-listed above.")]
report += ["", "Product-file scope clarifications: session-records.ts historical NPC shape branch (beyond a regex-only v9 addition), and npc.ts session-seeded life initialization (required by Decision 3). New persistence test paths need per-task Files clarification. No new subsystem, new dependency, weekly code, UI product code, docs file, timeout or threshold is proposed.",
    "", "Unchanged candidates explicitly checked:", "",
    "- `packages/simulation/src/__tests__/fixtures/make-catalog-golden.ts`, `catalog-golden.test.ts`, and all older golden/path-diff scripts/outputs: consumers remain exact and historical evidence is not rewritten.",
    "- `packages/persistence/src/__tests__/society-v1-fixture.test.ts` through `society-v8-fixture.test.ts`, `garrison-fixtures.test.ts`, the v7 historical item-records test, `society-only-save.test.ts`, legacy-v1/goods-v1 snapshots, old inline e2e checkpoint strings: preserve fixtures/assertions and old-save refusal. New strict life must not make recordsToSession throw on their historical NPCs.",
    "- `packages/ui/src/data-inspector.ts:22–43` / `__tests__/data-inspector.test.ts:38–50`: explicit five-catalog inspector registry; it does not auto-enumerate data files (already omits items/recipes). No PR A UI expansion or test baseline change.",
    "- `packages/simulation/src/__tests__/lord-health.test.ts:73` and `society-renewable-support.test.ts:160`: retain the owner-approved 15 s timeouts. The :26 fixture path in lord-health.test.ts is the only proposed edit in that file. Every other timeout remains unchanged.",
    "- Existing identity/health/skills/profile/body metrics/observation DTO assertions, 320/375 e2e and performance thresholds stay exact. No assertion is dropped or converted to a partial matcher.",
    "", "## Full expected product-branch file inventory", "",
    f"Expected {len(inventory)} paths: {len(product)} named product files (including 2 new), {len(test_files)} existing tests, {len(new_tests)} new tests, 10 new fixtures, 1 golden and 2 new path-diff artifacts. This is the candidate inventory, not authorization to bypass the owner HOLD.", "",
    "```text", *inventory, "```", "",
    "## Handoff state", "",
    "No RED/GREEN or A3 PASS claimed. No implementation commit, push, PR, or merge. Product status is empty. Branch/base/tree are at the top. All A0 evidence lives outside the worktree at C:/Users/Admin/.t3/local-drafts/p7a-prA/; no docs files were written on the product branch. Existing worktrees retained; storage reclaimed: 0 bytes. Ports must be rechecked before smoke and on final handoff.",
    "", "Owner action: approve this Step 0 inventory and resolve the historical-record/A1-staging and envelope-guard clarifications. Until that answer, HOLD remains in force.", "",
]

# Ensure the expected golden session-string lines are mechanically verified.
actual_golden_lines = [i for i, line in enumerate(texts[golden].splitlines(), 1) if '"session":' in line]
report = [line.replace("8,16,24", ",".join(map(str, actual_golden_lines))) for line in report]
(OUT / "STEP0-HOLD.md").write_text("\n".join(report), encoding="utf-8")
summary = json.dumps({"trackedPaths": len(tracked), "textFiles": len(texts), "matchedLines": len(matches), "proposedLineEdits": len(changes), "existingTestFiles": len(test_files), "expectedPaths": len(inventory), "fixtureCount": len(fixture_rows), "goldenSessionLines": actual_golden_lines, "pins": pins, "status": git("status", "--porcelain=v1")}, indent=2)
(OUT / "step0-scan-summary.txt").write_text(summary + "\n", encoding="utf-8")
print(summary)
