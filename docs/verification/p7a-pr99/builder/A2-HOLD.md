# P7-A PR A — A2 HOLD for three additional city hash pins

Status: HOLD. No edit to craft-week.test.ts has been made. A1 is committed; A2 changes are staged and preserved; A2 is not committed. A3 has not started.

Owner Tân, 2026-11-17: "Approve all 4 (Recommended)" closed the original Step 0 HOLD. Binding plan correction 1 at 32c8598 approves E01–E50 only. The instruction "Anything new outside this list is a new HOLD" now applies. These opaque full-city pins were missed in A0; this report corrects the inventory before any edit.

HEAD: 927f5be7bb0de8b3fff884daa3da89e98ae03e9e
HEAD tree: 1403e7c099cda27cb123fa36b95342efcdb47c20
Staged candidate tree: d34090999dec94488eabd92f799a61fd2a4c257f
Base: 753e4503673df86830fba2ef2c9ef1e64a843729
UTC: 2026-11-17T06:36:53.851739+00:00

## Observed failure and isolated cause

`A2-GREEN.txt` records the full `npm test` command, HEAD, staged tree, full output, UTC and exit 1: 130 files, 129 passed / 1 failed; 3,028 tests passed / 3 failed (3,031 total). All failures are the no-order 60-week seeds 0, 42 and 20261028 at craft-week.test.ts:29. The reports and items hash pins pass unchanged.

`investigate-craft-pins.mjs` replays the exact production scenario using the installed Vite SSR module loader, with no HTTP/HMR listener, dependency install, build, or repository edit. For each final city it changes only the in-memory ruleset string from 10 back to 09. Every original city hash is then recovered exactly; every original reports/items hash is unchanged. The evidence is in A2-HOLD-investigation.txt and craft-pin-investigation.json, with raw city/reports/item artifacts per seed.

## Exact proposed additional edits (not applied)

Only the three city hash string values below would change. Keep the reports/items pins, seed set, 60-week loop, exact toEqual assertion, week-61 assertion, isItemsState check, timeouts and every other byte of this test unchanged. After approval, candidate inventory would grow from 59 to 60 paths and existing-test files from 34 to 35.

### E51 - packages/simulation/src/__tests__/craft-week.test.ts:13 (seed 0)

Before:
```ts
  0: {reports:'9bb24301f4ede325b0e0e116b03add674eb0c692dfa80fe16bddf0da61a66bc4',items:'cddabceee23c2746d4dd3408d05e71ee624dd800d8a0f761cb88f130122deb65',city:'7b013be31e647b47e1abe80ffead9e80d30bfa280c2c9269b649fe8d31b132ae'},
```
After:
```ts
  0: {reports:'9bb24301f4ede325b0e0e116b03add674eb0c692dfa80fe16bddf0da61a66bc4',items:'cddabceee23c2746d4dd3408d05e71ee624dd800d8a0f761cb88f130122deb65',city:'cb611be6c8b7540c4c83f844a566272c0b2dba394609f4ec12b0208011139c54'},
```

### E52 - packages/simulation/src/__tests__/craft-week.test.ts:14 (seed 42)

Before:
```ts
  42: {reports:'04aa55b35d7e8551323fbc2c66c6bf286fb06658b9163fd4a9e3aa327d705ea2',items:'283da6a1e4fed8fdc3a419e72e00827020ab1ace63f68277db0c1d7cee5616e8',city:'4054962deb8c4502aab86723b505f7e7d7913a87073c2b29ad19c077003d9cdb'},
```
After:
```ts
  42: {reports:'04aa55b35d7e8551323fbc2c66c6bf286fb06658b9163fd4a9e3aa327d705ea2',items:'283da6a1e4fed8fdc3a419e72e00827020ab1ace63f68277db0c1d7cee5616e8',city:'2c7e1a942c7bf05d2b462bb67aa0c05145107cfb0bce714ec3d8c2ba1b2d5e01'},
```

### E53 - packages/simulation/src/__tests__/craft-week.test.ts:15 (seed 20261028)

Before:
```ts
  20261028: {reports:'a32127339cab716bfa6ccab522d0da3a455a75eca6b455ae0e7adb508e781940',items:'3ad4de4ea7c6a0687ac6d8481778a2513e841dd061e1712429d8bb2dacc31515',city:'198e769da35a411d3f9cdebdb6195ad545e9e9392e94030ae637bc654beb8803'},
```
After:
```ts
  20261028: {reports:'a32127339cab716bfa6ccab522d0da3a455a75eca6b455ae0e7adb508e781940',items:'3ad4de4ea7c6a0687ac6d8481778a2513e841dd061e1712429d8bb2dacc31515',city:'73863ad6709a288163077c5d3167d857685ecc92b1f54593f50caf8313f49e04'},
```

## Completed and pending evidence

| Item | Actual result |
|---|---|
| A1 RED | 73 failed / 213 passed; exit 1 before product edits |
| A1 GREEN | 286/286 passed across six files; exit 0 |
| A1 typecheck | Core exit 0 after one new-test symbol typing fix; both logs retained |
| A1 commit | 927f5be7bb0de8b3fff884daa3da89e98ae03e9e, feat(core): npc life sheet state and catalog; required coauthor trailer present |
| A2 RED | 82 failed / 88 passed; exit 1 before A2 product edits |
| A2 generators | 55/55 fixture tests and 4/4 golden tests passed; golden generator invoked exactly once |
| A2 persistence typecheck | Exit 0 |
| A2 full suite | 3,028 passed / 3 failed; exit 1; three unapproved city hash pins only |
| Edit inventory | 59 approved paths; 34 existing test files exactly match E01–E50; no unapproved existing-test edit |
| Golden and fixture diff | 3 golden seeds, 10 v10 fixtures, 841 allowed state leaves; forbidden paths 0; 63 historical fixtures and 9 generator/evidence blobs unchanged |
| A2 commit | Not made while the suite is red |
| A3 gates 1–7 | Not run; CPU at gate start N/A |
| CI=1 smoke and bundle measurement | Not run; HOLD before A3 |

## Approved catalog hash changes

These are the originally approved pins; they are separate from the three newly discovered city pins.

- `SOCIETY_TRIAL`: `49add1753fd6d630e3cf7f4f7395f2bd7b844936086ef0b9f06fb6cb595090e6` → `69779e596f2abca5afe88b5858be9d850a6a062dd772ea093bbfebf3ec983acc`.
- `NPC_ORIGINS`: `(new)` → `c252b2c5d31d302c307df967c94b43714f4e3debd527299819f60117f0378f09`.
- `NPC_HOBBIES`: `(new)` → `8a4c0e75fca9aa9b8fd5e26a5bfac38aa161864e02b97832c77955089d7205c2`.
- `P7A_TRIAL`: `(new)` → `b1429bf557d9a96e825a2d9a6d788524ee1e57db1572d35a6c405f2924797013`.

## Preserved execution state

52 A2 paths are staged. Product git status is intentionally nonempty; no unstaged or untracked source changes are expected. All source changes remain inside the previously approved 59-path inventory. craft-week.test.ts is byte-equivalent to base after Git newline normalization.

No push, PR or merge. No docs file on the product branch. Worktree reused and retained with the pending A2 work. No environment removed; storage reclaimed 0 bytes. Playwright traces were not produced.

Owner action: approve E51–E53 exactly as written, or provide another decision. Until an answer, do not edit the pins, commit A2, regenerate the golden, or start A3.
