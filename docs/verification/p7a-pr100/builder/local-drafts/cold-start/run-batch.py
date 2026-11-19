"""Stage exact Git sources and run one alternating diagnostic batch on Windows."""
from datetime import datetime, timezone
from hashlib import sha1, sha256
from io import BytesIO
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tempfile
import time

OUT = Path(__file__).resolve().parent
WORKTREE = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01").resolve()
VITE = (WORKTREE / "packages/ui/node_modules/vite").resolve()
BRANCH = "feat/p7a-npc-life-week"
COMMITS = {
    "base": "dac604054d7cbbf14a0a42209a3ff560380f2956",
    "head": "b94d3083dd71722f329b1bf444fa9dec9b0fd309",
}
TREES = {
    "base": "d2f31706d77d308a310b61857a8b293a898280e7",
    "head": "947f604e17427d916e1ef0e21083dbc2f72920b6",
}
ENV = dict(os.environ, GIT_OPTIONAL_LOCKS="0")
REMOVED_NODE_ENV = [key for key in ENV if key.upper() in {"NODE_OPTIONS", "NODE_COMPILE_CACHE"}]
for key in REMOVED_NODE_ENV:
    del ENV[key]


def now():
    return datetime.now(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")


def write_json(name, data):
    with (OUT / name).open("w", encoding="utf-8", newline="\n") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
        file.write("\n")


def git(*args):
    return subprocess.check_output(["git", *args], cwd=WORKTREE, env=ENV).decode("utf-8")


def tree_entries(commit):
    result = {}
    for line in git("ls-tree", "-r", "-z", commit).split("\x00"):
        if not line:
            continue
        metadata, path = line.split("\t", 1)
        mode, kind, object_id = metadata.split()
        parts = PurePosixPath(path).parts
        assert kind == "blob" and mode in ("100644", "100755"), (mode, path)
        assert parts and not any(part in ("/", "..") or ":" in part or "\\" in part for part in parts), path
        result[path] = object_id
    return result


def worktree_state():
    tracked = sha256()
    entries = tree_entries(COMMITS["head"])
    for path in sorted(entries):
        digest = sha256((WORKTREE / path).read_bytes()).hexdigest()
        tracked.update((path + "\x00" + digest + "\n").encode("utf-8"))
    return {
        "branch": git("branch", "--show-current").strip(),
        "head": git("rev-parse", "HEAD").strip(),
        "tree": git("rev-parse", "HEAD^{tree}").strip(),
        "originMain": git("rev-parse", "origin/main").strip(),
        "porcelain": git("status", "--porcelain=v1", "--untracked-files=all").splitlines(),
        "trackedFileCount": len(entries),
        "trackedCheckoutByteInventorySha256": tracked.hexdigest(),
        "branchRefsSha256": sha256(git("for-each-ref", "refs/heads", "refs/remotes").encode("utf-8")).hexdigest(),
        "worktreeList": git("worktree", "list", "--porcelain"),
    }


def verify_snapshot(directory, entries):
    for path, object_id in entries.items():
        data = (directory / path).read_bytes()
        header = f"blob {len(data)}\x00".encode("ascii")
        assert sha1(header + data).hexdigest() == object_id, (directory, path)


def stage_snapshot(temp, revision, commit):
    directory = temp / revision
    directory.mkdir()
    tree = git("rev-parse", commit + "^{tree}").strip()
    assert tree == TREES[revision]
    entries = tree_entries(commit)
    object_list = "".join(object_id + "\n" for object_id in entries.values()).encode("ascii")
    blobs = subprocess.run(["git", "cat-file", "--batch"], input=object_list, stdout=subprocess.PIPE,
                           cwd=WORKTREE, env=ENV, check=True).stdout
    response = BytesIO(blobs)
    for path, object_id in entries.items():
        received_id, kind, size = response.readline().split()
        assert received_id.decode("ascii") == object_id and kind == b"blob"
        data = response.read(int(size))
        assert response.read(1) == b"\n"
        file = directory / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(data)
    assert response.read() == b""
    verify_snapshot(directory, entries)
    core = directory / "packages/core"
    core_link = directory / "node_modules/@haven/core"
    core_link.parent.mkdir(parents=True)
    subprocess.run(
        ["node", "-e", 'require("node:fs").symlinkSync(process.argv[1], process.argv[2], "junction")',
         str(core), str(core_link)], env=ENV, cwd=directory, check=True,
    )
    assert core_link.is_junction() and core_link.resolve() == core.resolve()
    return {
        "commit": commit, "tree": tree, "directory": str(directory), "verifiedGitBlobs": len(entries),
        "gitBlobInventorySha256": sha256(json.dumps(entries, sort_keys=True).encode("utf-8")).hexdigest(),
        "workspacePackageJunction": str(core_link), "workspacePackageTarget": str(core),
    }


def powershell(script, *args):
    return subprocess.run(
        ["powershell.exe", "-NoProfile", "-NonInteractive", "-File", str(OUT / script), *map(str, args)],
        cwd=OUT, env=ENV, capture_output=True, check=False,
    )


def snapshot(label):
    name = f"machine-{label}.json"
    capture = powershell("capture-machine.ps1", OUT / name)
    if capture.returncode not in (0, 2):
        raise RuntimeError(capture.stderr.decode("utf-8", errors="backslashreplace"))
    return name, json.loads((OUT / name).read_text(encoding="utf-8")), capture.returncode


def await_machine(label):
    attempt = 0
    while True:
        name, machine, code = snapshot(label)
        if code == 0:
            return name, machine
        attempt += 1
        (OUT / name).rename(OUT / f"machine-{label}-waiting-{attempt:02d}.json")
        print(f"{label} waiting 10 s: {len(machine['competingJobs'])} job(s), "
              f"{len(machine['portListeners'])} held port(s)", flush=True)
        time.sleep(10)


def run_process(run, revision, mode, source, execution):
    machine_file, machine = await_machine(run)
    cmd = ["node", str(OUT / "harness.mjs"), run, revision, mode, source["directory"], str(VITE)]
    record = {
        "run": run, "revision": revision, "mode": mode, "machine": machine_file,
        "machineExitCode": 0, "command": cmd, "utcStart": now(),
    }
    started = time.perf_counter()
    child = subprocess.run(cmd, cwd=source["directory"], env=ENV, capture_output=True, check=False)
    record.update(
        utcEnd=now(), wallSeconds=time.perf_counter() - started, exitCode=child.returncode,
        stdout=child.stdout.decode("utf-8", errors="backslashreplace").strip(),
        stderr=child.stderr.decode("utf-8", errors="backslashreplace").strip(),
    )
    execution["processes"].append(record)
    write_json("execution.json", execution)
    print(f"{run} CPU={machine['cpu'][0]['LoadPercentage']}% {record['stdout'] or record['stderr']}", flush=True)
    if child.returncode:
        raise RuntimeError(f"{run} exited {child.returncode}")


def release_temp(temp, temp_parent):
    resolved = temp.resolve(strict=True)
    assert resolved == temp and resolved.parent == temp_parent, resolved
    assert resolved.name.startswith("p7a-prB-cold-start-") and not temp.is_junction() and not temp.is_symlink()
    size = 0
    for directory, children, files in os.walk(resolved, followlinks=False):
        parent = Path(directory)
        children[:] = [child for child in children if not (parent / child).is_junction()]
        size += sum((parent / file).stat().st_size for file in files)
    shutil.rmtree(resolved)
    assert not resolved.exists()
    return size


def main():
    assert not (OUT / "execution.json").exists(), "Preserve the existing execution before another batch"
    before = worktree_state()
    assert before["branch"] == BRANCH and before["head"] == COMMITS["head"]
    assert before["tree"] == TREES["head"] and before["originMain"] == COMMITS["base"]
    assert not before["porcelain"]
    assert git("rev-parse", "--show-object-format").strip() == "sha1"
    assert VITE.joinpath("package.json").is_file()
    write_json("worktree-before.json", before)

    temp_parent = Path(tempfile.gettempdir()).resolve(strict=True)
    temp = Path(tempfile.mkdtemp(prefix="p7a-prB-cold-start-", dir=temp_parent)).resolve(strict=True)
    execution = {"utcSetupStart": now(), "processes": [], "error": None}
    try:
        sources = {rev: stage_snapshot(temp, rev, commit) for rev, commit in COMMITS.items()}
        previous_initial = OUT.parent / "fix-round1/profile/01-base-initial-session.json"
        write_json("source-snapshots.json", {
            "initialSessionFileSha256": sha256(previous_initial.read_bytes()).hexdigest(),
            "vitePackage": str(VITE), "revisions": sources, "nodeEnvOverridesRemoved": REMOVED_NODE_ENV,
            "method": "Verified raw Git blobs from git cat-file --batch; stock Vite SSR from one installed package",
        })
        execution["utcWindowStart"] = now()
        await_machine("window-start")
        for index in range(1, 21):
            revision = "base" if index % 2 else "head"
            run_process(f"{index:02d}-{revision}", revision, "measurement", sources[revision], execution)
        execution["utcMeasurementEnd"] = now()
        for revision in COMMITS:
            run_process("profile-" + revision, revision, "profile", sources[revision], execution)
        for revision, source in sources.items():
            verify_snapshot(Path(source["directory"]), tree_entries(COMMITS[revision]))
        execution["snapshotsReverifiedAfterRuns"] = True
    except BaseException as error:
        execution["error"] = repr(error)
        raise
    finally:
        execution["utcWindowEnd"] = now()
        if "utcWindowStart" in execution:
            sleep = powershell("capture-sleep.ps1", execution["utcWindowStart"], execution["utcWindowEnd"],
                               OUT / "sleep-resume-events.json")
            execution["sleepAuditExitCode"] = sleep.returncode
            if sleep.stderr:
                execution["sleepAuditStderr"] = sleep.stderr.decode("utf-8", errors="backslashreplace").strip()
        try:
            execution["temporarySourceBytesRemoved"] = release_temp(temp, temp_parent)
        finally:
            after = worktree_state()
            execution["worktreePreserved"] = before == after
            write_json("worktree-after.json", after)
            name, machine, code = snapshot("window-final")
            execution["finalMachine"] = name
            execution["finalMachineExitCode"] = code
            execution["finalPortsFree"] = not machine["portListeners"]
            execution["utcFinish"] = now()
            write_json("execution.json", execution)
    assert execution["sleepAuditExitCode"] == 0
    assert execution["worktreePreserved"] and execution["finalPortsFree"]
    print(json.dumps({
        "measurements": 20, "profiles": 2, "window": execution["utcWindowStart"],
        "finish": execution["utcFinish"], "worktreePreserved": execution["worktreePreserved"],
        "finalPortsFree": execution["finalPortsFree"],
    }), flush=True)


if __name__ == "__main__":
    main()
