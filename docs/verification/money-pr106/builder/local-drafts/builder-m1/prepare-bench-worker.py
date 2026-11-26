from pathlib import Path
from hashlib import sha256
import sys
b=Path(__file__).resolve().parent
source = Path(sys.argv[1]).read_bytes()
text=source.decode('utf-8')
patches={
 'const [root, dependencies, mode, variant, file, largestSave] = process.argv.slice(2);':
   "const [root, dependencies, mode, variant, file, largestSave, difficulty = 'normal'] = process.argv.slice(2);",
 "currentName:'Market Keeper'})).value;":
   "currentName:'Market Keeper'}, difficulty)).value;",
 "if (mode === 'prepare') {":
   """if (mode === 'fresh-save') {
  const source = successful(core.createCharacterLifeSession(20261028, {
    ...structuredClone(core.DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper',
  }, difficulty)).value;
  const state = structuredClone(source);
  if (variant === 'populated') state.player.purse = {
    moneyMilli: 1201, levyPercent: 5, donatedThisWeekMilli: 1000,
    robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 201 },
  };
  const encoded = successful(persist.serializeCharacterLifeSave(state)).text;
  const decoded = successful(persist.deserializeCharacterLifeSave(encoded)).state;
  assert.deepEqual(decoded, state);
  assert.equal(successful(persist.serializeCharacterLifeSave(decoded)).text, encoded);
  writeFileSync(file,encoded,{encoding:'utf8',flag:'wx'});
  console.log(JSON.stringify({
    variant, difficulty, bytes: Buffer.byteLength(encoded), sha256: sha(encoded),
    purse: state.player.purse ?? null, ruleset: state.city.society.rulesetId,
  }));
} else if (mode === 'prepare') {""",
 "delete comparable.city.society.acquisition;\n  delete comparable.city.society.rulesetId;":
   """delete comparable.city.society.rulesetId;
  delete comparable.city.society.difficulty;
  delete comparable.player.purse;""",
}
for key,value in patches.items():
 end='\r\n' if '\r\n' in text else '\n'
 a=key.replace('\n',end);z=value.replace('\n',end)
 assert text.count(a)==1,key
 text=text.replace(a,z)
(b/'m1.4-bench-worker.mjs').write_bytes(text.encode('utf-8'))
print('B3 worker SHA-256',sha256(source).hexdigest())
print('M1 worker SHA-256',sha256(text.encode()).hexdigest())
