import base64, difflib, hashlib, json, re, subprocess
from pathlib import Path

builder = Path(__file__).resolve().parent
tree = builder.parent / '_scratch/tree'
real = Path('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01')
records = []

def encoded(value):
    return None if value is None else base64.b64encode(value).decode('ascii')

def digest(value):
    return None if value is None else hashlib.sha256(value).hexdigest()

def draft(path, rationale, convert):
    current = real / path
    before = current.read_bytes() if current.exists() else None
    after = convert(before)
    assert before != after, path
    diff = list(difflib.unified_diff(
        [] if before is None else before.decode('utf-8').splitlines(keepends=True),
        after.decode('utf-8').splitlines(keepends=True), fromfile='a/' + path, tofile='b/' + path))
    records.append(dict(path=path, why=rationale, beforeSha256=digest(before), afterSha256=digest(after),
                        beforeBase64=encoded(before), afterBase64=encoded(after), unifiedDiff=''.join(diff)))
    (tree / path).write_bytes(after)

def replace(source, old, new):
    assert source.count(old) == 1, (source.count(old), old)
    return source.replace(old, new)

def pins(path, rationale, pairs):
    def patch(source):
        for old, new in pairs:
            source = replace(source, old.encode(), new.encode())
        return source
    draft(path, rationale, patch)

test_fixture = '''type TuningModule = {
  default: {
    TILE_TRIAL_BALANCE: { taxGoldPerResident: number };
    GOODS_STOCK_TRIAL: { initialFoodMilli: number; initialGoodsMilli: number; goldPerGoodsMilli: number };
  };
};
type BuildingModule = { default: { trial: Record<string, { upkeepMilli: number }> } };

export async function legacyEconomyTuning(load: () => Promise<unknown>) {
  const module = await load() as TuningModule;
  return {
    ...module,
    default: {
      ...module.default,
      TILE_TRIAL_BALANCE: { ...module.default.TILE_TRIAL_BALANCE, taxGoldPerResident: 30 },
      GOODS_STOCK_TRIAL: { ...module.default.GOODS_STOCK_TRIAL, initialFoodMilli: 20000, initialGoodsMilli: 10000, goldPerGoodsMilli: 1000 },
    },
  };
}

export async function legacyExtractionUpkeep(load: () => Promise<unknown>) {
  const module = await load() as BuildingModule;
  const trial = { ...module.default.trial };
  for (const id of ['logging', 'mine', 'quarry', 'sheep-pasture', 'herb-garden']) {
    trial[id] = { ...trial[id], upkeepMilli: 500 };
  }
  return { ...module, default: { ...module.default, trial } };
}
'''
draft('packages/simulation/src/__tests__/fixtures/legacy-economy.ts',
      'Explicit catalog inputs for tests that assert legacy deterministic outcomes or exact affordability thresholds. Difficulty and other data come from the actual catalog.',
      lambda _: test_fixture.encode())

suite_reasons = {
    'authority-refusals': ('fixed-liquidity immigration branches at Authority 70', True),
    'craft-week': ('sixty-week replay digests and the Hospital nonpayment branch', True),
    'household-week': ('the budget where wages, tile operations and only one home can be paid', False),
    'items-week': ('the unchanged 60-week PR A report digests', True),
    'law-week': ('the five-week legacy checkpoint and independent tax and lobby calculations', False),
    'lord-health': ('the exact budget that leaves the Hospital unfunded', False),
    'order-tax-week': ('independent authority/tax arithmetic and the cutoff with no cash between guaranteed credit and top-up', False),
    'order-week': ('the valid zero-opening-Gold case with unpaid operating and home charges, plus independent authority-floor arithmetic', False),
    'society-command-transaction': ('exact-budget atomic refusals, whole batch counts and inventory conservation', False),
    'society-end-week': ('exact Goods distribution, an unfunded Slave Quarters before the tax bonus, and a funded immigration target', True),
    'society-renewable-support': ('the immigration liquidity and target refusals and the 45-week stop/resume sequence', True),
    'society-stock-integrity': ('exact-budget stock arithmetic, Gold revenue floors, and the immigration liquidity branch', True),
    'society-stock-policy-ports': ('exact opening/closing Goods and incomplete Wood-batch behavior', False),
    'tile-trial-p7b': ('exact Ring and housing Gold and Food, and the two-home payment cutoff', True),
}
def mock(path, reason, extraction, ui=False):
    def patch(source):
        eol = b'\r\n' if b'\r\n' in source else b'\n'
        import_pattern = rb"(?m)^(?:\xef\xbb\xbf)?import\s*\{([^{}\r\n]+)\}\s*from\s*['\"]vitest['\"];"
        match = re.search(import_pattern, source)
        assert match, path
        if not re.search(rb'\bvi\b', match[1]):
            source = source[:match.start(1)] + match[1].rstrip() + b', vi ' + source[match.end(1):]
        helper = '../../../simulation/src/__tests__/fixtures/legacy-economy.js' if ui else './fixtures/legacy-economy.js'
        imports = [('tuning', 'legacyEconomyTuning')]
        if extraction:
            imports.append(('buildings', 'legacyExtractionUpkeep'))
        lines = ['// Keep the original balance inputs for ' + reason + '.']
        for catalog, factory in imports:
            lines += [f"vi.mock('../../../core/src/data/{catalog}.json', async load => {{",
                      f"  const {{ {factory} }} = await import('{helper}');",
                      f"  return {factory}(load);", '});']
        next_line = eol.join(line.encode() for line in lines)
        marker = eol + eol
        offset = source.index(marker)
        source = source[:offset] + marker + next_line + source[offset:]
        if path.endswith('/law-week.test.ts'):
            source = replace(source, b' let s=decoded.state,other=structuredClone(s);', eol.join([
                b' const city=decoded.state.city;',
                b' city.world.settlements[city.world.activeSettlementId!].inventory.food=20000;',
                b' city.goodsStock!.amountMilli=10000;',
                b' let s=decoded.state,other=structuredClone(s);']))
        return source
    draft(path, 'Keep assertions and branch-driving inputs for ' + reason + '.', patch)

