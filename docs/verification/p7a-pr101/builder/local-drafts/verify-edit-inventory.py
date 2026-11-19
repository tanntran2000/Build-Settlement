"""Verify or write the paths authorized by P7-A PR C Corrections 8 and 9."""
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import subprocess

BASE = "b94d3083dd71722f329b1bf444fa9dec9b0fd309"
BASE_TREE = "947f604e17427d916e1ef0e21083dbc2f72920b6"
PINS = {
    "STEP0-HOLD.md": "6bdd83f921811ea8d95408b015ec6e093ff8ade9baccffc1a600dd57f412e096",
    "C0-edit-inventory.json": "c54c0538f72331511baada892f409352edcce4d7ad5bbef28968f5e219247353",
}
RED_TESTS = {"packages/ui/src/__tests__/npc-sheet-view.test.ts", "tests/e2e/npc-sheet.spec.ts"}
REPORT_TEST = "packages/ui/src/__tests__/report-letters.test.ts"
EVIDENCE = Path(__file__).resolve().parent
ENV = dict(os.environ, GIT_OPTIONAL_LOCKS="0")

parser = argparse.ArgumentParser()
parser.add_argument("mode", choices=["red", "apply-report-test", "red-report", "apply", "worktree", "staged", "commit"])
parser.add_argument("--repo", type=Path, default=Path.cwd())
args = parser.parse_args()
root = args.repo.resolve(strict=True)


def git(*parameters):
    return subprocess.check_output(["git", *parameters], cwd=root, env=ENV)


def single(*parameters):
    return git(*parameters).decode().strip()


def digest(data):
    return sha256(data).hexdigest()


def tree(ref):
    result = {}
    for row in git("ls-tree", "-r", "-z", ref).decode().split("\0"):
        if row:
            metadata, path = row.split("\t", 1)
            mode, kind, object_id = metadata.split()
            assert kind == "blob"
            result[path] = mode, object_id
    return result


def project(original, edits, kind):
    lines = original.splitlines(keepends=True)
    result = []
    cursor = 0
    for hunk in edits:
        start, stop = hunk["start"] - 1, hunk["end"]
        assert cursor <= start <= stop <= len(lines), hunk["id"]
        assert b"".join(lines[start:stop]) == hunk[kind + "Before"].encode(), hunk["id"]
        result.extend(lines[cursor:start])
        result.append(hunk[kind + "After"].encode())
        cursor = stop
    return b"".join(result + lines[cursor:])


def status_paths():
    status = [line for line in git("status", "--porcelain=v1", "-z", "--untracked-files=all").decode().split("\0") if line]
    assert all("R" not in line[:2] and "C" not in line[:2] for line in status)
    return {line[3:]: line[:2] for line in status}


for name, expected in PINS.items():
    assert digest((EVIDENCE / name).read_bytes()) == expected, name
inventory = json.loads((EVIDENCE / "C0-edit-inventory.json").read_bytes())
audit = json.loads((EVIDENCE / "C0-search-inventory.json").read_bytes())
assert (inventory["baseCommit"], inventory["baseTree"]) == (BASE, BASE_TREE)
assert single("branch", "--show-current") == "feat/p7a-npc-sheet"
assert single("rev-parse", "refs/heads/feat/p7a-npc-life-week") == BASE
assert single("rev-parse", BASE + "^{tree}") == BASE_TREE
head = single("rev-parse", "HEAD")
if args.mode == "commit":
    assert single("rev-list", "--parents", "-n", "1", head).split() == [head, BASE]
else:
    assert head == BASE
base_files = tree(BASE)
approved = {item["path"]: item for item in inventory["files"]}
new = set(inventory["newAllowlistedFiles"])
assert len(approved) == 12 and len(new) == 4
assert [e["id"] for item in approved.values() for e in item["edits"]] == [f"E{i:02}" for i in range(1, 47)]
assert [e["id"] for e in approved[REPORT_TEST]["edits"]] == ["E21", "E22"]

