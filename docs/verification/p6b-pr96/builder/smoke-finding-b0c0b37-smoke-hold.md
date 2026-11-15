# Smoke HOLD — report parser assumes unique item names

HEAD: `b0c0b37cb25601b69f03b8844ac8a3f957304d4d`; tree: `5f9d377ec748ea62e56634b6e34dbd42d71ef868`. Full CI=1 smoke: 348 passed / 22 failed, exit 1. Isolated runs: 22, 22 failed.

Primary source: tests/e2e/character-life-navigation.helpers.ts:237–241. The existing helper filters by item.name and requires exactly one definition.

```ts
  function definition(name: string): string {
    const matches = Object.entries(ITEM_CATALOG).filter(([, item]) => item.name === name);
    expect(matches).toHaveLength(1);
    return matches[0][0];
  }
```

The approved catalog completes both Player/NPC ladders with shared display names. The full-smoke failures below resolve two matching definitions where this helper expects one. P1–P58 did not include this helper; P59 authorises only the lord-health timeout. No additional edit has been applied.

| Case | Test | Matching definition ids | Isolated outcome |
|---:|---|---|---|
| 1 | tests/e2e/character-life-boundary.spec.ts: same-session UI projection through assignment and full week | `rare-ring`, `rare-ring-player` | run 1: exit 1, 90.38 s |
| 2 | tests/e2e/character-life-navigation.spec.ts: all Life calendar surfaces cross year boundaries | `common-top`, `common-top-npc` | run 1: exit 1, 17.84 s |
| 3 | tests/e2e/crime.spec.ts: raid report and resulting state match the crafted save | `rare-earrings`, `rare-earrings-player` | run 1: exit 1, 13.70 s |
| 4 | tests/e2e/crime.spec.ts: wound report and resulting state match the crafted save | `common-hand`, `common-hand-npc` | run 1: exit 1, 13.13 s |
| 5 | tests/e2e/garrison.spec.ts: crafted raid reports garrison deaths with complete Order parity | `rare-earrings`, `rare-earrings-player` | run 1: exit 1, 11.21 s |
| 6 | tests/e2e/goods-stock.spec.ts: Society five-week report and navigation parity at 1280px | `common-top`, `common-top-npc` | run 1: exit 1, 22.30 s |
| 7 | tests/e2e/goods-stock.spec.ts: Society five-week report and navigation parity at 375px | `common-top`, `common-top-npc` | run 1: exit 1, 23.76 s |
| 8 | tests/e2e/items.spec.ts: C2 UI buy, keyboard equip and next Farm report show the post effect | `rare-earrings`, `rare-earrings-player` | run 1: exit 1, 13.00 s |
| 9 | tests/e2e/items.spec.ts: C2 visible item letters include stack loss, storage-full loss, expiry, delivered and waiting Legendary rewards | `common-hand`, `common-hand-npc` | run 1: exit 1, 13.83 s |
| 10 | tests/e2e/ledger.spec.ts: B3 crime-raid letters preserve rows, Details and complete report parity | `rare-earrings`, `rare-earrings-player` | run 1: exit 1, 16.92 s |
| 11 | tests/e2e/ledger.spec.ts: B3 crime-wound letters preserve rows, Details and complete report parity | `common-hand`, `common-hand-npc` | run 1: exit 1, 16.08 s |
| 12 | tests/e2e/tile-local-checkpoint.spec.ts: population local checkpoint restores grown cohorts and next-week parity at 390px | `rare-ring`, `rare-ring-player` | run 1: exit 1, 17.60 s |
| 13 | tests/e2e/tile-local-checkpoint.spec.ts: population local checkpoint restores grown cohorts and next-week parity at 1280px | `rare-ring`, `rare-ring-player` | run 1: exit 1, 20.18 s |
| 14 | tests/e2e/tile-local-checkpoint.spec.ts: saves a multiweek plan locally, continues after reload and resumes the same economics | `rare-ring`, `rare-ring-player` | run 1: exit 1, 23.02 s |
| 15 | tests/e2e/tile-population.spec.ts: society population grows once, preserves workforce and roundtrips at 1280px | `rare-ring`, `rare-ring-player` | run 1: exit 1, 22.47 s |
| 16 | tests/e2e/tile-population.spec.ts: society population grows once, preserves workforce and roundtrips at 390px | `rare-ring`, `rare-ring-player` | run 1: exit 1, 24.63 s |
| 17 | tests/e2e/tile-save.spec.ts: exports a real file, restores a multiweek plan and resumes the same economics | `rare-ring`, `rare-ring-player` | run 1: exit 1, 21.81 s |
| 18 | tests/e2e/tile-trial.spec.ts: builds production and inside Market, serves Goods once, then upgrades and replaces | `rare-ring`, `rare-ring-player` | run 1: exit 1, 24.73 s |
| 19 | tests/e2e/tile-trial.spec.ts: double-click Plan next week preserves the new plan at 390px | `rare-ring`, `rare-ring-player` | run 1: exit 1, 18.18 s |
| 20 | tests/e2e/tile-trial.spec.ts: double-click Plan next week preserves the new plan at 1280px | `rare-ring`, `rare-ring-player` | run 1: exit 1, 17.94 s |
| 21 | tests/e2e/tile-trial.spec.ts: repeated keyboard activation cannot turn planning into another End Week | `rare-ring`, `rare-ring-player` | run 1: exit 1, 16.92 s |
| 22 | tests/e2e/world-session.spec.ts: U9: local and portable saves restore the whole populated session and uninterrupted next week | `rare-ring`, `rare-ring-player` | run 1: exit 1, 19.48 s |

Commands, HEAD/tree, UTC, CI=1, complete output and exit codes are retained in each smoke-case-XX-alone-N.txt log. Full artifacts were copied before reruns; every isolated run has its own artifact folder. See smoke-isolated-results.json for links and hashes.

HOLD follows the original PR A brief: "If the smoke fails, rerun that test alone once, report both runs, and HOLD." Any timeout case is instead measured three times as instructed in the owner’s latest message. No timeout was changed beyond approved P59.

Next owner action: review the parser assumption and decide whether to authorise a separate exact test-helper edit.
