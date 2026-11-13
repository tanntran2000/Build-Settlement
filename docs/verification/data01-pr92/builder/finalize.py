from pathlib import Path
import subprocess, json, hashlib, datetime, shutil, re

p=Path(__file__).parent
def git(*args): return subprocess.check_output(['git',*args],encoding='utf8').strip()
head,tree=git('rev-parse','HEAD'),git('rev-parse','HEAD^{tree}')
assert git('status','--short')==''
gates=json.loads((p/'gate-results.json').read_text(encoding='utf8'))
smoke=(p/'smoke.txt').read_text(encoding='utf8')
bundle=json.loads((p/'final-bundle-sizes.json').read_text(encoding='utf8'))
zero=json.loads((p/'inspector-zero-byte.json').read_text(encoding='utf8'))
for name in ['data-inspector.test.ts','inspector-build.test.ts']:
 shutil.copyfile(Path('packages/ui/src/__tests__')/name,p/'new-tests'/name)
(p/'status-short.txt').write_text(subprocess.check_output(['git','status','--short'],encoding='utf8'),encoding='utf8')
(p/'head-tree.txt').write_text(f'HEAD: {head}\nTree: {tree}\nBase: 5ff521e3971739ecde05a22dd96c74827c0ae363\nUTC: {datetime.datetime.now(datetime.timezone.utc).isoformat()}\n',encoding='utf8')
table='\n'.join(f"| {i+1} | `{r['command']}` | {r['exit']} | [{r['log']}]({r['log']}) |" for i,r in enumerate(gates))
totals=[line for line in smoke.splitlines() if re.search(r'\d+ (?:passed|failed|skipped)',line)]
readme=f'''# DATA-01 PR C Builder evidence

Tested HEAD: `{head}`. Tree: `{tree}`.
Base: `5ff521e3971739ecde05a22dd96c74827c0ae363` (PR B #91 merged).
Branch: feat/data01-inspector. Builder: Codex. Date: 2026-11-13.
Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01.
Binding plan: binding-plan-c5.md at 6831e8f, correction 5; spec §8; AGENTS.md.

## Owner decisions

- Tân: "Approve, Builder A".
- Tân, 2026-11-13: "Giao Builder C".
- Correction 5: "catalog:buildings.json#hospital (Recommended)" and "API + tests only (Recommended)".
- Tân, 2026-11-13: "A, cho 60s". Only the new inspector-build test case and its completion hook use 60_000 ms. Claude measured two idle production builds at 7.5–11 s; the prior default 5 s case timed out. Completed authorized RED build: 7773 ms; C1 GREEN: 5544 ms (recorded by the test in those verbose logs). The default gate-6 reporter prints aggregate results only.

## RED → GREEN

Full corrected RED: c1-full-red.txt, 8 failed/69 passed (77), with the default 5 s build case and 10 s completion-hook timeout. Existing error-log tests: 57/57 passed. No product edit preceded this full RED list.

Owner-approved affected RED: c1-build-red-60s.txt. Build completed in 7773 ms with NODE_ENV=production; the test then failed on the missing DEV route guard. Only the timeout-affected RED shape was rerun. Product implementation followed this recorded RED.

C1 GREEN: c1-green.txt, 77/77 passed, including all 57 unchanged existing error-log tests; production child 5544 ms. Ref API accepts save and catalog refs, drops malformed refs, preserves refs across persistence/reload, and accepts old no-ref entries. New logic tests cover all eight tables and five catalogs. The build test builds its own dist and scans every output file.

Typecheck initially found ImportMeta.env declarations missing and one tabpanel warning (c1-typecheck.txt). One scoped fix added Vite's type reference to main.ts and made the tabpanel focusable; c1-typecheck-fixed.txt passed with 0 errors/0 warnings. No config or old-test edit.

## Gates at the clean final head

| Gate | Command | Exit | Log |
| --- | --- | --- | --- |
{table}

Full smoke log: smoke.txt. The same Bash shell exports CI=1, echoes `CI=$CI` as `CI=1`, then runs `CI=1 npm run test:smoke`. Script: smoke.sh. Exit 0: 350/350 passed in 31.6 minutes. Retries are zero; no isolated rerun was needed. The seven gates ran sequentially, followed by this full smoke, with one runner at a time.

Smoke totals: {'; '.join(totals)}

## Production sizes and dev inspection

Baseline production measurement: base-bundle-sizes.json, from the completed pre-product build on pinned base: JS 108329 gzip bytes; CSS 5814 gzip bytes. Supplied rounded values: JS 108.33 kB, CSS 5.81 kB.

Final production measurement: final-bundle-sizes.json. {json.dumps(bundle,ensure_ascii=False)}

Inspector-only control: measure-inspector-zero.mjs builds without writing dist, replacing only main.ts in memory with the pinned original while keeping the new error-log refs in both builds. Added inspector bytes: {zero['inspectorAddedJsBytes']}; raw delta {zero['rawByteDelta']} bytes; current/control gzip {zero['currentGzipBytes']}/{zero['controlGzipBytes']}. Production has no inspector markers. Byte identity was an unnecessarily strict preliminary assertion; minifier identifiers differ and the current bundle is smaller. Preserve inspector-zero-byte-strict-identity.txt as measurement history, not a product failure. No product edit was made for this measurement correction.

Dev evidence: dev-inspector-save.txt, dev-inspector-catalog.txt, dev-inspector.png and dev-capture.txt. HOSPITAL matches 1 of 32 buildings; all five catalog counts visible. Missing save DB remains absent, no editable data controls. The dev server was stopped after capture. Shared preview tools were unavailable to this external MCP thread; capture used the existing project Playwright library.

## History and scope

The first test child inherited NODE_ENV=test, so its 10053 ms build and 119142-byte JS gzip baseline are invalid for production comparison. Preserve c1-first-test-env-red.txt, first-test-env-build-sizes.json and its raw artifact for history. The corrected full RED explicitly sets NODE_ENV=production. No product edits occurred before the corrected RED and authorized affected RED. No concurrent test runners in PR C.

Only the six allowlisted files changed; see edit-inventory.md. No dependency, call-site, existing-test, fixture or config change. No push, PR creation or merge. Evidence remains local for Orchestrator/Tester publication on the WP docs branch before G5, as required by AGENTS §6.

All text is UTF-8; quoted Tân, 7.5–11 and RED → GREEN are checked after writing. SHA256SUMS.txt hashes every evidence file except itself; raw JS/CSS and screenshot included. The worktree is retained as assigned; no storage cleanup or reclamation was performed. Ports status: ports.txt.
'''
(p/'README.md').write_text(readme,encoding='utf8')
check=(p/'README.md').read_text(encoding='utf8')
assert all(t in check for t in ['Tân','7.5–11','RED → GREEN','A, cho 60s'])
hashes=[]
for f in sorted(p.rglob('*')):
 if f.is_file() and f.name!='SHA256SUMS.txt':
  hashes.append(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.relative_to(p).as_posix())
(p/'SHA256SUMS.txt').write_text('\n'.join(hashes)+'\n',encoding='utf8')
print(f'HEAD={head}\nTree={tree}\nEvidence files hashed={len(hashes)}\nUTF8 owner quotes and symbols verified')
