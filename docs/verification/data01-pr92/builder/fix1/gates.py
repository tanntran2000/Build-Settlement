import subprocess,sys,pathlib,datetime,json
sys.stdout.reconfigure(encoding='utf-8')
p=pathlib.Path(__file__).parent
commands=[('gate-1-diff.txt','git diff --check origin/main...HEAD'),('gate-2-lint.txt','npm run lint'),('gate-3-typecheck.txt','npm run typecheck'),('gate-4-architecture.txt','npm run check:architecture'),('gate-5-architecture-tests.txt','npm run test:architecture'),('gate-6-unit.txt','npm test'),('gate-7-build.txt','npm run build')]
assert subprocess.check_output(['git','status','--short'],text=True)==''
results=[]
for name,cmd in commands:
 print('START '+name+' '+datetime.datetime.now(datetime.timezone.utc).isoformat(),flush=True)
 r=subprocess.run([sys.executable,str(p/'run.py'),name,cmd])
 results.append({'log':name,'command':cmd,'exit':r.returncode})
 (p/'gate-results.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf8')
 if r.returncode: sys.exit(r.returncode)
 print('DONE '+name,flush=True)
assert subprocess.check_output(['git','status','--short'],text=True)==''
