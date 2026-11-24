from pathlib import Path
import datetime as dt
import json
import os
import subprocess
import sys

root=Path.cwd()
d=Path('C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-10/final')
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip()
assert head=='63cbdca96fc7a326d2d1204c0b0871dc34a6d14e'
assert not subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=all'])
report=json.loads((d/'b2-3-smoke.json').read_bytes())
cases=[]
def walk(suite, trail=()):
    names=(*trail,suite['title'])
    for spec in suite.get('specs',[]):
        for test in spec['tests']:
            if test.get('status')!='unexpected':
                continue
            cases.append({'file':spec['file'],'line':spec['line'],'title':spec['title'],
                          'titlePath':[*names,spec['title']],
                          'project':test['projectName'],
                          'fullRunStatuses':[result['status'] for result in test['results']],
                          'fullRunErrors':[error.get('message') for result in test['results'] for error in result.get('errors',[])]})
    for child in suite.get('suites',[]):
        walk(child,names)
for suite in report['suites']:
    walk(suite)
assert len(cases)==report['stats']['unexpected'],(len(cases),report['stats'])
out=d/'b2-3-isolated'
out.mkdir(exist_ok=True)
utc=lambda:dt.datetime.now(dt.timezone.utc).isoformat()
for index,case in enumerate(cases,1):
    name=f'{index:03d}'
    log_path=out/(name+'.txt')
    json_path=out/(name+'.json')
    assert not log_path.exists(),f'Isolated rerun {name} already started.'
    title_regex=''.join(chr(92)+char if char in r'\.^$|?*+()[]{}' else char for char in case['title'])+'$'
    source=root/case['file']
    if not source.is_file():
        source=root/'tests/e2e'/case['file']
    assert source.is_file(),source
    case['source']=source.relative_to(root).as_posix()
    args=['node','node_modules/playwright/cli.js','test',
          f"{case['source']}:{case['line']}",f"--project={case['project']}",
          '--grep='+title_regex,'--reporter=list,json', '--output='+str(out/(name+'-artifacts'))]
    env=os.environ.copy()
    env.update(CI='1',PLAYWRIGHT_JSON_OUTPUT_FILE=str(json_path))
    with log_path.open('wb') as log:
        log.write(f'UTC start {utc()}\nHEAD {head}\nTree {tree}\nCI=1\nCommand: {args!r}\n\n'.encode())
        log.flush()
        run=subprocess.run(args,cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
        log.write(f'\nUTC end {utc()}\nExit {run.returncode}\n'.encode())
    result=json.loads(json_path.read_bytes()) if json_path.exists() else None
    stats=result['stats'] if result else None
    count=sum(stats[k] for k in ('expected','unexpected','flaky','skipped')) if stats else 0
    case['rerun']={'exit':run.returncode,'stats':stats,'isolatedCount':count,'log':log_path.name}
    if count!=1:
        print(f'Invalid isolation count for {case["title"]}: {count}',file=sys.stderr)
    print(json.dumps(case),flush=True)
    (out/'results.json').write_text(json.dumps({'head':head,'tree':tree,'cases':cases},indent=2)+'\n',encoding='utf-8',newline='\n')
print(f'{len(cases)} isolated reruns completed.')

