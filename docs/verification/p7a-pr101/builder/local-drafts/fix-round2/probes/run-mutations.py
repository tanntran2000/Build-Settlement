"""Exercise the actual tightened assertions in generated copies outside the checkout."""
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import subprocess
import sys

OUT = Path(__file__).resolve().parent
DRAFT = OUT.parent.parent
ROOT = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01")
RAW = DRAFT.with_name(DRAFT.name + "-local-only") / "fix-round2/probes"
RUNNER = DRAFT / "C1/run-command.py"
PW = ROOT / "node_modules/@playwright/test"
UNIT = ROOT / "packages/ui/src/__tests__/npc-sheet-view.test.ts"
BROWSER = ROOT / "tests/e2e/npc-sheet.spec.ts"
ANCHOR = "    const { origin, hobbies, affection, skills } = project()(npc);"


def replace(source, old, new):
    assert source.count(old) == 1, old
    return source.replace(old, new)


def relative(target, parent):
    return os.path.relpath(target, parent).replace(os.sep, "/")


def run(log, *command, extra=None):
    env = {**os.environ, "CI": "1", "NO_COLOR": "1", **(extra or {})}
    return subprocess.run(
        [sys.executable, "-B", str(RUNNER), str(log), "--", *map(str, command)],
        cwd=ROOT, env=env, check=False,
    ).returncode


def unit():
    base = RAW / "unit"
    tests = base / "__tests__"
    tests.mkdir(parents=True, exist_ok=True)
    projection = UNIT.parent.parent / "npc-sheet-view.ts"
    (base / projection.name).write_bytes(projection.read_bytes())
    configured = {
        "root": base.as_posix(),
        "resolve": {"alias": {"@haven/core": (ROOT / "packages/core/src/index.ts").as_posix(),
                              "vitest": (ROOT / "node_modules/vitest/dist/index.js").as_posix()}},
        "test": {"include": ["__tests__/npc-sheet-view.test.ts"]},
    }
    config = base / "vitest.config.mjs"
    config.write_text("export default " + json.dumps(configured) + ";\n", encoding="utf-8")
    source = UNIT.read_text(encoding="utf-8")
    source = replace(source, ANCHOR, "\n".join([
        "    const projected = project()(npc);",
        "    Object.assign(projected.skills[0], { unexpected: 'mutation probe' });",
        "    const { origin, hobbies, affection, skills } = projected;",
    ]))
    (tests / UNIT.name).write_text(source, encoding="utf-8")
    log = OUT / "unit-extra-skill-property.txt"
    code = run(log, "node", ROOT / "node_modules/vitest/vitest.mjs", "run", "--config", config,
               "-t", "projects the NPC profile and five skills")
    transcript = log.read_text(encoding="utf-8")
    assert code == 1 and '"unexpected": "mutation probe"' in transcript, transcript[-4000:]
    assert "1 failed" in transcript and ".toStrictEqual(" in transcript, transcript[-4000:]
    return {"finding": "P1 projection", "exitCode": code, "log": log.name, "matcher": "toStrictEqual",
            "mutation": "Add unexpected: 'mutation probe' to the projected Management row"}


AGE = """
    await profile.getByText(/^Age {age} · {title} · Background:/).evaluate(node => {{
      node.textContent += ' [mutation probe]';
    }});
"""

FRUGAL = """
    const restlessSummary = await rowValue(profile, 'Restless').textContent();
    await rowValue(profile, 'Frugal').evaluate((node, summary) => {{
      node.textContent = summary;
    }}, restlessSummary);
"""

ACCESSIBLE = """
    await adult.getByRole('progressbar', {{ name: '{part}', exact: true }}).evaluate(bar => {{
      const wrong = document.createElement('span');
      wrong.id = 'probe-description';
      wrong.hidden = true;
      wrong.textContent = 'Wrong accessible description [mutation probe]';
      bar.after(wrong);
      bar.setAttribute('aria-describedby', wrong.id);
    }});
"""

VISIBLE = """
    await adult.getByRole('progressbar', {{ name: '{part}', exact: true }}).evaluate(bar => {{
      const label = document.getElementById(bar.getAttribute('aria-describedby')!)!;
      const copy = label.cloneNode(true) as HTMLElement;
      copy.hidden = true;
      label.removeAttribute('id');
      bar.parentElement!.after(copy);
      label.textContent += ' [mutation probe]';
    }});
"""


