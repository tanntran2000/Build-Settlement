"""Recompute unprofiled timing, session equality and CPU sample stacks from evidence."""
from collections import Counter
from datetime import datetime
from hashlib import sha256
import json
from pathlib import Path
import re
from statistics import fmean, median
from urllib.parse import unquote

HERE = Path(__file__).resolve().parent
PRIOR = HERE.parent
EXECUTION_NAMES = [f"{i:02d}-{'base' if i % 2 else 'head'}" for i in range(1, 21)]
PROFILE_NAMES = ["profile-base", "profile-head"]
COMPILE_NAME = re.compile(r"Compile(?:Lazy|Baseline|Function|Optimizer|Optimized|Turbofan|Maglev)|(?:Parse|Compile)\w*(?:Function|Script)")


def load(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def utc(value):
    return datetime.fromisoformat(value)


def prior_runs():
    results = []
    for folder in (PRIOR / "fix-round1/profile", PRIOR / "perf-profile"):
        for path in sorted(folder.glob("??-*.json")):
            if re.fullmatch(r"\d\d-(base|head)\.json", path.name):
                metadata = load(path)
                files = {key: path.with_name(path.stem + "-" + key + "-session.json")
                         for key in ("initial", "final")}
                results.append((metadata, files))
    assert len(results) == 12
    return results


def check_session(name, kind, record, references):
    path = HERE / (name + "-" + kind + "-session.json")
    raw = path.read_bytes()
    digest = sha256(raw).hexdigest()
    metadata = record[kind + "Session"]
    assert len(raw) == metadata["bytes"] and digest == metadata["fileSha256"]
    session = json.loads(raw.decode("utf-8"))
    assert len(session["npcs"]) == 100
    assert session["city"]["world"]["week"] == (61 if kind == "final" else 1)
    assert references
    for previous, files in references:
        assert raw == files[kind].read_bytes(), (name, kind, files[kind])
        assert metadata["compactSha256"] == previous[kind + "SessionSha256"]
    return {"fileSha256": digest, "compactSha256": metadata["compactSha256"], "bytes": len(raw),
            "previousFiles": [files[kind].relative_to(PRIOR).as_posix() for _, files in references]}


def timing_row(call, sources, prior, harness_hash):
    name, revision = call["run"], call["revision"]
    record = load(HERE / (name + ".json"))
    source = sources[revision]
    assert (record["run"], record["revision"], record["mode"]) == (name, revision, call["mode"])
    assert record["exitCode"] == call["exitCode"] == 0
    assert record["commit"] == source["commit"] and record["tree"] == source["tree"]
    assert record["harnessSha256"] == harness_hash and record["productTimingHooks"] == 0
    assert record["cpuSamplingUs"] == (1000 if name in PROFILE_NAMES else None)
    assert record["workload"]["seed"] == 42 and record["workload"]["adults"] == 100
    machine = load(HERE / call["machine"])
    assert call["machineExitCode"] == 0 and not machine["competingJobs"] and not machine["portListeners"]
    assert utc(machine["utc"]) <= utc(call["utcStart"])
    assert utc(record["utcStart"]) <= utc(record["utcEnd"])
    assert utc(call["utcStart"]) <= utc(record["utcStart"]) <= utc(record["utcEnd"]) <= utc(call["utcEnd"])
    assert record["runtime"]["execArgv"] == []
    runtime = record["runtime"]
    assert all((item["node"], item["v8"], item["vite"]) == (runtime["node"], runtime["v8"], runtime["vite"])
               for item, _ in prior)
    ticks = record["ticks"]
    assert len(ticks) == 60
    timings = []
    for tick, raw in enumerate(ticks, 1):
        assert (raw["tick"], raw["weekBefore"], raw["weekAfter"]) == (tick, tick, tick + 1)
        assert raw["endWeekMs"] == raw["endMs"] - raw["startMs"] > 0
        timings.append(raw["endWeekMs"])
    final_references = [item for item in prior if item[0]["head"] == record["commit"]]
    assert len(final_references) == (6 if revision == "base" else 3)
    initial = check_session(name, "initial", record, prior)
    final = check_session(name, "final", record, final_references)
    return {
        "run": name, "revision": revision, "pid": record["pid"], "raw": name + ".json",
        "cpuBeforePct": machine["cpu"][0]["LoadPercentage"], "machine": call["machine"],
        "firstFiveMs": timings[:5], "warmMeanMs": fmean(timings[5:]),
        "over50Ticks": [tick for tick, ms in enumerate(timings, 1) if ms > 50],
        "exact50Ticks": [tick for tick, ms in enumerate(timings, 1) if ms == 50],
        "initialSession": initial, "finalSession": final,
    }


def frame_key(frame):
    url = unquote(frame["url"])
    if "/packages/" in url:
        url = "packages/" + url.split("/packages/", 1)[1]
    return frame["functionName"] or "(anonymous)", url


def profile_summary(name, timing):
    profile = load(HERE / (name + ".cpuprofile"))
    nodes = {node["id"]: node for node in profile["nodes"]}
    parents = {child: node["id"] for node in nodes.values() for child in node.get("children", [])}
    samples = profile["samples"]
    assert samples and len(samples) == len(profile["timeDeltas"])
    counts, inclusive, leaves, outside = Counter(), Counter(), Counter(), Counter()
    matched_names = {}
    for node in samples:
        stack = []
        while node is not None:
            stack.append(frame_key(nodes[node]["callFrame"]))
            node = parents.get(node)
        labels = {label for label, _ in stack}
        in_dispatch = any(
            label == "executeCharacterLifeCommand"
            and url in ("", "packages/simulation/src/character-life-command.ts")
            for label, url in stack
        ) and any(url.endswith("/cold-start/harness.mjs") for _, url in stack)
        if not in_dispatch:
            outside[stack[0]] += 1
            continue
        counts["dispatcher"] += 1
        leaves[stack[0]] += 1
        inclusive.update(set(stack))
        groups = {
            "structuredClone": {label for label in labels if label == "structuredClone"},
            "npcLifeStep": labels & {"runNpcLifeWeek"},
            "cloneInLifeStep": {"structuredClone"} if {"structuredClone", "runNpcLifeWeek"} <= labels else set(),
            "namedReport": {label for label in labels if "report" in label.lower()},
            "stateValidation": {label for label in labels if re.search(r"^(is|assert|validate).*(State|Session|Snapshot)", label)},
            "explicitCompiler": {label for label in labels if COMPILE_NAME.search(label)},
        }
        for key, matching in groups.items():
            counts[key] += bool(matching)
            matched_names.setdefault(key, set()).update(matching)
    assert counts["dispatcher"] > 0

    def ranked(counter, limit=18):
        return [{"function": key[0], "source": key[1], "samples": count}
                for key, count in sorted(counter.items(), key=lambda item: (-item[1], item[0]))[:limit]]

    return {
        "raw": name + ".cpuprofile", "run": name, "tick1Ms": timing["firstFiveMs"][0],
        "cpuBeforePct": timing["cpuBeforePct"], "allSamples": len(samples),
        "startTimeUs": profile["startTime"], "endTimeUs": profile["endTime"],
        "sumTimeDeltasUs": sum(profile["timeDeltas"]),
        "dispatcherStackSamples": counts["dispatcher"], "inclusiveCategorySamples": dict(counts),
        "dispatcherFrameUrls": sorted({node["callFrame"]["url"] for node in nodes.values()
                                       if node["callFrame"]["functionName"] == "executeCharacterLifeCommand"}),
        "categoryFrameNames": {key: sorted(values) for key, values in matched_names.items()},
        "topInclusiveFrames": ranked(inclusive), "topLeaves": ranked(leaves), "outsideDispatcherLeaves": ranked(outside),
    }


def main():
    execution = load(HERE / "execution.json")
    assert execution["error"] is None
    assert execution["worktreePreserved"] and execution["finalPortsFree"]
    assert execution["snapshotsReverifiedAfterRuns"] and execution["sleepAuditExitCode"] == 0
    assert [record["run"] for record in execution["processes"]] == EXECUTION_NAMES + PROFILE_NAMES
    source = load(HERE / "source-snapshots.json")["revisions"]
    prior = prior_runs()
    harness_hash = sha256((HERE / "harness.mjs").read_bytes()).hexdigest()
    all_rows = [timing_row(call, source, prior, harness_hash) for call in execution["processes"]]
    assert len({row["pid"] for row in all_rows}) == len(all_rows)
    rows = all_rows[:20]
    pairs = [{"pair": i, "base": base["run"], "head": head["run"],
              "deltaMs": head["firstFiveMs"][0] - base["firstFiveMs"][0],
              "warmMeanDeltaMs": head["warmMeanMs"] - base["warmMeanMs"]}
             for i, (base, head) in enumerate(zip(rows[::2], rows[1::2]), 1)]
    deltas = [row["deltaMs"] for row in pairs]
    by_revision = {}
    for rev in source:
        cohort = [row for row in rows if row["revision"] == rev]
        tick1 = [row["firstFiveMs"][0] for row in cohort]
        by_revision[rev] = {
            "commit": source[rev]["commit"], "tree": source[rev]["tree"],
            "count": len(cohort), "medianMs": median(tick1), "meanMs": fmean(tick1),
            "minMs": min(tick1), "maxMs": max(tick1), "tick1Over50": sum(ms > 50 for ms in tick1),
            "allTicksOver50": sum(len(row["over50Ticks"]) for row in cohort),
            "allTicksExactly50": sum(len(row["exact50Ticks"]) for row in cohort),
            "meanOfWarmMeansMs": fmean(row["warmMeanMs"] for row in cohort),
            "cpuBeforePctMin": min(row["cpuBeforePct"] for row in cohort),
            "cpuBeforePctMax": max(row["cpuBeforePct"] for row in cohort),
            "finalSession": cohort[0]["finalSession"],
        }
    sleep = load(HERE / "sleep-resume-events.json")
    assert sleep["eventCount"] == len(sleep["events"])
    sleep["eventsDuringProcesses"] = [
        {"event": item, "run": call["run"]} for call in execution["processes"] for item in sleep["events"]
        if utc(call["utcStart"]) <= utc(item["utc"]) <= utc(call["utcEnd"])
    ]
    profiles = [profile_summary(row["run"], row) for row in all_rows[20:]]
    summary = {
        "ownerDecision": "Clean cold-start check (Recommended)", "status": "HOLD", "budgetMs": 50,
        "measurementRuntime": load(HERE / "01-base.json")["runtime"],
        "measurementProcessCount": len(rows), "measurementSampleCount": len(rows) * 60,
        "byRevision": by_revision, "pairs": pairs,
        "paired": {"medianDeltaMs": median(deltas), "minDeltaMs": min(deltas), "maxDeltaMs": max(deltas),
                   "headSlower": sum(delta > 0 for delta in deltas), "baseSlower": sum(delta < 0 for delta in deltas),
                   "ties": sum(delta == 0 for delta in deltas)},
        "rows": rows, "profiles": profiles, "profileRuns": all_rows[20:],
        "sleepResume": sleep, "worktree": load(HERE / "worktree-after.json"),
        "temporarySourceBytesRemoved": execution["temporarySourceBytesRemoved"],
    }
    (HERE / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n",
                                      encoding="utf-8", newline="\n")
    print(json.dumps({
        "byRevision": by_revision, "paired": summary["paired"], "pairs": pairs,
        "rows": [{key: row[key] for key in ("run", "cpuBeforePct", "firstFiveMs", "warmMeanMs", "over50Ticks")}
                 for row in rows],
        "profiles": profiles, "sleepResumeEventCount": sleep["eventCount"],
        "temporarySourceBytesRemoved": execution["temporarySourceBytesRemoved"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
