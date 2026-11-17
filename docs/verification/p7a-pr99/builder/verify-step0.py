"""Verify A0 evidence against the untouched base; run with --mode preflight."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")
parser = argparse.ArgumentParser()
parser.add_argument("--mode", choices=["preflight"], required=True)
args = parser.parse_args()
root = Path(r"C:\Users\Admin\.t3\worktrees\Build-Settlement\qa-g6-closeout-01")
out = Path(__file__).resolve().parent
commands = []


def run(command):
    start = dt.datetime.now(dt.timezone.utc).isoformat()
    result = subprocess.run(command, cwd=root, capture_output=True, encoding="utf-8", errors="strict")
    commands.append({"utc": start, "command": command, "stdout": result.stdout, "stderr": result.stderr, "exitCode": result.returncode})
    assert result.returncode == 0, commands[-1]
    return result.stdout.strip()


head = run(["git", "rev-parse", "HEAD"])
tree = run(["git", "rev-parse", "HEAD^{tree}"])
assert head == "753e4503673df86830fba2ef2c9ef1e64a843729"
assert tree == "77cbeae3332cfaf26ba23e08ae67300d49d8c69d"
assert run(["git", "status", "--porcelain=v1"]) == ""
assert run(["git", "rev-parse", "origin/main"]) == head
assert run(["git", "branch", "--show-current"]) == "feat/p7a-npc-life-data"
worktrees = run(["git", "worktree", "list", "--porcelain"])
ports = run(["powershell", "-NoProfile", "-Command", "$taskListeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(4173,4174) }); if ($taskListeners.Count) { $taskListeners | Select-Object LocalAddress,LocalPort,OwningProcess | ConvertTo-Json -Compress; exit 1 } else { 'PORTS_4173_4174_FREE'; exit 0 }"])
assert ports == "PORTS_4173_4174_FREE"
rows = json.loads((out/"step0-proposed-edits.json").read_text(encoding="utf-8"))
for row in rows:
    source = (root/row["file"]).read_text(encoding="utf-8-sig").splitlines()
    assert source[row["line"]-1] == row["before"], row
    assert row["before"] != row["after"], row
fixtures = json.loads((out/"step0-fixture-set.json").read_text(encoding="utf-8"))
assert len(fixtures) == 10
for row in fixtures:
    assert hashlib.sha256((root/row["source"]).read_bytes()).hexdigest() == row["sourceSha256"]
    assert not (root/row["target"]).exists()
report = (out/"STEP0-HOLD.md").read_text(encoding="utf-8")
for marker in ["Tân", "Duyệt P7-A", "Duyệt, giao Builder A", "—", "→"]:
    assert marker in report, marker
assert "\ufffd" not in report
inventory = (out/"step0-expected-paths.txt").read_text(encoding="utf-8").splitlines()
assert len(inventory) == 59 and len(set(inventory)) == 59
assert not any(path.startswith("docs/") for path in inventory)
node_code = """
import fs from 'node:fs';
import crypto from 'node:crypto';
const out='C:/Users/Admin/.t3/local-drafts/p7a-prA/';
const proposed=JSON.parse(fs.readFileSync(out+'step0-proposed-npc-life.json','utf8'));
const tuning=JSON.parse(fs.readFileSync('packages/core/src/data/tuning.json','utf8'));
const hashes={};
for(const [name,value] of Object.entries({NPC_ORIGINS:proposed.origins,NPC_HOBBIES:proposed.hobbies,P7A_TRIAL:proposed.P7A_TRIAL,SOCIETY_TRIAL:{...tuning.SOCIETY_TRIAL,rulesetId:'tile-society-10'}})) hashes[name]=crypto.createHash('sha256').update(JSON.stringify(value),'utf8').digest('hex');
console.log(JSON.stringify(hashes,null,2));
"""
node_hashes = json.loads(run(["node", "--input-type=module", "-e", node_code]))
summary = json.loads((out/"step0-scan-summary.txt").read_text(encoding="utf-8"))
assert node_hashes == {name: row["after"] for name, row in summary["pins"].items()}
print(f"A0 preflight evidence verified at HEAD {head}, tree {tree}.")
print(f"{len(rows)} proposed edit lines match base source exactly; 10 historical fixture hashes match; 59 candidate paths; UTF-8 markers intact; git status empty; ports 4173/4174 free.")
print("No implementation, RED/GREEN, architecture gate, unit suite, build, smoke, or golden regeneration was run.")
verification = {
    "mode": args.mode, "head": head, "tree": tree,
    "utc": dt.datetime.now(dt.timezone.utc).isoformat(), "exitCode": 0,
    "checks": {"baseSourceLines": len(rows), "historicalFixtureHashes": len(fixtures), "expectedCandidatePaths": len(inventory), "utf8Markers": True, "nodeCanonicalPinsMatch": True, "gitStatusEmpty": True, "ports4173And4174Free": True},
    "taskState": "A0 HOLD; A1/A2/A3 not run",
}
(out/"step0-verification.txt").write_text(json.dumps(verification, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
log = [f"MODE={args.mode}", f"HEAD={head}", f"TREE={tree}", f"UTC={dt.datetime.now(dt.timezone.utc).isoformat()}", ""]
for row in commands:
    log += ["UTC="+row["utc"], "COMMAND="+json.dumps(row["command"], ensure_ascii=False), "STDOUT:", row["stdout"], "STDERR:", row["stderr"], "EXIT_CODE="+str(row["exitCode"]), ""]
(out/"step0-environment.txt").write_text("\n".join(log), encoding="utf-8")
