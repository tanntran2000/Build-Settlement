from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

EVIDENCE = Path(__file__).resolve().parent
PACKET = EVIDENCE.parent
REPO = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01")
BASE = "bcd643fcd66a787904989051b08e85e4304608a2"
BASE_TREE = "0ac0120539e03a9a1ed2e1ab05ce7dbc63428095"
BRANCH = "fix/import-alert-copy"
NEW_SPEC = "tests/e2e/import-alert.spec.ts"
KEYS = {
    "STEP0-HOLD.md": "f348e6f5dc2f43c7c50a0e07a1830a905d8a854385bd96ee12ec640951bc449f",
    "byte-inventory.json": "de1f918983586f650f2c80cd5fb0d8ac6ebca94f67857360ce4a74641c465bed",
    "README.md": "80f77a529231c2646df6edfd7172aa5c051f1a81e4249f59369a5c75b6d3e3fb",
    "SHA256SUMS.txt": "207821e00c2b10ba7012062926d1307bccd72464e12d7496346e71e9d634d3b0",
    "binding-plan-a486150.md": "d6cb743778bff9e6a6c0275d3fbf2fd10cd19264b4e1bd4f8f78b5c384402fef",
}

def utc():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def digest(data):
    return hashlib.sha256(data).hexdigest()

def git(*args):
    result = subprocess.check_output(["git", *args], cwd=REPO)
    return result

def rev(value="HEAD"):
    return git("rev-parse", value).decode().strip()

def require(condition, message):
    if not condition:
        raise RuntimeError(message)

def canonical(data):
    return data.replace(b"\r\n", b"\n")

def inventory():
    for filename, expected in KEYS.items():
        require(digest((PACKET / filename).read_bytes()) == expected, "Packet digest mismatch: " + filename)
    data = json.loads((PACKET / "byte-inventory.json").read_bytes())
    require(data["baseCommit"] == BASE and data["baseTree"] == BASE_TREE, "Wrong packet base.")
    require(not data["outsideAllowlist"], "Packet has out-of-allowlist paths.")
    return data["files"]

def from_packet(entry):
    name = entry["path"]
    if entry["operation"] == "add":
        before = None
        after = entry["afterUtf8"].encode("utf-8")
    else:
        before = git("show", BASE + ":" + name)
        require(len(before) == entry["base"]["bytes"] and digest(before) == entry["base"]["sha256"], "Base bytes changed: " + name)
        after = before
        for edit in reversed(entry["edits"]):
            start = edit["baseByteOffset"]
            stop = start + edit["before"]["bytes"]
            expected = edit["beforeUtf8"].encode("utf-8")
            replacement = edit["afterUtf8"].encode("utf-8")
            require(after[start:stop] == expected, "Replacement context mismatch: " + name)
            require(digest(expected) == edit["before"]["sha256"] and digest(replacement) == edit["after"]["sha256"], "Replacement digest mismatch: " + name)
            after = after[:start] + replacement + after[stop:]
    require(len(after) == entry["proposed"]["bytes"] and digest(after) == entry["proposed"]["sha256"], "Proposed bytes changed: " + name)
    require(after.startswith(b"\xef\xbb\xbf") == entry["utf8Bom"], "Unexpected BOM: " + name)
    return before, after

def tracked_paths(*args):
    return set(git(*args, "-z").decode("utf-8").strip("\0").split("\0")) - {""}

def dump(log, message):
    log.write((message + "\n").encode("utf-8"))
    log.flush()

def context(log, label):
    dump(log, label + " UTC=" + utc())
    dump(log, "HEAD " + rev() + "\ntree " + rev("HEAD^{tree}") + "\norigin/main " + rev("origin/main"))
    dump(log, "git status --short --branch\n" + git("status", "--short", "--branch").decode("utf-8").rstrip())

def run(log, args, *, ci=False):
    env = {**os.environ, "NO_COLOR": "1", "GIT_TERMINAL_PROMPT": "0"}
    env.pop("FORCE_COLOR", None)
    env.pop("CI", None)
    if ci:
        env["CI"] = "1"
    label = ("CI=1 " if ci else "") + subprocess.list2cmdline(args)
    print(f"{utc()} start {label}", flush=True)
    dump(log, f"\n>>> {label}\nUTC start {utc()}")
    started = time.monotonic()
    result = subprocess.run(args, cwd=REPO, env=env, stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT)
    dump(log, f"\n<<< exit={result.returncode} elapsed_seconds={time.monotonic() - started:.3f} UTC end {utc()}")
    print(f"{utc()} exit {result.returncode} {label}", flush=True)
    return result.returncode

def assert_branch():
    require(git("branch", "--show-current").decode().strip() == BRANCH, "Wrong active branch.")

