"""Commit the verified tests and write the pin used by every C2 gate."""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import subprocess

OUT = Path(__file__).resolve().parent
ROOT = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01")
EXPECTED = {
    "branch": "feat/p7a-npc-sheet",
    "parent": "813805178ce4fe9e93c0c39ddee9143c19ea7286",
    "parentTree": "bb414ff2825ea37bd5c41a579de7dac82acbaf22",
    "base": "b94d3083dd71722f329b1bf444fa9dec9b0fd309",
    "originMain": "dac604054d7cbbf14a0a42209a3ff560380f2956",
}
UTC = lambda: datetime.now(timezone.utc).isoformat()
def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)

def rev(name):
    return git("rev-parse", name).decode().strip()

assert git("branch", "--show-current").decode().strip() == EXPECTED["branch"]
for key, ref in (("parent", "HEAD"), ("parentTree", "HEAD^{tree}"), ("base", "b94d308"), ("originMain", "origin/main")):
    assert rev(ref) == EXPECTED[key], (key, rev(ref))
record = json.loads((OUT / "probes/mutation-results.json").read_bytes())
assert record["projection"]["exitCode"] == 1 and record["browser"]["expectedFailuresObserved"] == 13
paths = sorted(record["realTestFilesSha256"])
assert paths == ["packages/ui/src/__tests__/npc-sheet-view.test.ts", "tests/e2e/npc-sheet.spec.ts"]
assert git("status", "--porcelain=v1", "--untracked-files=all").decode().splitlines() == [" M " + path for path in paths]
for path in paths:
    assert sha256((ROOT / path).read_bytes()).hexdigest() == record["realTestFilesSha256"][path]
for label, total in (("unit", 5), ("browser", 16)):
    log = (OUT / f"probes/green-{label}-CI1.txt").read_text(encoding="utf-8")
    assert "CI=1\n" in log and "EXIT_CODE=0\n" in log and f"{total} passed" in log
git("add", "--", *paths)
assert git("diff", "--cached", "--name-only").decode().splitlines() == paths
assert git("diff", "--cached", "--", *paths) == (OUT / "assertions.diff").read_bytes()
git("diff", "--cached", "--check")
command = ["git", "commit", "-m", "test(ui): exact npc sheet assertions", "-m", "Co-authored-by: Codex <noreply@openai.com>"]
start = UTC()
result = subprocess.run(command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False)
log = f"UTC_START={start}\nCOMMAND={json.dumps(command)}\n".encode() + result.stdout
log += f"\nUTC_END={UTC()}\nEXIT_CODE={result.returncode}\n".encode()
(OUT / "commit.txt").write_bytes(log)
assert result.returncode == 0, log.decode(errors="replace")
assert rev("HEAD^") == EXPECTED["parent"] and git("status", "--porcelain=v1", "--untracked-files=all") == b""
assert git("diff", "HEAD^", "HEAD", "--", *paths) == (OUT / "assertions.diff").read_bytes()
pin = {**EXPECTED, "head": rev("HEAD"), "tree": rev("HEAD^{tree}"), "shortHead": git("rev-parse", "--short", "HEAD").decode().strip()}
(OUT / "C2/exact-head.json").write_text(json.dumps(pin, indent=2) + "\n", encoding="utf-8")
print(json.dumps(pin, indent=2))