if args.mode in ("apply", "worktree", "staged", "commit"):
    pin_bytes = (EVIDENCE / "C1/E46-correction-9-pin.json").read_bytes()
    assert digest(pin_bytes) == "aa5b494f91a7609394e74d57d88064e69831b0dded5ebce6f5dfb3beb8b6edff"
    correction = json.loads(pin_bytes)
    proposal_bytes = (EVIDENCE / "C1/E46-correction-proposal.json").read_bytes()
    assert digest(proposal_bytes) == correction["proposalSha256"]
    assert digest((EVIDENCE / "binding-plan-ba0c883.md").read_bytes()) == correction["bindingPlanSha256"]
    proposal = json.loads(proposal_bytes)
    path = correction["path"]
    assert path == proposal["path"] == "tests/e2e/world-npc-session.spec.ts"
    assert correction["hunk"] == proposal["hunk"] == "E46"
    expected = approved[path]
    hunk = next(edit for edit in expected["edits"] if edit["id"] == "E46")
    old_line = proposal["approvedCheckoutLine"]
    new_line = proposal["proposedCheckoutLine"]
    assert expected["checkout"]["afterSha256"] == correction["checkoutBeforeSha256"]
    assert old_line.count("has:skills.getByText") == 1 and old_line.replace("has:skills.getByText", "has:page.getByText") == new_line
    for variant in ("checkout", "git"):
        key = variant + "After"
        before, after = (old_line, new_line) if variant == "checkout" else (old_line.replace(chr(13) + chr(10), chr(10)), new_line.replace(chr(13) + chr(10), chr(10)))
        assert hunk[key].count(before) == 1
        hunk[key] = hunk[key].replace(before, after, 1)
        expected[variant]["afterSha256"] = correction[variant + "AfterSha256"]
assert set(audit["trackedPaths"]) == set(base_files)
assert not (new & base_files.keys())

selected = ({REPORT_TEST} if args.mode in ("apply-report-test", "red-report")
            else set(approved) if args.mode in ("apply", "worktree", "staged", "commit") else set())
expected_new = RED_TESTS if args.mode in ("red", "apply-report-test", "red-report") else new
before_paths = status_paths()
if args.mode == "apply-report-test":
    assert set(before_paths) == RED_TESTS
elif args.mode == "apply":
    assert set(before_paths) <= new | {REPORT_TEST}
assert all((root / path).is_file() for path in expected_new)

reconstructed_base = sha256()
git_projections = {}
writes = {}
for path in audit["trackedPaths"]:
    raw = (root / path).read_bytes()
    if path not in approved:
        reconstructed_base.update(path.encode() + b"\0" + sha256(raw).digest())
        continue
    item = approved[path]
    assert base_files[path][1] == item["gitBlob"], path
    old_git = git("cat-file", "blob", item["gitBlob"])
    assert digest(old_git) == item["git"]["beforeSha256"]
    new_git = project(old_git, item["edits"], "git")
    assert digest(new_git) == item["git"]["afterSha256"]
    git_projections[path] = new_git
    before_sha, after_sha = [item["checkout"][label] for label in ("beforeSha256", "afterSha256")]
    current = digest(raw)
    if path in selected and args.mode in ("apply-report-test", "apply") and current == before_sha:
        output = project(raw, item["edits"], "checkout")
        assert digest(output) == after_sha and output.replace(b"\r\n", b"\n") == new_git
        writes[path] = output
    else:
        assert current == (after_sha if path in selected else before_sha), path
        assert raw.replace(b"\r\n", b"\n") == (new_git if path in selected else old_git)
    reconstructed_base.update(path.encode() + b"\0" + bytes.fromhex(before_sha))
assert reconstructed_base.hexdigest() == audit["trackedCheckoutByteInventorySha256"]
for path, data in writes.items():
    (root / path).write_bytes(data)
    assert (root / path).read_bytes() == data

after = status_paths()
if args.mode == "commit":
    assert not after
else:
    assert set(after) == selected | expected_new, after
if args.mode in ("staged", "commit"):
    revision = single("write-tree") if args.mode == "staged" else head
    actual = tree(revision)
    assert set(actual) == set(base_files) | new
    assert {p for p in base_files if base_files[p] != actual[p]} == set(approved)
    for path, expected in git_projections.items():
        assert actual[path][0] == base_files[path][0], path
        assert git("cat-file", "blob", actual[path][1]) == expected, path
    for path in new:
        assert actual[path][0] == "100644", path
        assert git("cat-file", "blob", actual[path][1]) == (root / path).read_bytes().replace(b"\r\n", b"\n"), path
    if args.mode == "staged":
        assert all(value[1] == " " for value in after.values()), after

print(json.dumps({
    "utc": datetime.now(timezone.utc).isoformat(), "mode": args.mode, "base": BASE, "baseTree": BASE_TREE,
    "head": head, "tree": single("rev-parse", "HEAD^{tree}"),
    "verifiedHunks": sum(len(approved[path]["edits"]) for path in selected),
    "verifiedProjectedHunks": 46, "correction9": args.mode in ("apply", "worktree", "staged", "commit"), "existingFiles": len(selected), "otherBaseFilesVerified": len(base_files)-len(selected),
    "approvedInventorySha256": PINS["C0-edit-inventory.json"], "step0Sha256": PINS["STEP0-HOLD.md"],
    "newPaths": sorted(expected_new), "worktreePorcelain": after,
    "newFileHashes": {path: digest((root / path).read_bytes()) for path in sorted(expected_new)},
}, indent=2))
