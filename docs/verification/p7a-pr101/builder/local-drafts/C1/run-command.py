"""Save a command's complete output, exact checkout, UTC bounds and exit code."""
from datetime import datetime, timezone
from pathlib import Path
import json
import os
import subprocess
import sys
import time

sys.stdout.reconfigure(encoding="utf-8")
root = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01")
out = Path(sys.argv[1])
assert sys.argv[2] == "--"
command = sys.argv[3:]
started = time.monotonic()
utc = lambda: datetime.now(timezone.utc).isoformat()

def git(*args):
    return subprocess.check_output(["git", *args], cwd=root, encoding="utf-8").strip()

with out.open("x", encoding="utf-8", newline="\n") as log:
    log.write(f"HEAD={git('rev-parse','HEAD')}\nTREE={git('rev-parse','HEAD^{tree}')}\n"
              f"BRANCH={git('branch','--show-current')}\nUTC_START={utc()}\nCOMMAND={json.dumps(command)}\n"
              f"CI={os.environ.get('CI','')}\nSTATUS:\n{git('status','--porcelain=v1')}\nOUTPUT:\n")
    log.flush()
    with subprocess.Popen(command, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) as child:
        assert child.stdout
        for raw in child.stdout:
            line = raw.decode("utf-8", errors="backslashreplace").replace("\r\n", "\n")
            log.write(line)
            log.flush()
            print(line, end="", flush=True)
        code = child.wait()
    footer = f"\nEXIT_CODE={code}\nSECONDS={time.monotonic()-started:.3f}\nUTC_END={utc()}\n"
    log.write(footer)
    print(footer, flush=True)
sys.exit(code)