def assert_base():
    assert_branch()
    require(rev() == BASE and rev("HEAD^{tree}") == BASE_TREE, "Wrong implementation base.")

def assert_red(entries):
    assert_base()
    require(git("status", "--porcelain=v1", "--untracked-files=all") == b"?? tests/e2e/import-alert.spec.ts\n", "RED changes must be exactly the added spec.")
    for item in entries:
        before, after = from_packet(item)
        require(canonical((REPO / item["path"]).read_bytes()) == (after if before is None else before), "Unexpected RED bytes: " + item["path"])

def assert_green(entries):
    assert_base()
    expected_modified = {item["path"] for item in entries if item["operation"] == "modify"}
    require(tracked_paths("diff", "--name-only") == expected_modified, "Unexpected working modifications.")
    require(tracked_paths("ls-files", "--others", "--exclude-standard") == {NEW_SPEC}, "Unexpected untracked paths.")
    require(not git("diff", "--cached", "--name-only"), "Unexpected staged changes.")
    for item in entries:
        require(canonical((REPO / item["path"]).read_bytes()) == from_packet(item)[1], "Unexpected working bytes: " + item["path"])

def assert_committed(entries):
    assert_branch()
    require(rev("HEAD^") == BASE and not git("status", "--porcelain=v1", "--untracked-files=all"), "Committed head has wrong parent or a dirty worktree.")
    require(tracked_paths("diff", "--name-only", BASE, "HEAD") == {item["path"] for item in entries}, "Unexpected committed paths.")
    for item in entries:
        require(git("show", "HEAD:" + item["path"]) == from_packet(item)[1], "Unexpected committed bytes: " + item["path"])

def seed_red(entries, log):
    require(rev() == BASE and rev("HEAD^{tree}") == BASE_TREE and rev("origin/main") == BASE, "Detached preflight base changed.")
    require(not git("branch", "--show-current").strip(), "Expected detached base.")
    require(not git("status", "--porcelain=v1", "--untracked-files=all"), "Expected clean worktree.")
    for item in entries:
        from_packet(item)
    require(run(log, ["git", "switch", "-c", BRANCH, BASE]) == 0, "Branch creation failed.")
    added = next(item for item in entries if item["operation"] == "add")
    with (REPO / added["path"]).open("xb") as handle:
        handle.write(from_packet(added)[1])
    assert_red(entries)
    context(log, "RED input verified. Spec SHA-256 " + added["proposed"]["sha256"])

def apply_fix(entries, log):
    assert_red(entries)
    prepared = []
    for item in entries:
        if item["operation"] == "add":
            continue
        target = REPO / item["path"]
        before, after = from_packet(item)
        use_crlf = item["observedWorktreeEol"] == "CRLF"
        old_disk = before.replace(b"\n", b"\r\n") if use_crlf else before
        new_disk = after.replace(b"\n", b"\r\n") if use_crlf else after
        require(target.read_bytes() == old_disk, "Unexpected checkout bytes: " + item["path"])
        prepared.append((target, new_disk))
        dump(log, item["path"] + " proposed canonical SHA-256 " + item["proposed"]["sha256"])
    for target, new_disk in prepared:
        target.write_bytes(new_disk)
    assert_green(entries)
    context(log, "GREEN packet applied and verified.")

def check_quiet(log, name):
    script = r"""
$ErrorActionPreference = 'Stop'
$sample = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 5 -MaxSamples 6
$values = @($sample | ForEach-Object {
    [pscustomobject]@{utc=$_.Timestamp.ToUniversalTime().ToString('o');cpu=$_.CounterSamples[0].CookedValue}
})
$ports = @(Get-NetTCPConnection -State Listen -LocalPort 4173,4174 -ErrorAction SilentlyContinue)
[pscustomobject]@{samples=$values;listeners=$ports.Count} | ConvertTo-Json -Depth 4 -Compress
"""
    dump(log, "\nQuiet measurement " + name + " UTC start " + utc() + "\nCounter: Processor(_Total) % Processor Time, six 5-second samples. Ports 4173 and 4174.")
    print(f"{utc()} checking quiet window {name}", flush=True)
    result = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script], cwd=REPO, capture_output=True)
    dump(log, result.stdout.decode("utf-8").strip())
    if result.stderr:
        dump(log, result.stderr.decode("utf-8", errors="replace").strip())
    require(result.returncode == 0, "CPU sampling command failed.")
    data = json.loads(result.stdout)
    values = [sample["cpu"] for sample in data["samples"]]
    require(len(values) == 6, "Incomplete CPU sample.")
    mean, peak = sum(values) / len(values), max(values)
    dump(log, f"{name} mean={mean:.6f}% peak={peak:.6f}% listeners={data['listeners']} UTC end {utc()}")
    print(f"{utc()} {name} mean={mean:.2f}% peak={peak:.2f}% listeners={data['listeners']}", flush=True)
    require(mean <= 10 and peak <= 20 and data["listeners"] == 0, "Quiet start conditions not met at " + name)

