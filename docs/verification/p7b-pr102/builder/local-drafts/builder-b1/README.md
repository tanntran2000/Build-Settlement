# B1 Builder · HOLD before RED

**Correct the approved packet before B1.1.** Correction 1 authorizes the existing-file byte inventory plus the Hall cap and exact-matcher changes. Two defects require additional edits. Tân’s decision in Correction 1 remains “Duyệt, Hall tối đa 2”.

| Verified condition | Result |
| --- | --- |
| Approval | The Correction 1 plan and all three referenced SHA-256 values matched |
| Branch | `feat/p7b-map-estates` created after `git fetch origin` confirmed the pinned base |
| HEAD and `origin/main` | `27f4dc2e0ea6ed4f12e79fab6366d11fb555551b` |
| HEAD tree | `a0ea6329441e75df363b356052528f1426233281` |
| Status | Empty `git status --porcelain=v1` |
| Prior branch | `feat/p7a-npc-sheet` remains at `952985c4fafaffeee44a4eb8932c178858659a40` |
| Ports | No listener on 4173 or 4174 at branch creation and the final check |

## Required corrections

1. **Import the existing keyboard helper.** In `tests/e2e/society.spec.ts:7`, add `keyActivate` to the import from `./character-life-navigation.helpers.ts`. The helper is exported there at line 42. The approved new case calls it three times. A strict TypeScript probe of the approved overlays, with the exact inventory matcher correction, produced TS2304 at prospective lines 63, 70 and 73. The probe reported zero diagnostics for the core, simulation and persistence project configurations. The missing import is outside the approved existing-file changes.
2. **Apply the fixed Hall price to purchasing a Hall.** The approved `packages/simulation/src/tile-trial.ts:157–162` change skips the generic Builders’ Yard discount only when `c.type === 'UPGRADE'`. With the approved code evaluated in memory, the first housing Hall built beside an operating L1 Yard charged **13,500 Gold milli**, leaving 31,500 from 45,000. Correction 1 sets an undiscounted **15,000 Gold milli** build price. The REPLACE route reaches the same discount expression. Extend the existing bed-bearing building pricing guard across BUILD, REPLACE and UPGRADE, with a RED case for the operating-Yard price.

Proposed exact import line:

```typescript
import {openReportDetails,makeLife,importLife,exportLife,go,selectPerson,selectArea,characterWindow,keyActivate} from './character-life-navigation.helpers.ts';
```

For the price, replace the approved `homeUpgrade` declaration with `const homeConstruction = npcBeds(typeId, level) > 0;`, and use `homeConstruction` in the approved discount, cost multiplier and Stone checks. The Hall cap and exact-matcher additions remain the two authorized Correction 1 changes. Include the two new hunks in the next binding correction if approved.

## Evidence status

| Deliverable | Status |
| --- | --- |
| Commit | Pending. HEAD is the pinned base |
| RED and GREEN | Pending. The in-memory diagnostics were preflight probes |
| Edit inventory verifier | Input packets pinned and 157 baseline hunks matched. Final change verification is pending |
| Golden path diff and v11 fixture regeneration | Pending |
| Gates 1–7, CI=1 smoke, bundle, screenshots | Pending |

[Pre-RED probes](pre-RED-probes.json) records the results at `2026-11-19T10:43:43+00:00`. A fresh explicit owner correction is required to release the HOLD.
