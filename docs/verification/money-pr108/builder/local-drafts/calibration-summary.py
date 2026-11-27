from pathlib import Path
from statistics import mean
from random import Random
from collections import defaultdict
import json
d = Path(__file__).parent
def load(name):
    return json.loads((d / name).read_text(encoding="utf-8"))["rows"]
unmodified = load("baseline-money.json")
with_security = load("baseline-with-security.json")
candidate = load("candidate-measurement.json")
assert unmodified == [{k: v for k, v in r.items() if k != "security"} for r in with_security]
orig = defaultdict(list)
measured = defaultdict(list)
for r in with_security:
    orig[r["style"], r["difficulty"], r["levyPercent"], r["seed"]].append(r)
for r in candidate:
    measured[r["style"], r["difficulty"], r["levyPercent"], r["seed"]].append(r)
assert [{k:v for k,v in r.items()} for r in unmodified if r["levyPercent"]==0] == [
    {k: r[k] for k in unmodified[0]} for r in candidate if r["levyPercent"]==0]
new_keys = next(iter(candidate)).keys()-next(iter(unmodified)).keys()
frozen = [k for k in unmodified[0] if k != 'moneyAfterMilli']
assert all([{k:r[k] for k in frozen} for r in orig[key]] ==
           [{k:r[k] for k in frozen} for r in measured[key]] for key in orig)
def amount(milli):
    return f"{milli/1000:.3f}"
lines = [
    "# M3 calibration preflight",
    "",
    "Baseline main 0b2b3a6. Raw unchanged script output is baseline-money.json. baseline-with-security.json adds the closing Security from the same routes in scratch. All other baseline columns match exactly. candidate-measurement.json is the draft proposal under a fixed Pay policy, and reproduces all opening-to-closing Gold, levy-credit and Happiness route columns. All 0% rows match across every original column.",
    "",
    "Seeds 2026, 2027, 2028 in that order. Expected count uses 20,000 synthetic sequences per seed and cell from Random(2811), frozen baseline weekly income and Security, each hit deducting floor(25% × exposure) before the next week. This estimate models follow-on balance and applies the chance cap. The fixed seed run uses the actual engine and actual salts. No spend or donation on these measurement routes. A dash means the seed closed all weeks with no hits.",
    "",
    "| Good route | Levy | Security | Week first > safe | Weeks to 15 Money on main | Expected hits / 40 | Observed hits / 40 |",
    "|---|---:|---:|---|---|---:|---|",
]
losses=[]
for difficulty in ["normal", "easy"]:
    for levy in [5,10]:
        first, first15, expected, actual, sec = [], [], [], [], []
        for seed in [2026,2027,2028]:
            k = ("good", difficulty, levy, seed)
            rows, seen = orig[k], measured[k]
            assert len(rows)==len(seen)==40
            safe = [15000+250*r["security"] for r in rows]
            def week(fn):
                return next((r['week'] for r in rows if fn(r)), '—')
            first.append(week(lambda r: r["moneyAfterMilli"] > safe[r["week"]-1]))
            first15.append(week(lambda r: r["moneyAfterMilli"] >= 15000))
            hits = [r for r in seen if r["robberyHit"]]
            rng = Random(2811)
            n = 20000
            total = 0
            for j in range(n):
                cash = 0
                for r, threshold in zip(rows, safe):
                    cash += r["levyMoneyMilli"]
                    excess = cash-threshold
                    if excess>0 and rng.randrange(10000)<min(2500,excess*120//1000):
                        cash -= excess*2500//10000
                        total += 1
            expected.append(total/n)
            actual.append(len(hits))
            sec.extend(r["security"] for r in rows)
            if hits:
                r = hits[0]; ex = r["robberyExcessMilli"]
                losses.append((difficulty, levy, seed, r["week"], amount(ex), amount(ex*2500//10000),
                               f"0 / {amount(ex*6000//10000)}", amount(ex*6000//10000),
                               f'{min(10000,r["security"]*250)/100:g}%' if r['security'] >= 15 else 'Unavailable (Security 10)'))
            else:
                losses.append((difficulty,levy,seed,*(['—']*6)))
        show = lambda a: '/'.join(map(str,a))
        lines.append(f"| {difficulty.title()} | {levy}% | {min(sec)}–{max(sec)} | {show(first)} | {show(first15)} | {mean(expected):.2f} | {show(actual)} |")
lines.extend([
    "",
    "Losses in Money on the first observed hit for each seed. Chase shows successful / failed loss. Pay, Chase and Let go use the same formula on both difficulties.",
    "",
    "| Difficulty | Levy | Seed | Week | Excess | Pay | Chase | Let go | Chase availability / success |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    *['| '+' | '.join(str(v) for v in row)+' |' for row in losses],
    "",
    "Security across the main routes at 5% and 10%, all seeds combined.",
    "",
    "| Style | Normal 5% | Normal 10% | Easy 5% | Easy 10% |",
    "|---|---:|---:|---:|---:|",
])
for style in ["good","average","bad"]:
    row=[]
    for diff in ['normal','easy']:
        for levy in [5,10]:
            all_routes = [r["security"] for seed in [2026,2027,2028] for r in orig[style,diff,levy,seed]]
            row.append(f"{min(all_routes)}–{max(all_routes)}")
    lines.append('| '+style.title()+' | '+' | '.join(row)+' |')
(d/'calibration-summary.md').write_bytes(('\n'.join(lines)+'\n').encode())
