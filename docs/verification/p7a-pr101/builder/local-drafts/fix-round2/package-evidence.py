"""Collect exact-head Builder evidence and verify all nested manifests."""
from datetime import datetime, timezone
from hashlib import file_digest
import json
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys

OUT = Path(__file__).resolve().parent
DRAFT = OUT.parent
C2 = OUT / "C2"
RAW = DRAFT.with_name(DRAFT.name + "-local-only") / "fix-round2"
ROOT = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01")
PATHS = ["packages/ui/src/__tests__/npc-sheet-view.test.ts", "tests/e2e/npc-sheet.spec.ts"]
CODE = chr(96)
GATES = [
    ("1a", "git diff --check origin/main...HEAD", "gate-1-main"),
    ("1b", "git diff --check b94d308...HEAD", "gate-1-prb"),
    ("2", "npm run lint", "gate-2-lint"),
    ("3", "npm run typecheck", "gate-3-typecheck"),
    ("4", "npm run check:architecture", "gate-4-architecture"),
    ("5", "npm run test:architecture", "gate-5-architecture-tests"),
    ("6", "npm test", "gate-6-unit"),
    ("7", "npm run build", "gate-7-build"),
]


def sha(path):
    with path.open("rb") as f:
        return file_digest(f, "sha256").hexdigest()


def read(path):
    return json.loads(path.read_bytes())


def write(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def link(path, label):
    return f"[{label}]({path.as_posix()})"


def text(path):
    return path.read_text(encoding="utf-8")


def collect(pin):
    full = RAW / "C2/full"
    screens = OUT / "screenshots"
    screens.mkdir(exist_ok=True)
    items = []
    for name, label in (("profile", "Profile"), ("skills", "Skills"), ("18plus", "18+"), ("history", "History")):
        matches = list(full.glob(f"npc-sheet-*1280px*/attachments/{name}-*.png"))
        if not matches:
            continue
        [capture] = matches
        proof = screens / f"npc-sheet-{name}-1280.png"
        shutil.copyfile(capture, proof)
        with proof.open("rb") as stream:
            png = stream.read(24)
        assert png[:8] == b"\x89PNG\r\n\x1a\n"
        width, height = struct.unpack(">II", png[16:24])
        assert (width, height) == (1280, 900)
        items.append({"tab": label, "file": proof.name, "width": width, "height": height,
                      "sha256": sha(proof), "matchesRound1": sha(proof) == sha(DRAFT / "screenshots" / proof.name)})
    for name in ("accessibility-1280", "accessibility-1600", "reflow-320", "reflow-375"):
        matches = list(full.glob(f"**/npc-sheet-{name}.json"))
        if matches:
            [capture] = matches
            shutil.copyfile(capture, C2 / capture.name)
    write(screens / "index.json", {"head": pin["head"], "tree": pin["tree"], "screenshots": items})
    return len(items), len(list(C2.glob("npc-sheet-*.json")))


def manifest(folder):
    target = folder / "SHA256SUMS.txt"
    paths = sorted(p for p in folder.rglob("*") if p.is_file() and p != target)
    target.write_text("".join(f"{sha(p)}  {p.relative_to(folder).as_posix()}\n" for p in paths), encoding="utf-8", newline="\n")
    rows = text(target).splitlines()
    assert len(rows) == len(paths)
    assert {row[66:] for row in rows} == {p.relative_to(folder).as_posix() for p in paths}
    for row in rows:
        assert sha(folder / row[66:]) == row[:64], row
    return len(rows)


def checkout(pin):
    port_command = ("$ports = @([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties()."
                    "GetActiveTcpListeners() | Where-Object {$_.Port -in @(4173,4174)}); "
                    "if ($ports.Count) { $ports | ConvertTo-Json -Compress; exit 1 }; '[]'")
    ports = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", port_command],
                           capture_output=True, text=True, check=False)
    changes = git("diff", "--name-only", pin["parent"], pin["head"]).decode().splitlines()
    assert changes == PATHS
    assert git("diff", pin["parent"], pin["head"], "--", *PATHS) == (OUT / "assertions.diff").read_bytes()
    assert git("rev-parse", "HEAD", "HEAD^{tree}").decode().splitlines() == [pin["head"], pin["tree"]]
    message = git("log", "-1", "--format=%B").decode().strip().splitlines()
    assert message[0] == "test(ui): exact npc sheet assertions"
    assert message[-1] == "Co-authored-by: Codex <noreply@openai.com>"
    return {"head": pin["head"], "tree": pin["tree"], "parent": pin["parent"], "branch": pin["branch"],
            "clean": git("status", "--porcelain=v1", "--untracked-files=all") == b"",
            "ports4173And4174Free": ports.returncode == 0, "listeners": ports.stdout.strip(),
            "trackedChangeScope": changes, "temporaryWorktreesCreated": 0, "priorStorageReclaimedBytes": 0}