def make_browser_suite():
    tests = RAW / "browser/tests"
    tests.mkdir(parents=True, exist_ok=True)
    (tests.parent / "package.json").write_text(json.dumps({"type": "module"}), encoding="utf-8")
    config = tests.parent / "playwright.config.ts"
    original = (ROOT / "playwright.config.ts").read_text(encoding="utf-8")
    config.write_text(original.replace("'./tests/e2e'", "'./tests'")
        .replace("from '@playwright/test'", "from '" + relative(PW / "index.mjs", tests.parent) + "'")
        .replace("    port: 417", "    cwd: " + json.dumps(ROOT.as_posix()) + ",\n    port: 417"),
        encoding="utf-8")
    source = BROWSER.read_text(encoding="utf-8")
    prefix = source[:source.index("for (const viewport of desktops)")]
    prefix = prefix.replace("from '@playwright/test'", "from '" + relative(PW / "index.mjs", tests) + "'")
    prefix = prefix.replace("from '../../packages/", "from '" + relative(ROOT / "packages", tests) + "/")
    prefix = prefix.replace("from './character-life-navigation.helpers.ts'",
                            "from '" + relative(BROWSER.with_name("character-life-navigation.helpers.ts"), tests) + "'")
    profile = source[source.index("  test('Profile shows"):source.index("  test('Skills shows")].rstrip()
    adult = source[source.index("  test('18+ shows"):source.index("  test('History shows")].rstrip()
    cases = []
    frugal_anchor = "    await expect(rowValue(profile, 'Frugal'))"
    cases.append(("Frugal description", profile, frugal_anchor, FRUGAL.format(),
                  ["toHaveText", "Dislikes staying on one post for long."]))
    for age, title in [(49, "Mature"), (50, "Granny")]:
        anchor = f"    await expect(profile.getByText('Age {age}"
        cases.append((f"Age {age} background", profile, anchor, AGE.format(age=age, title=title),
                      ["toBeVisible", f"Age {age} · {title} · Background: technician · skilled · citizen", "element(s) not found"]))
    for part, level in [
        ("Hand", "Novice · 17 / 100"), ("Mouth", "Professional · 110 / 200"), ("Breast", "Expert · 300 / 300"),
        ("Vagina", "Novice · 0 / 100"), ("Ass", "Novice · 0 / 100"),
    ]:
        anchor = "    const parts = "
        cases.append((part + " accessible description", adult, anchor, ACCESSIBLE.format(part=part),
                      ["toHaveAccessibleDescription", f"name: '{part}'", "Wrong accessible description [mutation probe]"]))
        cases.append((part + " visible row level", adult, anchor, VISIBLE.format(part=part),
                      ["toBeVisible", f"name: '{part}'", level, "element(s) not found"]))
    rendered = [prefix, "test.use({ viewport: desktops[0] });"]
    markers = {}
    for name, body, anchor, hook, expected in cases:
        title = "mutation: " + name
        rendered.append(re.sub(r"^  test\('[^']+'", "  test(" + json.dumps(title), replace(body, anchor, hook + anchor)))
        markers[title] = expected
    path = tests / "npc-sheet-probes.spec.ts"
    path.write_text("\n\n".join(rendered) + "\n", encoding="utf-8")
    return config, markers


def browser():
    config, markers = make_browser_suite()
    report = RAW / "browser-report.json"
    path = OUT / "browser-mutations-CI1.txt"
    code = run(path, "node", PW / "cli.js", "test", "--config", config,
               "--project", "chromium", "--reporter", "list,json", "--output", RAW / "browser-failures",
               extra={"PLAYWRIGHT_JSON_OUTPUT_FILE": str(report)})
    assert code == 1 and report.is_file(), path.read_text(encoding="utf-8")[-5000:]
    data = json.loads(report.read_bytes())
    assert data["errors"] == []
    stats = data["stats"]
    assert (stats["unexpected"], stats["expected"], stats["flaky"], stats["skipped"]) == (len(markers), 0, 0, 0)
    cases = {}
    for suite in data["suites"]:
        for spec in suite["specs"]:
            name = spec["title"]
            [result] = spec["tests"][0]["results"]
            assert result["status"] == "failed" and len(result["errors"]) == 1, spec
            message = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", result["errors"][0]["message"])
            assert all(marker in message for marker in markers[name]), (name, message)
            cases[name] = {"matchersObserved": markers[name], "failure": message}
    assert set(cases) == set(markers), cases.keys()
    return {"exitCode": code, "scheduled": len(markers), "expectedFailuresObserved": len(cases),
            "log": path.name, "cases": cases}


def main():
    originals = {p: sha256(p.read_bytes()).hexdigest() for p in [UNIT, BROWSER]}
    unit_report = OUT / "unit-result.json"
    if sys.argv[1:] == ["--browser-only"]:
        unit_result = json.loads(unit_report.read_bytes())
    else:
        unit_result = unit()
        unit_report.write_text(json.dumps(unit_result, indent=2) + "\n", encoding="utf-8")
    browser_result = browser()
    assert all(sha256(p.read_bytes()).hexdigest() == digest for p, digest in originals.items())
    combined = {"projection": unit_result, "browser": browser_result, "realTestFilesSha256": {
        str(p.relative_to(ROOT).as_posix()): digest for p, digest in originals.items()}}
    (OUT / "mutation-results.json").write_text(json.dumps(combined, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Expected failures at the exact assertions: 1 projection, 13 browser.")


if __name__ == "__main__":
    main()

