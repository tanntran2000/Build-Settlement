import json, subprocess, pathlib, hashlib
out=pathlib.Path('C:/Users/Admin/.t3/local-drafts/p6b-prA/astra-review')
def git(*args): return subprocess.check_output(['git',*args])
def pairs(ps):
 d={}
 for k,v in ps:
  assert k not in d, 'duplicate JSON key: '+k
  d[k]=v
 return d
def load(b): return json.loads(b,object_pairs_hook=pairs)
def changes(a,b,p=''):
 if a==b:return []
 if isinstance(a,dict) and isinstance(b,dict):return sum([changes(a.get(k),b.get(k),p+'.'+k if p else k) for k in dict.fromkeys([*a,*b])],[])
 if isinstance(a,list) and isinstance(b,list) and len(a)==len(b):return sum([changes(x,y,p+'.'+str(i)) for i,(x,y) in enumerate(zip(a,b))],[])
 return [p]
rows=json.loads((out/'ledger.json').read_text()); reports=[]
for row in rows:
 if row['method']!='scripted for large JSON':continue
 p=row['path'];raw=git('show','a607111:'+p);cur=load(raw);r={'path':p,'blob':git('rev-parse','a607111:'+p).decode().strip(),'sha256':hashlib.sha256(raw).hexdigest(),'duplicate_keys':0}
 if p.endswith('/items.json'):
  old=load(git('show','e859177:'+p));r['definitions']=len(cur['definitions']);r['new_ids']=[k for k in cur['definitions'] if k not in old['definitions']];assert list(cur['definitions'])[:len(old['definitions'])]==list(old['definitions']);r['old_key_order_preserved']=True
  for k,v in old['definitions'].items():
   expected=dict(v)
   if v['category']=='material':expected['family']=cur['definitions'][k]['family']
   assert cur['definitions'][k]==expected
  assert cur['ITEM_TRIAL']==old['ITEM_TRIAL'];r['changed_paths']=changes(old,cur)
 elif p.endswith('/recipes.json'):
  r['recipes']={k:sum(x['kind']==k for x in cur['recipes'].values()) for k in ['refine','upgrade','fixed']};r['rows']=[{'id':k,**v} for k,v in cur['recipes'].items()];r['CRAFT_TRIAL']=cur['CRAFT_TRIAL']
 elif p.endswith('/catalog-golden.json'):
  old=load(git('show','e859177:'+p));r['scenarios']=[]
  for a,b in zip(old,cur):
   aa=load(a['session']);bb=load(b['session']);paths=changes(aa['state'],bb['state']);assert all(x=='city.society.rulesetId' or x.startswith('city.society.items.') for x in paths);assert {k:v for k,v in a.items() if k!='session'}=={k:v for k,v in b.items() if k!='session'};r['scenarios'].append({'seed':a['seed'],'paths':paths})
 else:
  old=load(git('show','e859177:'+p.replace('society-v9','society-v8')));paths=changes(old,cur);r['changed_paths']=paths;assert all(x in ['rulesetId','cityRulesetId','state.society.rulesetId','state.city.society.rulesetId'] or '.items.' in x for x in paths)
 reports.append(r)
(out/'large-json-inspection.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('13 large JSON files inspected; duplicate keys 0; original item-key order preserved; fixture/golden path assertions satisfied.')
print(git('diff','--shortstat','e859177..a607111').decode().strip())
