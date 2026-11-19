"""Recompute requested statistics from all retained per-tick samples; no gameplay runs."""
from pathlib import Path
from collections import defaultdict
import hashlib
import json
import math

OUT=Path(__file__).resolve().parent
load=lambda name:json.loads((OUT/name).read_text(encoding='utf-8-sig'))
names=['01-base','02-head','03-base','04-head','05-base','06-head']
runs=[load(name+'.json') for name in names]
def stats(values):
    ordered=sorted(values)
    return {'n':len(values),'max':max(values),'p95':ordered[math.ceil(.95*len(values))-1],'mean':sum(values)/len(values),'over50':sum(v>50 for v in values)}
assert all(r['exitCode']==0 and len(r['ticks'])==60 for r in runs)
assert len({r['pid'] for r in runs})==6
assert len({r['harnessSha256'] for r in runs})==1
assert runs[0]['harnessSha256']==hashlib.sha256((OUT/'profile-harness.mjs').read_bytes()).hexdigest()
assert len({r['initialSessionSha256'] for r in runs})==1
assert len({(r['node'],r['v8'],r['vite']) for r in runs})==1
for revision in ['base','head']:
    assert len({r['finalSessionSha256'] for r in runs if r['revision']==revision})==1
cpu=[]
rows=[]
for run in runs:
    row={'run':run['run'],'revision':run['revision'],'cpuStart':load('machine-'+run['run']+'.json')['cpu'],'endWeek':{},'life':None,'lifeClone':None,'postTransitions':None}
    for key,field in [('endWeek','endWeekMs'),('life','lifeMs'),('lifeClone','lifeCloneMs'),('postTransitions','postTransitionsMs')]:
        if key!='endWeek' and run['revision']=='base':continue
        row[key]={view:stats([t[field] for t in ticks]) for view,ticks in [('all',run['ticks']),('warm',run['ticks'][5:]),('firstFive',run['ticks'][:5])]}
        assert row[key]==run[key]
    row['maxTick']=run['maxTick'];row['overBudgetTicks']=run['overBudgetTicks']
    row['firstFiveOver50']=sum(t['endWeekMs']>50 for t in run['ticks'][:5])
    row['warmOver50']=sum(t['endWeekMs']>50 for t in run['ticks'][5:])
    row['beforeBirthdayMean']=stats([t['endWeekMs'] for t in run['ticks'][5:39]])['mean']
    row['birthdayAndAfterMean']=stats([t['endWeekMs'] for t in run['ticks'][39:]])['mean']
    row['slowTickComponents']=[t for t in run['ticks'] if t['endWeekMs']>50]
    rows.append(row)
    trace=load(run['run']+'.cpuprofile');nodes={n['id']:n for n in trace['nodes']}
    parents={child:n['id'] for n in trace['nodes'] for child in n.get('children',[])}
    self_us=defaultdict(float);inclusive=defaultdict(float)
    for node_id,delta in zip(trace.get('samples',[]),trace.get('timeDeltas',[]),strict=True):
        self_us[node_id]+=delta
        current=node_id
        while True:
            inclusive[current]+=delta
            if current not in parents:break
            current=parents[current]
    grouped=defaultdict(lambda:{'selfMs':0.,'inclusiveMs':0.,'nodes':[]})
    for node_id,node in nodes.items():
        frame=node['callFrame'];key=(frame['functionName'],frame.get('url',''),frame.get('lineNumber',-1))
        group=grouped[key];group['selfMs']+=self_us[node_id]/1000;group['inclusiveMs']+=inclusive[node_id]/1000;group['nodes'].append(node_id)
    formatted=[{'function':k[0],'url':k[1],'line':k[2]+1,**v} for k,v in grouped.items()]
    important=[v for v in formatted if any(s in v['function'] for s in ['structuredClone','hasWeeklyKeys','isNpcLife','runNpcLifeWeek','p7Original','garbage collector'])]
    cpu.append({'run':run['run'],'scope':'CPU samples across all END_WEEK and NEXT_WEEK calls; inclusive values may overlap and are not additive. CPU sampling is approximate, not an allocation trace.','sampledMs':sum(trace.get('timeDeltas',[]))/1000,'topSelf':sorted(formatted,key=lambda x:x['selfMs'],reverse=True)[:18],'importantFrames':sorted(important,key=lambda x:x['inclusiveMs'],reverse=True)})
pairs=[]
for base,head in zip(rows[::2],rows[1::2],strict=True):
    pairs.append({'base':base['run'],'head':head['run'],'allMeanDelta':head['endWeek']['all']['mean']-base['endWeek']['all']['mean'],'allMaxDelta':head['endWeek']['all']['max']-base['endWeek']['all']['max'],'warmMeanDelta':head['endWeek']['warm']['mean']-base['endWeek']['warm']['mean'],'warmMaxDelta':head['endWeek']['warm']['max']-base['endWeek']['warm']['max']})
pooled={}
for revision in ['base','head']:
    relevant=[r for r in runs if r['revision']==revision]
    pooled[revision]={view:stats([t['endWeekMs'] for r in relevant for t in (r['ticks'] if view=='all' else r['ticks'][5:])]) for view in ['all','warm']}
deltas={view:{'mean':pooled['head'][view]['mean']-pooled['base'][view]['mean'],'max':pooled['head'][view]['max']-pooled['base'][view]['max']} for view in ['all','warm']}
summary={'diagnosticStatus':'HOLD','source':'All six fresh-process runs, no warm-up or raw tick discarded','p95Method':'nearest rank ceil(0.95*n)','initialSessionSha256':runs[0]['initialSessionSha256'],'harnessSha256':runs[0]['harnessSha256'],'allInitialSessionsIdentical':True,'finalSessionsDeterministicWithinRevision':True,'sixDistinctPids':True,'runtime':{'node':runs[0]['node'],'v8':runs[0]['v8'],'vite':runs[0]['vite']},'rows':rows,'pairs':pairs,'pooled':pooled,'headMinusBase':deltas,'limitations':['SSR source execution and inspector CPU sampling, matching the earlier harness engine; not a production bundle benchmark.','Head-only in-memory timers and wrapper allocations are included in head timings; no numerical overhead correction is applied.','In-call life/clone timing does not attribute later garbage collection or all external CPU variability.','Three alternating pairs provide descriptive evidence, not a confidence interval or proof of a universal production slowdown.']}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
(OUT/'cpu-summary.json').write_text(json.dumps(cpu,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'rows':[{k:r[k] for k in ['run','cpuStart','maxTick','overBudgetTicks','beforeBirthdayMean','birthdayAndAfterMean','lifeClone','postTransitions']} for r in rows],'pairs':pairs,'pooled':pooled,'headMinusBase':deltas},indent=2))
