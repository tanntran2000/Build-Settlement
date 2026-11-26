from datetime import datetime,timezone
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from statistics import median,quantiles
import json,os,subprocess,sys
from zipfile import ZipFile

b=Path(__file__).resolve().parent
repo=Path.cwd()
suffix='' if len(sys.argv)==1 else '-attempt'+str(int(sys.argv[1]))
out=b/('m1.4-measurements'+suffix)
out.mkdir(exist_ok=False)
main_dir=b.parent/'_scratch'/('m1.4-main'+suffix)
main_dir.mkdir(exist_ok=False)
head=os.environ.copy()
base='ab83228df9ee1c70f97c634324c3202e2def0ea0'
stamp=lambda:datetime.now(timezone.utc).isoformat()
def git(*args):return subprocess.check_output(['git',*args],text=True,encoding='utf-8').strip()
assert git('rev-parse','origin/main')==base
assert not git('status','--porcelain=v1')
main_tree=git('rev-parse',base+'^{tree}')
tip,tip_tree=git('rev-parse','HEAD','HEAD^{tree}').splitlines()
assert not git('diff','--name-only',base,tip,'--','package.json','package-lock.json','packages/*/package.json')
with ZipFile(BytesIO(subprocess.check_output(['git','archive','--format=zip',base]))) as archive:
 assert archive.comment.decode('ascii')==base,archive.comment
 archive.extractall(main_dir)