for suite, (reason, extraction) in suite_reasons.items():
    mock('packages/simulation/src/__tests__/' + suite + '.test.ts', reason, extraction)
mock('packages/ui/src/__tests__/crafting-view.test.ts',
     'same-week Herbs consumption and the exact unfunded-tile actual/estimate checks', True, ui=True)

values = subprocess.check_output(
    ['node', '--import', './scripts/p7b-road-balance.ts', '--input-type=module'],
    input=b'''const c=await import("./packages/core/src/index.ts");
const {createHash}=await import("node:crypto");
for (const k of ["TRIAL_BUILDINGS","GOODS_STOCK_TRIAL","TILE_TRIAL_BALANCE"])
  console.log(k,createHash("sha256").update(JSON.stringify(c[k]),"utf8").digest("hex"));''', cwd=tree,
).decode().splitlines()
hashes = dict(line.split() for line in values)
pins('packages/core/src/__tests__/catalog-data.test.ts', 'Pin canonical JSON from the actual Round 3 runtime exports.', [
    ('11eabe3f7b69f2b87e06936bd57934e3ed27c80138dda99793a5347d399de941', hashes['TRIAL_BUILDINGS']),
    ('d92145743557d8c74bf6f91af7645e7fa7553d6839e4ae0c8d2a441a1079fe65', hashes['GOODS_STOCK_TRIAL']),
    ('8c6f563db7d15d0e01ca16852bd5700d2c8504a279f63d14ffcd7e01999b6075', hashes['TILE_TRIAL_BALANCE']),
])
pins('packages/core/src/__tests__/society-world-integrity.test.ts', 'Assert the live opening Food on the active settlement.',
     [('gold: 120000, wheat: 0, food: 20000', 'gold: 120000, wheat: 0, food: 40000')])
pins('packages/core/src/trial/__tests__/society-stock-integrity.test.ts', 'Pin the live opening Food and Goods, preserving all stock shape assertions.',
     [('food: 20000, gold: 120000', 'food: 40000, gold: 120000'), ('amountMilli: 10000 });', 'amountMilli: 30000 });')])
pins('packages/core/src/trial/__tests__/outside.test.ts', 'Pin the three retuned extractors in the activated catalog matrix, with the remaining costs and staff assertions intact.',
     [('2,2,3000,2000,0,500', '2,2,3000,2000,0,7500'), ('2,2,2000,1000,0,500', '2,2,2000,1000,0,7500'),
      ('3,2,3000,1000,1000,500', '3,2,3000,1000,1000,7500')])
pins('packages/simulation/src/__tests__/order-commands.test.ts', 'Compare active weekly order tax against the live 24,000 milli at 100 residents.',
     [(').toBe(-600)', ').toBe(-4800)'), ('ai.gold-600-bo.theftMilli.gold!', 'ai.gold-4800-bo.theftMilli.gold!'),
      ('bi.gold+=600+bo.theftMilli.gold!', 'bi.gold+=4800+bo.theftMilli.gold!')])
pins('tests/e2e/world-session.spec.ts', 'Pin the live opening Goods on each new seeded world.',
     [('a.city.goodsStock!.amountMilli).toBe(10000)', 'a.city.goodsStock!.amountMilli).toBe(30000)')])
pins('tests/e2e/society.spec.ts', 'The rich fixture overrides Gold, Wood and Iron. Verify the starting Food remains intact after Ring construction.',
     [('gold:100000,wheat:0,food:20000', 'gold:100000,wheat:0,food:40000')])
pins('tests/e2e/goods-stock.spec.ts', 'Keep both browser widths and every five-week parity check; independently subtract 1,450 per week from the new opening stock.',
     [("toHaveText('10')", "toHaveText('30')"), ('10000 - week * 1450', '30000 - week * 1450'),
      ("toHaveText('2.75')", "toHaveText('22.75')")])
(builder / 'round3-test-expectation-byte-proposals.json').write_text(
    json.dumps(dict(status='For owner approval. Composed solely in external scratch.',
                    measuredCatalogHashes=hashes, files=records), indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Wrote test byte proposals for', len(records), 'files.')
