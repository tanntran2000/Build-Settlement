from copy import deepcopy
import datetime as dt
from hashlib import sha256
import json
from pathlib import Path
import statistics as stats
import subprocess
import sys

here=Path(__file__).resolve().parent
b2=Path.cwd()
main=Path(sys.argv[1]).resolve()
expected_main='f73595b449db84b988d44a44cd33620efca9ecad'
expected_b2='f31310cb791f549a7672be47219c7578678b7058'
expected_input='6512ceb7562231ed216a0a258e90d825e9bc39c778a860fc6618a9a2359887f2'
cutoff=50
pairs=12
utc=lambda:dt.datetime.now(dt.timezone.utc).isoformat()

def git(root,*args):
    return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()

def digest(value):
    return sha256(value).hexdigest()

def canonical(value):
    return json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()

def write(name,data):
    (here/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8',newline='\n')

assert git(main,'rev-parse','HEAD')==expected_main
assert git(b2,'rev-parse','HEAD')==expected_b2
assert git(b2,'rev-parse','origin/main')==expected_main
assert not git(main,'status','--porcelain=v1','--untracked-files=all')
assert not git(b2,'status','--porcelain=v1','--untracked-files=all')
input_bytes=(here.parent/'b2-3-100npc-roundtrip.json').read_bytes()
assert digest(input_bytes)==expected_input
native_b2=json.loads(input_bytes)
native_main=deepcopy(native_b2)
assert native_main['cityRulesetId']==native_main['state']['city']['society']['rulesetId']=='tile-society-12'
native_main['cityRulesetId']='tile-society-11'
native_main['state']['city']['society']['rulesetId']='tile-society-11'
assert len(native_main['state']['npcs'])==len(native_main['state']['profiles'])==100
for npc in native_main['state']['npcs']:
    assert npc.pop('household')
common_state=deepcopy(native_main['state'])
del common_state['city']['society']['rulesetId']
common_b2=deepcopy(native_b2['state'])
del common_b2['city']['society']['rulesetId']
for npc in common_b2['npcs']:
    del npc['household']
assert canonical(common_state)==canonical(common_b2)
inputs={'main':here/'main-100npc-input.json','b2':here/'b2-100npc-input.json'}
inputs['main'].write_bytes(json.dumps(native_main,ensure_ascii=False,separators=(',',':')).encode())
inputs['b2'].write_bytes(input_bytes)
roots={'main':main,'b2':b2}
info={side:{'head':git(roots[side],'rev-parse','HEAD'),'tree':git(roots[side],'rev-parse','HEAD^{tree}'),
            'checkout':str(roots[side]),'inputSha256':digest(inputs[side].read_bytes())} for side in roots}
input_facts={'commonStateSha256':digest(canonical(common_state)), 'sharedNpcCount':100,
             'inputDifferences':['cityRulesetId','state.city.society.rulesetId','state.npcs[*].household'],
             'sharedGoldMilli':next(iter(common_state['city']['world']['settlements'].values()))['inventory']['gold'],
             'sharedWeek':common_state['city']['world']['week'],'sharedWorldSeed':common_state['city']['world']['worldMetadata']['worldSeed']}
write('benchmark-inputs.json',{'checkouts':info,**input_facts})

def run(side,mode):
    begin=utc()
    command=['node',str(here/'end-week-child.mjs'),str(roots[side]),str(b2),str(inputs[side]),mode]
    process=subprocess.run(command,cwd=roots[side],capture_output=True,encoding='utf-8',errors='replace')
    if process.returncode:
        print(process.stdout,process.stderr,file=sys.stderr,flush=True)
        raise SystemExit(process.returncode)
    result=json.loads(process.stdout)
    assert result['inputSha256']==info[side]['inputSha256']
    assert len(result['ticksMs'])==(1 if mode=='probe' else 21)
    return {'side':side,'utcStart':begin,'utcEnd':utc(),'command':command,**result}

probe={side:run(side,'probe') for side in roots}
write('benchmark-probes.json',probe)
assert probe['b2']['save']['inputByteIdentical'] and probe['b2']['save']['bytes']<=1048576
assert probe['main']['node']==probe['b2']['node']
print('Both input projections passed the real command and serialized byte-identically on re-save.',flush=True)

raw=[]
for pair in range(1,pairs+1):
    order=('main','b2') if pair%2 else ('b2','main')
    runs={side:run(side,'sample') for side in order}
    for side,result in runs.items():
        assert result['node']==probe[side]['node']
        assert result['outputSha256']==probe[side]['outputSha256']
        cold,*warm=result['ticksMs']
        result['coldMs']=cold
        result['warmMedianMs']=stats.median(warm)
        result['warmTicksAtOrAbove50ms']=sum(w>=cutoff for w in warm)
    delta=runs['b2']['warmMedianMs']-runs['main']['warmMedianMs']
    raw.append({'pair':pair,'order':order,'runs':runs,'pairedWarmMedianDeltaMs':delta})
    write('benchmark-raw.json',raw)
    print(f"Pair {pair:02d} {' then '.join(order)}: main {runs['main']['warmMedianMs']:.3f} ms, B2 {runs['b2']['warmMedianMs']:.3f} ms, delta {delta:+.3f} ms",flush=True)

variants={}
noise=[]
for side in roots:
    runs=[entry['runs'][side] for entry in raw]
    meds=[r['warmMedianMs'] for r in runs]
    cold=[r['coldMs'] for r in runs]
    warm=[w for r in runs for w in r['ticksMs'][1:]]
    noise.extend(abs(b-a) for a,b in zip(meds,meds[1:]))
    variants[side]={'coldMedianMs':stats.median(cold),'coldRangeMs':[min(cold),max(cold)],
                    'coldAtOrAbove50ms':sum(t>=cutoff for t in cold),'coldSampleCount':len(cold),
                    'medianWarmProcessMedianMs':stats.median(meds),'warmProcessMedianRangeMs':[min(meds),max(meds)],
                    'warmProcessMedianAtOrAbove50ms':sum(t>=cutoff for t in meds),
                    'pooledWarmMedianMs':stats.median(warm),'warmTickRangeMs':[min(warm),max(warm)],
                    'warmAtOrAbove50ms':sum(t>=cutoff for t in warm),'warmSampleCount':len(warm)}
deltas=sorted(row['pairedWarmMedianDeltaMs'] for row in raw)
interval=[deltas[2],deltas[9]]
median_delta=stats.median(deltas)
noise_ms=stats.median(noise)
if interval[0]>0: decision='real positive warm cost'
elif median_delta<=noise_ms: decision='no warm cost distinguishable from run-to-run noise'
else: decision='unresolved positive warm shift'
summary={'pairs':pairs,'thresholdMs':cutoff,'checkouts':info,'variants':variants,'input':input_facts,
         'b2Save':probe['b2']['save'],'pairedWarmMedianDeltaMs':median_delta,'pairedDeltaRangeMs':[deltas[0],deltas[-1]],
         'exactMedianInterval96_14Ms':interval,'sameRevisionAdjacentChangeMedianMs':noise_ms,'conclusion':decision}
write('benchmark-summary.json',summary)
print(json.dumps(summary,indent=2),flush=True)