assert (main_dir/'package-lock.json').read_bytes().replace(b'\r\n',b'\n')==(repo/'package-lock.json').read_bytes().replace(b'\r\n',b'\n')
# Use the real object database with an external detached HEAD file for the Vite build label.
common_git=Path(git('rev-parse','--path-format=absolute','--git-common-dir')).resolve()
metadata=main_dir/'.build-git'
metadata.mkdir()
(metadata/'HEAD').write_text(base+'\n',encoding='ascii',newline='\n')
main_env=dict(head,GIT_DIR=str(metadata),GIT_COMMON_DIR=str(common_git),GIT_WORK_TREE=str(main_dir))
assert subprocess.check_output(['git','rev-parse','HEAD','HEAD^{tree}'],cwd=main_dir,env=main_env).decode().split()==[base,main_tree]
def write(name,data):
 (out/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8',newline='\n')
def run(label,args,root=repo,env=head,return_json=False,robocopy=False):
 log=out/(label+'.txt')
 started=stamp()
 with log.open('wb') as f:
  f.write((f'UTC start {started}\nCWD {root}\nCommand {subprocess.list2cmdline(args)}\n\n').encode())
  f.flush()
  if return_json:
   p=subprocess.run(args,cwd=root,env=env,stdout=subprocess.PIPE,stderr=f)
   f.write(p.stdout)
  else:
   p=subprocess.run(args,cwd=root,env=env,stdout=f,stderr=subprocess.STDOUT)
  f.write(f'\nExit {p.returncode}\nUTC end {stamp()}\n'.encode())
 if not (p.returncode==0 or robocopy and 0<=p.returncode<=7):
  raise RuntimeError(str(log))
 if return_json:
  return json.loads(p.stdout)|{'utcStart':started,'utcEnd':stamp(),'exit':p.returncode,'command':subprocess.list2cmdline(args)}
 return {'utcStart':started,'utcEnd':stamp(),'exit':p.returncode}

run('deps-root',['robocopy',str(repo/'node_modules'),str(main_dir/'node_modules'),'/E','/XD','@haven','.vite','.vite-temp','/NFL','/NDL','/NJH','/NJS','/NP','/R:1','/W:1'],robocopy=True)
for pkg in sorted((repo/'packages').iterdir()):
 if (pkg/'node_modules').is_dir():
  run('deps-'+pkg.name,['robocopy',str(pkg/'node_modules'),str(main_dir/'packages'/pkg.name/'node_modules'),'/E','/XD','.vite','.vite-temp','/NFL','/NDL','/NJH','/NJS','/NP','/R:1','/W:1'],robocopy=True)
workspaces=main_dir/'node_modules/@haven'
workspaces.mkdir(exist_ok=True)
for pkg in sorted((main_dir/'packages').iterdir()):
 name=json.loads((pkg/'package.json').read_bytes())['name'].split('/')[1]
 alias=workspaces/name
 subprocess.run(['cmd.exe','/d','/c','mklink','/J',str(alias),str(pkg)],check=True)
 assert alias.resolve()==pkg.resolve()
write('measured-revisions.json',{'main':base,'mainTree':main_tree,'head':tip,'headTree':tip_tree,'node':subprocess.check_output(['node','--version']).decode().strip()})
for name,side in [('main',main_dir),('head',repo)]:
 assert (side/'packages/ui/vite.config.ts').is_file()
pairs=[]
for trial in range(1,4):
 versions=['main','head'] if trial%2 else ['head','main']
 builds={}
 for version in versions:
  label=f'build-{trial}-{version}'
  root=main_dir if version=='main' else repo
  env=main_env if version=='main' else head
  build=run(label,['npm.cmd','run','build'],root,env)
  args=['node',str(b/'measure-bundle.mjs'),str(root/'packages/ui/dist')]
  if trial==1:args.append(str(out/('gzip-'+version)))
  builds[version]=run(label+'-assets',args,root,env,return_json=True)|{'build':build}
 row=dict(round=trial,order=versions,builds=builds,deltaGzipBytes=builds['head']['totalGzipBytes']-builds['main']['totalGzipBytes'])
 pairs.append(row)
 write('bundle-pairs.json',pairs)
 print('Bundle',trial,[(label,builds[label]['totalGzipBytes']) for label in versions],flush=True)
worker=b/'m1.4-bench-worker.mjs'
def check_case(label,engine,mode,variant,path,difficulty):
 args=['node',str(worker),str(engine),str(repo),mode,variant,str(path),'',difficulty]
 return run(label,args,engine,return_json=True)
fresh={}
for k,difficulty,kind,engine in [('main-normal-empty','normal','empty',main_dir),
    ('head-normal-empty','normal','empty',repo),('head-normal-populated','normal','populated',repo),
    ('head-easy-empty','easy','empty',repo),('head-easy-populated','easy','populated',repo)]:
 fresh[k]=check_case(k,engine,'fresh-save',kind,out/(k+'.json'),difficulty)
write('save-sizes.json',fresh)
missing=object()
def leaf_diffs(old,new,path=''):
 if isinstance(old,dict) and isinstance(new,dict):
  for key in dict.fromkeys([*old,*new]):
   yield from leaf_diffs(old.get(key,missing),new.get(key,missing),f'{path}.{key}' if path else key)
 elif type(new) is not type(old) or new!=old:
  yield {'path':path,'wasPresent':old is not missing,'before':None if old is missing else old,
         'isPresent':new is not missing,'after':None if new is missing else new}
checks=[('main-normal-empty','head-normal-empty'),('head-normal-empty','head-easy-empty'),
        ('head-normal-empty','head-normal-populated'),('head-easy-empty','head-easy-populated')]
save_diffs={}
for old,new in checks:
 a=json.loads((out/(old+'.json')).read_bytes())
 z=json.loads((out/(new+'.json')).read_bytes())
 changes=list(leaf_diffs(a,z))
 if old.startswith('main'):
  allowed={'cityRulesetId','state.city.society.rulesetId','state.city.society.difficulty',
    'state.city.goodsStock.amountMilli','state.city.world.settlements.settlement_haven_01.inventory.food','state.player.purse'}
  assert {x['path'] for x in changes}==allowed,changes
 elif new.endswith('populated'):
  assert all(x['path'].startswith('state.player.purse.') for x in changes),changes
 else:
  assert [x['path'] for x in changes]==['state.city.society.difficulty'],changes
 save_diffs[old+' -> '+new]={'byteDelta':fresh[new]['bytes']-fresh[old]['bytes'],'decodedChanges':changes}
write('save-byte-diff.json',save_diffs)
inputs={}
for label,engine,difficulty in [('main',main_dir,'normal'),('normal',repo,'normal'),('easy',repo,'easy')]:
 path=out/f'{label}-100-npc.json'
 inputs[label]=check_case(label+'-100-npc-input',engine,'prepare','control',path,difficulty)
 assert inputs[label]['npcCount']==100
assert len({x['comparableSha'] for x in inputs.values()})==1,inputs
write('timing-inputs.json',inputs)
def percent95(values): return quantiles(values,n=20,method='inclusive')[18]
def stats(values):
 return dict(medianMs=median(values),p95Ms=percent95(values),maxMs=max(values),over50=sum(x>50 for x in values))
groups=[('main-main','main','main'),('main-normal','main','normal'),('main-easy','main','easy')]
raw={label:[] for label,a,z in groups}
for i in range(1,11):
 for name,a,z in groups[i%3:]+groups[:i%3]:
  entries=[('A',a),('B',z)]
  if i%2==0:entries.reverse()
  pair={}
  for side,revision in entries:
   engine=main_dir if revision=='main' else repo
   value=check_case(f'{i:02}-{name}-{side}',engine,'tick','control',out/f'{revision}-100-npc.json',
                    'easy' if revision=='easy' else 'normal')
   assert len(value['warmMs'])==20 and value['inputSha256']==inputs[revision]['sha256']
   pair[side]=dict(revision=revision,statistics=stats(value['warmMs']),**value)
  raw[name].append({'round':i,'order':[x[0] for x in entries],'runs':pair,
                    'pairedMedianDeltaMs':pair['B']['statistics']['medianMs']-pair['A']['statistics']['medianMs'],
                    'pairedP95DeltaMs':pair['B']['statistics']['p95Ms']-pair['A']['statistics']['p95Ms']})
 write('raw-timings.json',raw)
 print('Timing round',i,flush=True)
aggregate={}
for name,rows in raw.items():
 med=[x['pairedMedianDeltaMs'] for x in rows]
 tails=[x['pairedP95DeltaMs'] for x in rows]
 for side in 'AB':assert len({x['runs'][side]['outcomeSha256'] for x in rows})==1
 aggregate[name]={'aWarm':stats([t for x in rows for t in x['runs']['A']['warmMs']]),
                  'bWarm':stats([t for x in rows for t in x['runs']['B']['warmMs']]),
                  'pairedMedianDeltasMs':med,'medianDeltaMs':median(med),'maxAbsMedianDeltaMs':max(map(abs,med)),
                  'pairedP95DeltasMs':tails,'medianP95DeltaMs':median(tails),'maxAbsP95DeltaMs':max(map(abs,tails))}
write('measurements-summary.json',{'head':tip,'headTree':tip_tree,'base':base,'mainTree':main_tree,'saveBytes':{k:x['bytes'] for k,x in fresh.items()},
 'bundleGzipBytes':[{k:v['totalGzipBytes'] for k,v in row['builds'].items()} for row in pairs],
 'timing':aggregate,'timingWarmPerProcess':20,'pairedRunsPerGroup':10,'utcFinish':stamp()})
