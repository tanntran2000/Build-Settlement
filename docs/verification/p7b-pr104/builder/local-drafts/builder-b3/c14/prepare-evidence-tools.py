from pathlib import Path
import shutil

here = Path(__file__).resolve().parent
for name in ('capture-environment.ps1', 'run-gates.ps1', 'served-and-bundle.mjs', 'rerun-smoke-failures.py'):
    shutil.copy2(here.parent/name, here/name)

def adapt(name, *changes):
    value = (here.parent/name).read_text(encoding='utf-8')
    for before, after in changes:
        assert value.count(before) == 1, (name, before)
        value = value.replace(before, after)
    (here/name).write_text(value, encoding='utf-8', newline='\n')

adapt('bench-worker.mjs',
    ('mode, variant, file] =', 'mode, variant, file, largestSave] ='),
    ("""  const state = ready(variant);
  const encoded = successful(persist.serializeCharacterLifeSave(state));""",
     """  let state;
  if (variant === 'market') {
    const browserSave = readFileSync(largestSave, 'utf8');
    state = JSON.parse(browserSave).state;
    if (root !== dependencies) {
      delete state.city.society.acquisition;
      state.city.society.rulesetId = core.SOCIETY_RULESET;
    } else {
      assert.equal(successful(persist.serializeCharacterLifeSave(state)).text, browserSave);
    }
  } else {
    state = ready(variant);
  }
  const encoded = successful(persist.serializeCharacterLifeSave(state));"""),
    ('npcCount:state.npcs.length,stock:acquisition?.stock.length??0,lots:acquisition?.lots.length??0}));',
     '''npcCount:state.npcs.length,stock:acquisition?.stock.length??0,lots:acquisition?.lots.length??0,
    actionsPerLot:acquisition?.lots.map(lot=>lot.raises.length)??[],departures:acquisition?.departures.length??0}));''')
)
adapt('paired-timings.py',
    ("WORKER = EVIDENCE/'bench-worker.mjs'", "WORKER = EVIDENCE/'bench-worker.mjs'\nLARGEST = EVIDENCE/'save-size'/'largest-save.json'\nassert LARGEST.is_file()"),
    ('command,variant,str(file)]', 'command,variant,str(file),str(LARGEST)]'),
    ('    cases={}', '    cases={}'),
    ("assert (inputs['head']['stock'],inputs['head']['lots'])==(12,2)",
     """assert (inputs['head']['stock'],inputs['head']['lots'],inputs['head']['actionsPerLot'],inputs['head']['departures'])==(12,2,[4,4],14)
            assert file.exists()"""),
    ("'method':'Five alternating triples on the same machine. Each fresh process uses the same untouched checkpoint for all trials. Baseline noise is the maximum absolute main-A/main-B warm-median gap. Detect repeatable added End Week cost when at least four of five candidate deltas exceed that observed noise.'",
     "'method':'Five alternating triples on one machine. Each fresh process uses the same untouched checkpoint. The market checkpoint is the exact browser-measured save. Main uses the same shared state encoded via its v12 codec with the v13 acquisition subtree excluded. Baseline noise is the maximum absolute main-A/main-A2 warm-median gap. A warm cost is repeatable when at least four of five candidate deltas exceed that noise.'"),
    ("hold=any(item['warmCostAboveNoise'] for key,item in aggregate.items() if key.endswith('-tick'))",
     "hold=any(item['warmCostAboveNoise'] for item in aggregate.values())")
)
