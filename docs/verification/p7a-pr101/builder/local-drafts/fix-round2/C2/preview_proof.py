"""Hash preview HTML and all direct JS/CSS entries against the exact production build."""
import argparse
from contextlib import ExitStack
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import time
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen

ROOT = Path("C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01")
OUT = Path(__file__).resolve().parent
PIN = json.loads((OUT / "exact-head.json").read_bytes())
VITE = ROOT / "packages/ui/node_modules/vite/bin/vite.js"
PORTS = {4173: ROOT / "packages/ui/dist", 4174: ROOT / "packages/ui/regression/dist"}


def now():
    return datetime.now(timezone.utc).isoformat()


def dump(file, value):
    (OUT / file).write_bytes((json.dumps(value, indent=2) + "\n").encode())


class Entries(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attributes):
        attr = dict(attributes)
        path = attr.get("src") if tag == "script" else attr.get("href") if tag == "link" else None
        if path and path.startswith("/assets/") and urlparse(path).path.endswith((".js", ".css")):
            self.paths.append(path)


def digest(raw):
    return sha256(raw).hexdigest()


def response(address):
    with urlopen(address, timeout=2) as stream:
        status, data = stream.status, stream.read()
    assert status == 200, (address, status)
    return data


def inspect(port):
    bundle = json.loads((OUT / "bundle-results.json").read_bytes())
    assert (bundle["head"], bundle["tree"]) == (PIN["head"], PIN["tree"])
    expected = {"/" + row["path"]: row["sha256"] for row in bundle["files"] if row["entry"]}
    base = f"http://localhost:{port}/"
    disk = PORTS[port]
    html = response(base)
    assert html == (disk / "index.html").read_bytes(), f"HTML mismatch at {port}"
    paths = Entries()
    paths.feed(html.decode())
    assert set(paths.paths) == set(expected), (port, paths.paths, list(expected))
    assets = []
    for path in paths.paths:
        url = urljoin(base, path)
        assert urlparse(url).hostname == "localhost" and urlparse(url).port == port
        relative = urlparse(path).path.lstrip("/")
        served = response(url)
        disk_sha = digest((disk / relative).read_bytes())
        served_sha = digest(served)
        assert expected[path] == disk_sha == served_sha, (port, relative, expected[path], disk_sha, served_sha)
        if relative.endswith(".js"):
            assert PIN["shortHead"].encode() in served, f"Build revision missing at {port}"
        assets.append({"url": url, "bytes": len(served), "expectedSha256": expected[path],
                       "servedSha256": served_sha, "diskSha256": disk_sha})
    return {"utc": now(), "htmlUrl": base, "htmlSha256": digest(html), "matched": True, "assets": assets}


def command(port):
    args = ["node", str(VITE), "preview"]
    if port == 4174:
        args += ["regression", "--config", "vite.config.ts", "--outDir", "dist"]
    return args + ["--port", str(port), "--strictPort"]


def preflight():
    assert VITE.is_file()
    checks, errors, runs = {}, {}, []
    try:
        with ExitStack() as stack:
            for port in PORTS:
                args = command(port)
                target = stack.enter_context((OUT / f"preview-{port}.txt").open("xb"))
                child = subprocess.Popen(args, cwd=ROOT / "packages/ui", stdout=target, stderr=subprocess.STDOUT,
                                         creationflags=subprocess.CREATE_NO_WINDOW)
                runs.append((port, child, args))
                stack.callback(stop, child)
            deadline = time.monotonic() + 40
            while len(checks) != len(PORTS) and time.monotonic() < deadline:
                for port, child, _ in runs:
                    assert child.poll() is None, (port, child.returncode)
                    if str(port) in checks:
                        continue
                    try:
                        checks[str(port)] = inspect(port)
                    except (OSError, AssertionError) as e:
                        errors[str(port)] = str(e)
                if len(checks) < len(PORTS):
                    time.sleep(0.5)
    finally:
        success = len(checks) == len(PORTS)
        dump("served-assets-before-smoke.json", {
            "head": PIN["head"], "tree": PIN["tree"], "utc": now(), "matched": success, "ports": checks,
            "previewProcesses": [{"port": p, "pid": c.pid, "args": a, "terminated": c.poll() is not None} for p,c,a in runs],
            "lastErrors": errors if not success else {},
        })
    assert success, errors


def stop(child):
    if child.poll() is None:
        child.terminate()
        child.wait(timeout=8)


if __name__ == "__main__":
    preflight()
    print("Both previews matched the exact build. Owned preview processes stopped.")
