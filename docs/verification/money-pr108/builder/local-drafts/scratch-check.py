from pathlib import Path
import datetime, os, subprocess, sys

here = Path(__file__).resolve().parent
root = Path((here / '.scratch-path').read_text())
step = sys.argv[1]
assert step in {'typecheck', 'lint', 'test'}
name = sys.argv[2]
with (here / name).open('wb') as log:
    def line(s):
        log.write((s+'\n').encode()); log.flush()
    line('Base HEAD 0b2b3a6088d003301d48b460202327fb53546ede tree 75ec12d1a9c537f5e9788ac0ec52d3ff68db620c')
    line(str(root))
    line(f'npm {"test" if step=="test" else "run "+step} {" " + " ".join(sys.argv[3:]) if len(sys.argv) > 3 else ""} | started {datetime.datetime.now(datetime.timezone.utc).isoformat()}')
    result = subprocess.run(['cmd','/d','/c','npm','test', *sys.argv[3:]] if step=='test' else ['cmd','/d','/c','npm','run',step],
                            env={**os.environ, 'NO_COLOR':'1'}, cwd=root,
                            stdout=log, stderr=subprocess.STDOUT)
    line(f'exit {result.returncode} | ended {datetime.datetime.now(datetime.timezone.utc).isoformat()}')
sys.exit(result.returncode)