def build_and_test(entries, log, action, attempt):
    if action == "red":
        assert_red(entries)
        specs = [NEW_SPEC]
    else:
        assert_green(entries)
        specs = [NEW_SPEC, "tests/e2e/home-robbery.spec.ts", "tests/e2e/character-life-navigation.spec.ts", "tests/e2e/storage.spec.ts"]
    require(run(log, ["npm.cmd", "run", "build"]) == 0, "App build failed.")
    output = EVIDENCE / f"playwright-{action}-{attempt}"
    return run(log, ["npm.cmd", "run", "test:smoke", "--", *specs, "--output", str(output)], ci=True)

def commit(entries, log):
    assert_green(entries)
    paths = [item["path"] for item in entries]
    require(run(log, ["git", "add", "--", *paths]) == 0, "git add failed.")
    require(tracked_paths("diff", "--cached", "--name-only") == set(paths), "Unexpected staged paths.")
    for item in entries:
        require(git("show", ":" + item["path"]) == from_packet(item)[1], "Unexpected staged bytes: " + item["path"])
    require(run(log, ["git", "diff", "--cached", "--check"]) == 0, "Staged diff check failed.")
    require(run(log, ["git", "diff", "--cached", "--stat"]) == 0, "Could not show staged stat.")
    require(run(log, ["git", "commit", "-m", "fix(ui): import alert for damaged checkpoints"]) == 0, "Commit failed.")
    assert_committed(entries)
    context(log, "Commit verified against accepted packet.")

def gates(entries, log, attempt):
    assert_committed(entries)
    check_quiet(log, "before gates")
    for args in (
        ["git", "diff", "--check", "origin/main...HEAD"],
        ["npm.cmd", "run", "lint"],
        ["npm.cmd", "run", "typecheck"],
        ["npm.cmd", "run", "check:architecture"],
        ["npm.cmd", "run", "test:architecture"],
        ["npm.cmd", "test"],
        ["npm.cmd", "run", "build"],
    ):
        require(run(log, args) == 0, "Gate failed: " + " ".join(args))
    assert_committed(entries)
    check_quiet(log, "before full smoke")
    output = EVIDENCE / f"playwright-full-{attempt}"
    require(run(log, ["npm.cmd", "run", "test:smoke", "--", "--output", str(output)], ci=True) == 0, "Full smoke failed.")
    assert_committed(entries)
    context(log, "All required commands exited zero.")

def push(entries, log):
    assert_committed(entries)
    patch = git("diff", "--no-ext-diff", "--unified=0", BASE, "HEAD")
    added = b"\n".join(line[1:] for line in patch.splitlines() if line.startswith(b"+") and not line.startswith(b"+++"))
    known_patterns = rb"-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|(AKIA|ASIA)[A-Z0-9]{16}|sk-(proj-)?[A-Za-z0-9_-]{20,}|(password|token|api[_-]?key)\s*[:=]\s*['\x22][^'\x22]{8,}"
    require(not re.search(known_patterns, added, re.IGNORECASE), "Secret scan found a possible credential in added lines.")
    dump(log, "Pre-push scan: added lines match the accepted packet and have no credential-pattern matches.")
    require(run(log, ["git", "push", "--set-upstream", "origin", BRANCH]) == 0, "Branch push failed.")
    remote = git("ls-remote", "--heads", "origin", "refs/heads/" + BRANCH).decode().strip()
    require(remote == rev() + "\trefs/heads/" + BRANCH, "Remote branch SHA did not match.")
    dump(log, "Verified remote " + remote)

def main():
    action = sys.argv[1]
    attempt = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    require(attempt in (1, 2), "Two-attempt limit exceeded.")
    entries = inventory()
    with (EVIDENCE / f"{action}-{attempt}.txt").open("xb", buffering=0) as log:
        context(log, "IMPORT-ALERT-01 " + action)
        try:
            if action == "seed-red":
                seed_red(entries, log)
            elif action == "apply-fix":
                apply_fix(entries, log)
            elif action in ("red", "green"):
                result = build_and_test(entries, log, action, attempt)
                context(log, f"{action} runner exit={result}")
                return result
            elif action == "commit":
                commit(entries, log)
            elif action == "gates":
                gates(entries, log, attempt)
            elif action == "push":
                push(entries, log)
            else:
                raise RuntimeError("Unknown action")
        except Exception as exc:
            dump(log, f"ERROR UTC={utc()} {type(exc).__name__}: {exc}")
            raise
    return 0

if __name__ == "__main__":
    sys.exit(main())
