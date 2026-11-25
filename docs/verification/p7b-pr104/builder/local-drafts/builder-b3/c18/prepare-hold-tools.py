from pathlib import Path

here=Path(__file__).resolve().parent
def replace_once(text, old, new):
    assert text.count(old)==1,(old,text.count(old))
    return text.replace(old,new)

archive=(here/'archive-final-artifacts.py').read_text(encoding='utf-8')
archive=replace_once(archive, "assert re.search(r'^Exit 0$',smoke_log,re.M)",
    """assert re.search(r'^Exit [1-9]\\d*$',smoke_log,re.M)
assert re.search(r'^\\s*ok\\s+\\d+ \\[chromium\\].*round-trips the largest representative 100-NPC market checkpoint',smoke_log,re.M)""")
(here/'archive-passed-measurements.py').write_text(archive,encoding='utf-8',newline='\n')

source=(here.parent/'c17'/'rerun-smoke-failures.py').read_text(encoding='utf-8')
old_start=source.index('    # A line can expand')
old_end=source.index("    label=f'smoke-isolated-",old_start)
source=source[:old_start]+"""    # The same leaf title may appear at the same source line under several viewports.
    # Pin the full suite title so one isolated invocation runs exactly one case.
    full_title = ' '.join(title.split(' › '))
    pattern = re.escape(full_title).replace(chr(92) + ' ', ' ') + r'(?: @[^ ]+)*$'
    command=['node','node_modules/@playwright/test/cli.js','test',file.replace(chr(92), '/')+':'+line,'--grep',pattern,'--output',str(out/f'{i:02}-artifacts')]
    selection=f'smoke-selection-{i:02}'
    selected = subprocess.run([sys.executable,str(EVIDENCE/'run.py'),selection,*command,'--list'],
                              cwd=ROOT,env=env,check=False)
    picked=(EVIDENCE/(selection+'.txt')).read_text(encoding='utf-8')
    assert selected.returncode==0 and re.search(r'^Total: 1 test in 1 file$',picked,re.M), (file,title,picked[-1200:])
"""+source[old_end:]
(here/'rerun-smoke-failures.py').write_text(source,encoding='utf-8',newline='\n')