def gate_table(pin):
    table = ["| Gate | Command | Exit | Seconds | Log |", "| --- | --- | ---: | ---: | --- |"]
    for ident, command, name in GATES:
        path = C2 / (name + ".txt")
        if path.exists():
            output = text(path)
            assert f"HEAD={pin['head']}\nTREE={pin['tree']}\n" in output
            code, seconds = re.search(r"EXIT_CODE=(\d+)\nSECONDS=([\d.]+)\nUTC_END=", output).groups()
            table.append(f"| {ident} | {CODE}{command}{CODE} | {code} | {seconds} | {link(path, 'Full output')} |")
        else:
            table.append(f"| {ident} | {command} | — | — | Pending after HOLD |")
    return table


def main():
    pin = read(C2 / "exact-head.json")
    result = read(C2 / "C2-summary.json")
    mutation = read(OUT / "probes/mutation-results.json")
    assert mutation["projection"]["exitCode"] == 1 and mutation["browser"]["expectedFailuresObserved"] == 13
    unit = text(OUT / "probes/green-unit-CI1.txt")
    focused = text(OUT / "probes/green-browser-CI1.txt")
    assert "EXIT_CODE=0" in unit and "5 passed" in unit and "CI=1" in unit
    assert "EXIT_CODE=0" in focused and "16 passed" in focused and "CI=1" in focused
    state = checkout(pin)
    write(OUT / "final-checkout.json", state)
    smoke_path = C2 / "smoke-result.json"
    smoke = read(smoke_path) if smoke_path.exists() else None
    bundle_path = C2 / "bundle-results.json"
    bundle = read(bundle_path) if bundle_path.exists() else None
    counts = smoke["totals"] if smoke else None
    png, metrics = collect(pin) if smoke else (0, 0)
    passed = (result["exitCode"] == 0 and smoke and smoke["fullSuitePassed"]
              and state["clean"] and state["ports4173And4174Free"] and (png, metrics) == (4, 4))
    status = ("**C2 PASS.** All seven gates and the full CI=1 smoke passed."
              if passed else "**C2 HOLD.** The completed checks and blocker are recorded below.")
    lines = [
        "# P7-A PR C — Fix round 2 evidence", "", status, "",
        f"Builder (Codex Sol 6.2), {datetime.now(timezone.utc).date()} UTC. Commit {CODE}test(ui): exact npc sheet assertions{CODE}.", "",
        "| Revision | SHA |", "| --- | --- |",
        *[f"| {label} | {CODE}{pin[key]}{CODE} |" for label, key in
          [("Tested HEAD", "head"), ("Tested tree", "tree"), ("Parent", "parent"), ("origin/main", "originMain"), ("PR B base", "base")]],
        "", "## Scope and mutation results", "",
        "The commit modifies two tests introduced in PR C. The projection test compares the four selected fields and skill rows with strict equality and retains the input-byte check. The browser suite checks Frugal's complete row description, the complete birthday text at ages 49 and 50, and the accessible description and visible level text in each named progress bar row.", "",
        "The projection probe rejected an extra Management field. The 13 browser probes rejected swapped Frugal wording, both age strings with extra suffixes, and independent accessible-description and visible-level mutations for all five rows. Browser probes used generated test copies and changed the running DOM. Two setup runs exposed Windows ESM loading errors, and one intermediate run exposed the Frugal selector scope. The probe outputs record these attempts.", "",
        "The unmodified product passed 5/5 projection tests and 16/16 focused browser tests at CI=1. " + " · ".join([
            link(OUT / "assertions.diff", "Exact diff"), link(OUT / "probes/mutation-results.json", "Mutation results"),
            link(OUT / "probes/green-unit-CI1.txt", "GREEN unit"), link(OUT / "probes/green-browser-CI1.txt", "GREEN browser")]),
        "", "## Gate results", "", *gate_table(pin), "", "## Smoke and bundle", "",
    ]
    if smoke:
        assert text(C2 / "smoke-ci.txt").strip() == "CI=1"
        assert re.search(r"^OUTPUT:\nCI=1\n", text(C2 / "smoke-CI1.txt"), re.M)
        lines.extend([f"CI=1 smoke scheduled **{counts['scheduled']} tests**. **{counts['passed']} passed**, "
                      f"{counts['failed']} failed, {counts['skipped']} skipped. Exit {smoke['exitCode']} in {smoke['seconds']/60:.1f} minutes. "
                      f"{link(C2 / 'smoke-CI1.txt', 'Full transcript')} · {link(smoke_path, 'Totals')}", "",
                      f"Production entry hashes matched on both preview ports during smoke: {smoke['servedAssetsMatched']}. "
                      f"{link(C2 / 'served-assets-before-smoke.json', 'Before smoke')} · "
                      f"{link(C2 / 'served-assets-during-smoke.json', 'During smoke')}", ""])
    else:
        lines.extend([f"Full smoke was not reached. {result['problem']}", ""])
    isolated = C2 / "smoke-isolated-summary.json"
    if isolated.exists():
        rows = read(isolated)["failedCases"]
        lines.extend(["| Failed full-smoke case | Isolated exit | Isolated passed |",
                      "| --- | ---: | ---: |", *[f"| {row['title']} | {row.get('exitCode', '—')} | {row.get('totals', {}).get('passed', '—')} |" for row in rows],
                      "", link(isolated, "Isolated rerun evidence"), ""])
    if bundle:
        n = bundle["current"]
        lines.extend([f"Bundle gzip: **{n['jsGzipBytes']:,} B JS + {n['cssGzipBytes']:,} B CSS = {n['combinedGzipBytes']:,} B**. "
                      f"Headroom {bundle['remainingBudgetBytes']:,} B under the 200,000 B budget. "
                      f"{link(bundle_path, 'Measurements and hashes')}", ""])
    snapshots = [C2 / (name + "-machine.json") for name in ("gate-start", "pre-smoke", "final")]
    snapshots = [(p, read(p)) for p in snapshots if p.exists()]
    audit = C2 / "sleep-resume-events.json"
    if snapshots:
        loads = ", ".join(f"{p.stem.removesuffix('-machine')} {r['cpu'][0]['LoadPercentage']}%" for p, r in snapshots)
        competing = sum(len(r["competingJobs"]) for _, r in snapshots)
        events = read(audit)["eventCount"] if audit.exists() else "unavailable"
        lines.extend([f"CPU snapshots: {loads}. Competing jobs detected across these samples: {competing}. Windows sleep/resume events: {events}. "
                      + " · ".join([*(link(p, p.stem) for p, _ in snapshots), link(audit, "Windows System log query")]), ""])
    if png:
        lines.extend([f"The run captured {png} PNGs at 1280 × 900 and {metrics} accessibility/reflow records. "
                      + link(OUT / "screenshots/index.json", "Screenshot inventory"), ""])
    if not passed:
        lines.extend([f"HOLD evidence: {result['problem'] or result['finalProblem'] or 'Final workspace or browser evidence incomplete'}", ""])
    lines.extend([f"Final checkout clean: {state['clean']}. Ports 4173 and 4174 free: {state['ports4173And4174Free']}. The assigned worktree is retained. "
                  f"Pre-existing storage reclaimed: 0 bytes. {link(OUT / 'final-checkout.json', 'Final checkout')} · "
                  f"{link(OUT / 'SHA256SUMS.txt', 'Round 2 manifest')}", ""])
    (OUT / "README.md").write_text("\n".join(lines), encoding="utf-8")
    local_files = sorted(p for p in RAW.rglob("*") if p.is_file())
    write(OUT / "LOCAL-ONLY.json", {"head": pin["head"], "tree": pin["tree"], "root": RAW.as_posix(),
          "files": [{"path": p.relative_to(RAW).as_posix(), "bytes": p.stat().st_size, "sha256": sha(p)} for p in local_files]})
    parent = DRAFT / "README.md"
    raw = parent.read_bytes()
    existing = raw.replace(b"\r\n", b"\n")
    heading = "# P7-A PR C — Builder evidence\n\n".encode()
    assert existing.startswith(heading)
    if b"## Fix round 2 at " not in existing:
        section = f"## Fix round 2 at {pin['head'][:7]}\n\n{status}\n\nHead {CODE}{pin['head']}{CODE}, tree {CODE}{pin['tree']}{CODE}. "
        if smoke:
            section += f"CI=1 smoke: {counts['passed']}/{counts['scheduled']} passed, {counts['failed']} failed, {counts['skipped']} skipped. "
        section += " · ".join([link(OUT / "README.md", "Round 2 report"), link(OUT / "assertions.diff", "Test diff"), link(OUT / "SHA256SUMS.txt", "Round 2 manifest")])
        section += "\n\n## Historical correction 10 and round 1\n\n"
        updated = existing.replace(heading, heading + section.encode(), 1)
        parent.write_bytes(updated.replace(b"\n", b"\r\n") if b"\r\n" in raw else updated)
    for folder in (C2, OUT / "probes", OUT / "screenshots", OUT, DRAFT):
        if folder.exists():
            print(f"{folder.as_posix()}: {manifest(folder)} files hashed", flush=True)
    for path in (DRAFT / "README.md", OUT / "README.md", OUT / "probes/mutation-results.json"):
        assert "\ufffd" not in text(path)
    print("C2 " + ("PASS" if passed else "HOLD"))
    return 0 if passed else 2


if __name__ == "__main__":
    sys.exit(main())

