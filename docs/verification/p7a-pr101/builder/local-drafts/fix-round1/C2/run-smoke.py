"""Run one full CI=1 smoke, hash its served entries, and isolate failed cases once."""
from pathlib import Path
import json
import os
import re
import subprocess
import sys
from threading import Event, Thread
import time

from preview_proof import OUT, ROOT, PIN, PORTS, dump, inspect, now

DRAFT = OUT.parent.parent
RUNNER = DRAFT / "C1/run-command.py"
RAW = DRAFT.with_name(DRAFT.name + "-local-only") / "fix-round1/C2"
NODE_CLI = ROOT / "node_modules/@playwright/test/cli.js"
ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
HEADING = re.compile(r"^\s*\d+\)\s+\[([^\]]+)\]\s+›\s+(.+?\.spec\.[cm]?[jt]s):(\d+):(\d+)\s+›\s+(.+?)\s*$", re.M)


def text(path):
    return ANSI.sub("", path.read_text(encoding="utf-8"))


def totals(log):
    scheduled = re.search(r"^Running (\d+) tests? using", log, re.M)
    return {
        "scheduled": int(scheduled[1]) if scheduled else None,
        **{key.replace(" ", "_"): sum(map(int, re.findall(r"^  (\d+) " + key + r"(?=\s|$)", log, re.M)))
           for key in ("passed", "failed", "skipped", "did not run", "interrupted", "flaky")},
    }


def record(name, command):
    cli = [sys.executable, "-B", str(RUNNER), str(OUT / name), "--", *command]
    return subprocess.run(cli, cwd=ROOT, check=False).returncode


def watch(stop, matches, errors):
    while not stop.is_set() and len(matches) < len(PORTS):
        for port in PORTS:
            if str(port) not in matches:
                try:
                    matches[str(port)] = inspect(port)
                    errors.pop(str(port), None)
                except (OSError, AssertionError) as exc:
                    errors[str(port)] = str(exc)
        stop.wait(0.5)


def isolate(log):
    all_failed = list(dict.fromkeys(HEADING.findall(log)))
    rows = []
    for index, (project, path, line, col, title) in enumerate(all_failed, 1):
        title_pattern = re.escape(title.replace(" › ", " ")) + "$"
        spec = path.replace("\\", "/") + ":" + line
        target = ["node", str(NODE_CLI), "test", spec, "--project", project, "--grep", title_pattern]
        listed = subprocess.run([*target, "--list"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8",
                               errors="backslashreplace", check=False)
        list_log = f"isolate-{index:02d}-list.txt"
        (OUT / list_log).write_bytes((
            f"HEAD={PIN['head']}\nTREE={PIN['tree']}\nUTC={now()}\nCOMMAND={json.dumps([*target,'--list'])}\n"
            + listed.stdout + listed.stderr + f"\nEXIT_CODE={listed.returncode}\n").encode())
        unique = listed.returncode == 0 and bool(re.search(r"^Total: 1 test in 1 file", ANSI.sub("", listed.stdout), re.M))
        row = {"project": project, "path": path, "line": int(line), "column": int(col), "title": title, "listLog": list_log}
        if unique:
            name = f"isolate-{index:02d}-CI1.txt"
            row["command"] = [*target, "--output", str(RAW / f"isolation-{index:02d}")]
            row["exitCode"] = record(name, row["command"])
            row["totals"] = totals(text(OUT / name))
            row["log"] = name
        else:
            row["blocked"] = "The requested isolated locator did not list exactly one test."
        rows.append(row)
        dump("smoke-isolated-summary.json", {"head": PIN["head"], "tree": PIN["tree"], "failedCases": rows})
    return rows


def main():
    assert os.environ.get("CI") == "1"
    preflight = json.loads((OUT / "served-assets-before-smoke.json").read_bytes())
    assert preflight["matched"] and (preflight["head"], preflight["tree"]) == (PIN["head"], PIN["tree"])
    stop, matches, errors = Event(), {}, {}
    observer = Thread(target=watch, args=(stop, matches, errors), daemon=True)
    command = ["npm.cmd", "run", "test:smoke", "--", "--output", str(RAW / "full")]
    started, clock = now(), time.monotonic()
    observer.start()
    try:
        exit_code = record("smoke-CI1.txt", command)
    finally:
        stop.set()
        observer.join(timeout=6)
    ended = now()
    log = text(OUT / "smoke-CI1.txt")
    proof = len(matches) == len(PORTS)
    counts = totals(log)
    dump("served-assets-during-smoke.json", {
        "head": PIN["head"], "tree": PIN["tree"], "matched": proof, "ports": matches, "errors": errors,
    })
    result = {
        "head": PIN["head"], "tree": PIN["tree"], "ci": "1", "command": command, "utcStart": started, "utcEnd": ended,
        "seconds": round(time.monotonic() - clock, 3), "exitCode": exit_code, "totals": counts, "servedAssetsMatched": proof,
        "fullSuitePassed": exit_code == 0 and proof and counts["scheduled"] == counts["passed"] and
            not any(counts[name] for name in ("failed", "flaky", "skipped", "did_not_run", "interrupted")),
    }
    dump("smoke-result.json", result)
    if exit_code:
        isolated = isolate(log)
        result["isolatedCases"] = len(isolated)
        result["exactlyOneRerunPerNamedFailure"] = all(row.get("totals", {}).get("scheduled") == 1 for row in isolated)
        dump("smoke-result.json", result)
    print(json.dumps(result, indent=2), flush=True)
    return exit_code if exit_code else (0 if result["fullSuitePassed"] else 2)


if __name__ == "__main__":
    sys.exit(main())
