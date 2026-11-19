"""Verify the two Correction 10 paths against the original commit's bytes."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01")
OUT = Path(__file__).resolve().parent
BEFORE = "133d1f0e996ef85826fb6ef63fdffeef64de2572"
BEFORE_TREE = "897e330b088442cfd421e892c7c11c79d103aa0d"
PRB = "b94d3083dd71722f329b1bf444fa9dec9b0fd309"
APPROVAL = "21c4efa28ff2e5b3cc3721df2f71af1dd5e21f14"
APPROVAL_SHA = "bad1849ffbcf3bb6b508b51a16c5d4ad2198f1457c7864ab3cf245df1ee30e4c"
PRODUCT = "packages/ui/src/NpcSheet.svelte"
SPEC = "tests/e2e/npc-sheet.spec.ts"
TITLE = "fix(ui): npc sheet panel is not a tab stop"
TRAILER = "Co-authored-by: Codex <noreply@openai.com>"


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def blob(revision, path):
    return git("show", f"{revision}:{path}")


def once(data, before, after):
    assert data.count(before) == 1, before
    return data.replace(before, after, 1)


approval_path = OUT.parent / "binding-plan-21c4efa.md"
approval = approval_path.read_bytes()
assert sha(approval) == APPROVAL_SHA
assert approval == blob(APPROVAL, "docs/superpowers/plans/2026-11-17-p7a-npc-core.md")
assert b'verbatim choice: "Panel not a tab stop (Recommended)"' in approval.split(b"### Correction 10", 1)[1]
assert git("rev-parse", f"{BEFORE}^{{tree}}").decode().strip() == BEFORE_TREE
assert git("branch", "--show-current").decode().strip() == "feat/p7a-npc-sheet"
assert git("rev-parse", "feat/p7a-npc-life-week").decode().strip() == PRB

old = {path: blob(BEFORE, path) for path in (PRODUCT, SPEC)}
product_line = b'      tabindex="0"\n'
fixed_product = once(old[PRODUCT], product_line, b"")
start = old[SPEC].index(b"  test('NPC sheet has one tab stop and linked keyboard panels'")
end = old[SPEC].index(b"  test('Weekly report renders", start)
old_case = old[SPEC][start:end]
entry = b"    await expect(tab(page, 'Profile')).toBeFocused();\n    await expect(tablist(page)"
next_focus = (
    b"    await expect(tab(page, 'Profile')).toBeFocused();\n"
    b"    await page.keyboard.press('Tab');\n"
    b"    await expect(panel(page, 'Profile').locator('summary').filter({ hasText: /^Attributes$/ })).toBeFocused();\n"
    b"    await page.keyboard.press('Shift+Tab');\n"
    b"    await expect(tab(page, 'Profile')).toBeFocused();\n"
    b"    await expect(tablist(page)"
)
old_panel_focus = (
    b"      await page.keyboard.press('Tab');\n"
    b"      await expect(currentPanel).toBeFocused();\n"
    b"      await page.keyboard.press('Shift+Tab');\n"
    b"      await expect(current).toBeFocused();\n"
)
new_case = once(old_case, entry, next_focus)
new_case = once(new_case, old_panel_focus,
                b"      expect(await currentPanel.getAttribute('tabindex')).toBeNull();\n")
expected = {
    PRODUCT: fixed_product,
    SPEC: old[SPEC][:start] + new_case + old[SPEC][end:],
}

mode, = sys.argv[1:]
assert mode in {"ready", "apply-test", "red", "apply-product", "worktree", "staged", "commit"}
head = git("rev-parse", "HEAD").decode().strip()
tree = git("rev-parse", "HEAD^{tree}").decode().strip()
status = set(filter(None, git("status", "--porcelain=v1", "--untracked-files=all", "-z").decode().split("\0")))
worktree = {path: (ROOT / path).read_bytes() for path in old}
if mode == "commit":
    assert git("rev-parse", "HEAD^").decode().strip() == BEFORE
    assert git("show", "-s", "--format=%B", "HEAD").decode().strip() == f"{TITLE}\n\n{TRAILER}"
    assert worktree == expected and not status
    assert all(blob(head, path) == raw for path, raw in expected.items())
    assert set(git("diff", "--name-only", BEFORE, head).decode().splitlines()) == set(expected)
    assert not git("diff", "--summary", BEFORE, head)
    git("diff", "--check", BEFORE, head)
else:
    assert (head, tree) == (BEFORE, BEFORE_TREE)
    if mode in {"ready", "apply-test"}:
        assert not status and worktree == old
    elif mode in {"red", "apply-product"}:
        assert status == {" M " + SPEC} and worktree == {PRODUCT: old[PRODUCT], SPEC: expected[SPEC]}
    elif mode == "worktree":
        assert status == {" M " + path for path in expected} and worktree == expected
    elif mode == "staged":
        assert status == {"M  " + path for path in expected} and worktree == expected
        assert all(git("show", f":{path}") == raw for path, raw in expected.items())
        assert not git("diff", "--cached", "--summary")
    git("diff", "--check", "HEAD")

if mode == "apply-test":
    (ROOT / SPEC).write_bytes(expected[SPEC])
elif mode == "apply-product":
    (ROOT / PRODUCT).write_bytes(expected[PRODUCT])

print(json.dumps({
    "mode": mode, "utc": datetime.now(timezone.utc).isoformat(),
    "head": head, "tree": tree, "parentUnderTest": BEFORE, "approval": APPROVAL, "approvalSha256": APPROVAL_SHA,
    "statusBeforeAction": sorted(status), "allowedPaths": list(expected),
    "products": {path: {"parentSha256": sha(old[path]), "verifiedCheckoutSha256": sha(worktree[path]),
                       "approvedResultSha256": sha(expected[path])} for path in expected},
    "removedProductLine": product_line.decode(),
    "changedTest": "NPC sheet has one tab stop and linked keyboard panels",
    "keyboardPath": "Profile tab -> Attributes summary -> Profile tab. Check all four panels for absent tabindex.",
}, indent=2))
