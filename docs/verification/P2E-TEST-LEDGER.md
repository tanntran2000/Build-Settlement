# P2-E Test Ledger

Base: c90104a. Engine checkpoint: 46764de31add311e711b3eaef69b078465d6d23f. All source changes are compared to the merged P2-D baseline.

Parameterized entries use the declared title template; each template covers all of its original cases. Expanded counts come from actual Vitest runs, not a count of these lines.

## Counts and evidence

| Checkpoint | Unit tests | Exit |
|---|---:|---:|
| Before Task 1 | 1449 (derived: 1451 minus two new pins) | baseline not separately rerun |
| Task 1 470cd9e | 1451 | 0 |
| Task 2 66060e3 | 1187 | 0 |
| Task 3 27171d4 | 1119 | 0 |
| Task 4 ab1b1b5 | 1066 | 0 |
| Task 5 3e3474b | 1058 | 0 |
| Task 6 46764de | 1006 | 0 |

Seven unit cases were added (two pins, four refusal cases, one determinism case); 450 cases of removed code/behaviour were removed, giving a net reduction of 443 from 1449. Ports retain assertions that apply to society. No society fixture was rewritten.

## Per-test ledger

- packages/core/src/__tests__/weekly.test.ts ? starts only one root clock, with settlement-owned stocks/cohorts and metadata ? ported: setup old → society
- packages/core/src/__tests__/weekly.test.ts ? new worlds share no mutable stocks/cohorts/metadata ? ported: setup old → society
- packages/core/src/domain/__tests__/canonical-state.test.ts ? accepts a canonical world without introducing an R1 date or root stocks ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/core/src/domain/__tests__/domain.test.ts ? creates valid settlement and deep clones inventory ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? deep-clones named characters and cohorts for complete settlement object isolation (R1-F02) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects invalid or negative initial inventory ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts valid state with 0 active settlements (activeSettlementId === null) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts valid state with 1 active settlement pointing to correct ID ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects when 0 active settlements exist but activeSettlementId is non-null ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects when 1 active settlement exists but activeSettlementId is null ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects when activeSettlementId points to a non-active settlement ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects when multiple active settlements exist ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects when dictionary key does not match settlement ID ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects when settlement has negative inventory ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state with negative cohort count (R1-F01) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state with non-integer or Infinity cohort count (R1-F01) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects non-integer clock day or mathematically inconsistent week/year (R1-F01) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state containing character with health outside [0, 100] (R1-F01) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state with missing or malformed currentDate object (R1-F01 structural) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state when inventory is missing required keys like food or tools (R1-F01 structural) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state when named character is missing needs object or needs is empty {} (R1-F01 structural) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state containing duplicate NamedCharacter IDs within a settlement or across settlements (LAW-04) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts state when multiple NamedCharacters have distinct IDs ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state with missing or non-finite worldSeed ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state with missing or non-string gameVersion ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts valid worldMetadata variations: seed 0, negative, fractional, and empty gameVersion ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects authority outside [0, 100] or non-finite ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects reputation outside [0, 100] or non-finite ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts authority and reputation within [0, 100] including boundary and decimals ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects invalid settlement status ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts canonical settlement statuses with proper pointer ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects non-array or malformed facilities ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts valid facilities including template shelter and optional manager ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely handles unconvertible objects ({ toString: null, valueOf: null }) without throwing TypeError (R1-VALIDATION-CORRECTION-01) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? validates individual facility string fields (id, name, type) missing or wrong type ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? validates individual facility numeric fields (level, capacity, assignedWorkerCount) missing or non-finite ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? validates all 5 facility stages and assignedManagerId variations ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state when cohort has missing, null, number, or object socialClass ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects state when cohort has invalid string socialClass such as middle or servile ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts state with all five valid socialClass values including enslaved cohorts ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible currentDate.day without throwing, returning INVALID_CLOCK ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible currentDate.week without throwing, returning INVALID_CLOCK ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible currentDate.year without throwing, returning INVALID_CLOCK ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible inventory.food without throwing, returning NEGATIVE_INVENTORY ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible inventory.tools without throwing, returning NEGATIVE_INVENTORY ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible cohorts[0].count without throwing, returning INVALID_POPULATION ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible cohorts[0].averageHealth without throwing, returning INVALID_POPULATION ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible namedCharacters[0].age without throwing, returning INVALID_CHARACTER ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible namedCharacters[0].health without throwing, returning INVALID_CHARACTER ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible namedCharacters[0].needs.nutrition without throwing, returning INVALID_CHARACTER ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible namedCharacters[0].emotions.joy without throwing, returning INVALID_CHARACTER ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible namedCharacters[0].skills.management without throwing, returning INVALID_CHARACTER ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible namedCharacters[0].relationshipToPlayer.trust without throwing, returning INVALID_CHARACTER ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? safely rejects unconvertible settlement.id without throwing, returning KEY_ID_MISMATCH ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? positive control: accepts uncorrupted base state with valid = true ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? advances simulation time across weeks properly ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? advances simulation time across years properly (Day 365 -> Day 366) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects unsafe currentDate.day = 2^53 with INVALID_CLOCK ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects unsafe currentDate.week = 2^53 with INVALID_CLOCK ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects unsafe currentDate.year = 2^53 with INVALID_CLOCK ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts valid MAX_SAFE_INTEGER day with consistent week and year ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects stock = 2^54 on required resource with NEGATIVE_INVENTORY ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects stock = 2^54 on extension keys with NEGATIVE_INVENTORY ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts stock = MAX_SAFE_INTEGER on inventory ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects unsafe cohort count = 2^53 with INVALID_POPULATION ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects multiple cohorts whose sum overflows MAX_SAFE_INTEGER with INVALID_POPULATION ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? rejects when sum of cohorts is MAX_SAFE_INTEGER and adding NPC overflows with INVALID_POPULATION ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts total population exactly MAX_SAFE_INTEGER (cohort count = MAX_SAFE_INTEGER - 1, 1 NPC) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? accepts total population exactly MAX_SAFE_INTEGER (cohort count = MAX_SAFE_INTEGER, 0 NPCs) ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? compatibility regression: accepts npc.age outside safe integer range (2^53) as long as it satisfies Number.isInteger ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? still rejects non-integer or negative npc.age with INVALID_CHARACTER ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? throws RangeError when input day is not a safe positive integer ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? advances from MAX_SAFE_INTEGER - 1 to MAX_SAFE_INTEGER successfully ? deleted (removed code/behaviour)
- packages/core/src/domain/__tests__/domain.test.ts ? throws RangeError when day = MAX_SAFE_INTEGER because nextDay would exceed MAX_SAFE_INTEGER ? deleted (removed code/behaviour)
- packages/core/src/resource/__tests__/allocation.test.ts ? floors stock at zero and records exact deficit ? deleted (removed code/behaviour)
- packages/core/src/resource/__tests__/allocation.test.ts ? preserves exact surplus when availability exceeds demand ? deleted (removed code/behaviour)
- packages/core/src/resource/__tests__/allocation.test.ts ? resolves stock flow with conservation ? deleted (removed code/behaviour)
- packages/core/src/resource/__tests__/allocation.test.ts ? accepts zero values ? deleted (removed code/behaviour)
- packages/core/src/resource/__tests__/allocation.test.ts ? rejects intermediate stock overflow before a later debit of %i can hide it ? deleted (removed code/behaviour)
- packages/core/src/resource/__tests__/allocation.test.ts ? conserves exact integer flow against a BigInt oracle: %i + %i - %i ? deleted (removed code/behaviour)
- packages/core/src/resource/__tests__/allocation.test.ts ? does not mutate allocation inputs at the safe-integer boundary ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? returns 0 when allocated is 0 of demand 1000 ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? returns 0.25 when allocated is 250 of demand 1000 ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? returns 1 when allocated equals demand (1000 / 1000) ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? returns 1 when allocated exceeds demand (1500 / 1000 capped at 1) ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? returns 1 when demand is 0 and allocated is 0 ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? returns 1 when demand is 0 and allocated is 7 (positive allocated) ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? throws RangeError when demand is 0 and allocated is NaN ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? throws RangeError when demand is 0 and allocated is negative (-1) ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? treats demand of -0 identically to 0 (returns 1) ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? validates allocated before demand branch even when demand is -0 ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? accepts allocated of -0 without error and yields arithmetic zero ratio without sign assertion ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? works with real allocateResource result when demand is -0 ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? preserves exact ratio for (3, 1) near 1/3 without quantizing to 0.333 ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? returns 1 when both demand and allocated are Number.MAX_SAFE_INTEGER ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? throws RangeError when demand exceeds MAX_SAFE_INTEGER ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? throws RangeError when allocated exceeds MAX_SAFE_INTEGER ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? rejects non-object, null, or array inputs with RangeError ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? rejects missing fields with RangeError ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? rejects non-number field types with RangeError ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? rejects negative numbers with RangeError ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? rejects non-integer fractions with RangeError ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? rejects NaN and Infinities with RangeError ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? accepts frozen input objects without mutating them ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? returns identical results on repeated calls (pure & deterministic) ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? preserves ratio when multiplying both quantities by 1000 within safe range ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? accepts full ResourceAllocationResult with extra properties ? deleted (removed code/behaviour)
- packages/core/src/social/__tests__/satisfaction.test.ts ? integrates directly with unmocked allocateResource result ? deleted (removed code/behaviour)
- packages/core/src/trial/__tests__/goods-stock.test.ts ? exports the explicit ruleset and a new city factory ? deleted (removed code/behaviour)
- packages/core/src/trial/__tests__/goods-stock.test.ts ? starts with 20 Food, 10 Goods, 45 Gold and an ordinary Market ? ported: setup old → society
- packages/core/src/trial/__tests__/goods-stock.test.ts ? accepts exactly the new marker while keeping old states unchanged ? ported: setup old → society
- packages/core/src/trial/__tests__/goods-stock.test.ts ? resolves families only after strict validation, and preserves seeded outside/NPC/player data ? ported: setup old → society
- packages/core/src/trial/__tests__/goods-stock.test.ts ? rejects marker accessors, non-enumerable fields and extra keys without invoking code ? ported: setup old → society
- packages/core/src/trial/__tests__/society-map.test.ts ? preserves Market manager posts in both economies and adds Town Hall ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/core/src/trial/__tests__/society.test.ts ? creates the spec section 3 new game ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/core/src/trial/__tests__/society.test.ts ? rejects the whole city in both validators and economy detection ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/core/src/trial/__tests__/society.test.ts ? creates a society world session ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/core/src/trial/__tests__/society.test.ts ? accepts live society Character Life sessions and rejects society without Goods ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/core/src/world/__tests__/npc.test.ts ? has exactly 3 frozen, valid, unassigned female starters with known traits ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/core/src/world/__tests__/npc.test.ts ? maps manager posts to the six existing building types ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/core/src/world/__tests__/npc.test.ts ? lists only built tiles of mapped types, including paused ones ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/core/src/world/__tests__/session.test.ts ? matches all 90 scenario tiles for seed %s ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/persistence/src/__tests__/character-life-save.test.ts ? round-trips a valid session as detached data in its own format ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/persistence/src/__tests__/character-life-save.test.ts ? rejects NPC-world, world and tile save texts with INCOMPATIBLE_SAVE ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/persistence/src/__tests__/character-life-save.test.ts ? keeps life saves out of the NPC-world format both ways ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/persistence/src/__tests__/goods-stock-save.test.ts ? round-trips the BASE bytes and exactly continues the BASE command/report ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/goods-stock-save.test.ts ? accepts matching Goods only in the population family; rejects mismatched and malformed markers ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/goods-v1-fixtures.test.ts ? round-trips the BASE bytes and exactly continues the BASE command/report ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/schema.test.ts ? preserves the six R1 save type contracts ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/society-new-game-fixture.test.ts ? pins the society new-game tile save bytes ? added (society contract)
- packages/persistence/src/__tests__/society-new-game-fixture.test.ts ? pins the society new-game Character Life save bytes ? added (society contract)
- packages/persistence/src/__tests__/society-only-save.test.ts ? refuses $generation $kind without throwing ? added (society contract)
- packages/persistence/src/__tests__/society-save.test.ts ? round-trips with its own marker and refuses mismatched markers and malformed extensions ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/persistence/src/__tests__/society-save.test.ts ? refuses society in the classic tile family ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/society-v1-fixture.test.ts ? pins five society weeks and conserves cohort counts ? changed: call shape only
- packages/persistence/src/__tests__/tile-population-save.test.ts ? pins each mode to its own ruleset without migrating or changing state shape ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/tile-trial-save.test.ts ? roundtrips a detached complete planning snapshot without mutation ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/tile-trial-save.test.ts ? rejects incompatible or invalid payload %# ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/tile-trial-save.test.ts ? rejects malformed/R1/oversized UTF8 before accepting a save ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/world-npc-session-save.test.ts ? round trips assigned npcs as detached data in its own format ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/world-npc-session-save.test.ts ? loads resolved and hand-edited names verbatim, never regenerating them ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/world-npc-session-save.test.ts ? keeps world v1 and npc formats mutually incompatible, inserting nothing ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/world-npc-session-save.test.ts ? maps %s to %s ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/world-npc-session-save.test.ts ? rejects non-text, malformed and oversized input ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/world-npc-session-save.test.ts ? rejects %s on encode without running getters ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/world-npc-session-save.test.ts ? validates captured npc data without original get traps ? deleted (removed code/behaviour)
- packages/persistence/src/__tests__/world-session-save.test.ts ? honors decode precedence when several faults coincide ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/persistence/src/__tests__/world-session-save.test.ts ? keeps %s and world formats mutually incompatible ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/character-life-command.test.ts ? pins gameplay rejection codes on valid affordable or isolated fixtures ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/character-life-command.test.ts ? live Report never becomes a save ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/character-life-observation.test.ts ? projects every tile, offered building field, exact units and initial free labels ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/character-life-observation.test.ts ? ASSIGN removes the occupied slot; REPLACE clears the post and restores its new label ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/character-life-observation.test.ts ? keeps the real END_WEEK report after NEXT_WEEK and preserves frozen report inputs ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects when input GameState violates active settlement invariant (INVALID_STATE) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY and prevents negative consumption when cohort count is negative (-50) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY when population count is a float or invalid ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY when clock is float or desynced ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY when named character health is out of bounds (> 100) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY when cohort socialClass is missing, null, number, object, or invalid string (R1-COHORT-SOCIALCLASS-GUARD-01) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY when state is null or non-object without uncaught exception ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY when currentDate is missing without TypeError escaping ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY before calculation when inventory.food is missing ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY when inventory.tools is missing ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY when named character needs is missing or empty object {} ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects ADVANCE_DAY with INVALID_STATE when GameState contains duplicate NPC IDs and leaves input/clock/inventory untouched ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? allows ADVANCE_DAY when multiple NPCs have distinct IDs and consumes resources properly ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects invalid worldMetadata before command/handler execution without mutating input ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects invalid authority and reputation before command/handler execution without mutating input ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects invalid settlement status before command/handler execution without mutating input ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects invalid facilities before command/handler execution without mutating input ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? safely rejects unconvertible objects ({ toString: null, valueOf: null }) with INVALID_STATE without throwing (R1-VALIDATION-CORRECTION-01) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? demonstrates state gate precedence: rejects all 4 invalid state groups with INVALID_STATE before command syntax check or legacy authority gate ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects invalid command payloads (null, undefined, primitives) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects unrecognized command types with INVALID_COMMAND, not NOT_IMPLEMENTED ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects commands with missing or malformed required payload fields ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns COMMAND_NOT_YET_IMPLEMENTED when a valid management command is sent to the active settlement ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns FORBIDDEN when the exact same command is sent to a legacy settlement ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns FORBIDDEN when command targets a non-existent settlement ID ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? executes ADVANCE_DAY: Day 7 -> Day 8, report day is 7, consumes resources properly ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? handles severe resource shortage: Demand=23, Stock=8 -> Allocated=8, Deficit=15, Stock=0 (Never negative) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? executes ADVANCE_DAY when world has 0 active settlements ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? guarantees immutability and atomicity: input state is never modified on success ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns INVARIANT_VIOLATION and preserves state when draft violates invariants post-execution (R1-F04) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? catches handler exceptions cleanly into EXECUTION_ERROR without leaking or modifying state (R1-F04) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? catches structuredClone failure when state contains a function field and returns EXECUTION_ERROR without throwing or mutating state ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns INVARIANT_VIOLATION and preserves state when draft violates worldMetadata invariants ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns INVARIANT_VIOLATION, preserves state, and does not leak effects/audit when draft violates authority invariant ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns INVARIANT_VIOLATION, preserves state, and does not leak effects/audit when draft violates reputation invariant ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns INVARIANT_VIOLATION and preserves state when draft violates settlement status invariant ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns INVARIANT_VIOLATION and preserves state when draft violates facilities invariants ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? returns INVARIANT_VIOLATION, preserves state, and does not leak effects/audit when draft violates cohort socialClass invariant (R1-COHORT-SOCIALCLASS-GUARD-01) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? executes successfully when cohorts have valid socialClass values including enslaved status (R1-COHORT-SOCIALCLASS-GUARD-01) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? pre-gate demonstrates state gate runs before command syntax or authority check for unconvertible paths ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? positive control: executes ADVANCE_DAY normally when all 14 paths are valid ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? guarantees 3-day replay determinism across identical initial state clones ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? handles year rollover deterministically: day 365/week 53/year 1 -> day 366/week 53/year 2 ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? handles 0 population (0 cohorts, 0 named NPCs): 0 consumption, 0 deficit, clock advances ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? handles stock (0, 0): allocated (0, 0), deficit (23, 23), closing stock (0, 0) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? handles stock (23, 23): allocated (23, 23), deficit (0, 0), closing stock (0, 0) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? handles stock (8, 100): food allocated 8 (deficit 15, closing 0), water allocated 23 (deficit 0, closing 77) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? handles stock (100, 5): food allocated 23 (deficit 0, closing 77), water allocated 5 (deficit 18, closing 0) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? throws RangeError when day is unsafe (2^53) or invalid ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? throws RangeError when stock is unsafe (food = 2^54) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? throws RangeError when cohort count is unsafe (2^53) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? throws RangeError when multiple cohorts overflow MAX_SAFE_INTEGER ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? throws RangeError when sum of cohorts is MAX_SAFE_INTEGER and adding NPC overflows ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? calculates exact demand for MAX_SAFE_INTEGER population without throwing ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects state with day = 2^53 with INVALID_STATE, preserves state, handler not called ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects state with inventory.food = 2^54 with INVALID_STATE, preserves state, handler not called ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects state with extension key iron = 2^54 with INVALID_STATE, preserves state, handler not called ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects state with cohort count = 2^53 with INVALID_STATE, preserves state, handler not called ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects state with cohorts overflowing MAX_SAFE_INTEGER with INVALID_STATE, preserves state, handler not called ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? rejects state with cohorts + NPC overflowing MAX_SAFE_INTEGER with INVALID_STATE, preserves state, handler not called ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? advances from MAX - 1 to MAX, then fails atomically on next advance (with active settlement) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? advances from MAX - 1 to MAX, then fails atomically on next advance (WITHOUT active settlement) ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? decrements stock MAX by exactly 1 without float precision loss ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? post-gate catches draft with day = 2^53 and returns INVARIANT_VIOLATION ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? post-gate catches draft with inventory.food = 2^54 and returns INVARIANT_VIOLATION ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? post-gate catches draft with cohort count = 2^53 and returns INVARIANT_VIOLATION ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/dispatcher.test.ts ? post-gate catches draft with total population overflowing MAX_SAFE_INTEGER and returns INVARIANT_VIOLATION ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/goods-stock.test.ts ? proves five default weeks, fixed population, normal upkeep, no hidden grants ? ported: setup old → society
- packages/simulation/src/__tests__/goods-stock.test.ts ? proves five stock-only weeks without relying on production or income; week six is short ? ported: setup old → society
- packages/simulation/src/__tests__/goods-stock.test.ts ? produces and carries stock without a %s Market; no production revenue ? ported: setup old → society
- packages/simulation/src/__tests__/goods-stock.test.ts ? distributes stock %i at population %i with %s limit ? ported: setup old → society
- packages/simulation/src/__tests__/goods-stock.test.ts ? keeps production independent of demand and Market capacity, bounded by Wood/funded whole workers ? ported: setup old → society
- packages/simulation/src/__tests__/goods-stock.test.ts ? retains the no-production/no-revenue convention for zero demand ? ported: setup old → society
- packages/simulation/src/__tests__/goods-stock.test.ts ? rejects stock overflow atomically, plus incompatible family/LOAD markers ? ported: setup old → society
- packages/simulation/src/__tests__/goods-stock.test.ts ? does not grant stored stock any sustainable target or useful-work bonus ? ported: setup old → society
- packages/simulation/src/__tests__/goods-stock.test.ts ? projects optional stock flow without altering old observations or assigning manager buffs ? ported: setup old → society
- packages/simulation/src/__tests__/society-end-week.test.ts ? resolves society needs, housing and happiness deterministically ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/society-end-week.test.ts ? imports Luxury only with the full 3000 Gold milli after upkeep ($gold) ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/society-end-week.test.ts ? credits the Counting House bonus after upkeep, leaving Slave Quarters unfunded ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/society-factory-determinism.test.ts ? creates society without an economy argument and remains deterministic through five weeks ? added (society contract)
- packages/simulation/src/__tests__/society-guard.test.ts ? advances society tile weeks and accepts only matching snapshot economies ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/society-life.test.ts ? routes society training through Character Life and preserves the input ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/society-life.test.ts ? routes society wall extension through Character Life ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/society-life.test.ts ? rejects invalid society Life training atomically ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/society-life.test.ts ? keeps Goods Life $type unsupported ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/society-life.test.ts ? adds society Planning actions while keeping the Goods list exact ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/society-life.test.ts ? routes NPC-world society $type ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/society-plots.test.ts ? keeps Goods placement ? deleted (removed code/behaviour)
- packages/simulation/src/__tests__/society-plots.test.ts ? restricts %s to society Planning and exact keys ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/tile-trial-immigration.test.ts ? makes the nominal2% low-population exception explicit with integer minimum1 ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-immigration.test.ts ? bounds the last integer arrival to the remaining gap ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-immigration.test.ts ? uses configurable provisional support and catchup coefficients ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-immigration.test.ts ? caps opportunities globally and excludes disabled or unpaid extraction ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-immigration.test.ts ? rejects invalid fact integers atomically: %s ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-immigration.test.ts ? rejects unsafe aggregate population and invalid configuration ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-needs.test.ts ? $name ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-needs.test.ts ? retains milli-unit precision at the last safe population-demand boundary ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-needs.test.ts ? rejects overflowing Food demand using the existing safe-integer arithmetic boundary ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-needs.test.ts ? is deterministic and leaves caller-owned values unchanged ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? settles the old population then admits arrivals without changing assignments ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? keeps legacy default and explicit policy identical with no population report ? deleted (removed behaviour): Removed default/explicit economy-policy dispatch and legacy report contrast; society always reports immigration.
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? starter and stock liquidation do not create immigration ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? duplicate idle Processor cannot reuse the same Wheat capacity ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? one funded Farm shares its five supply slots across two funded Processors ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? two funded Farms retain independent recipe caps with $processors funded Processor(s) ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? duplicate idle Workshop cannot reuse Market service capacity ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? never revives zero city, fills unsupported cohorts or adds departures ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? does not admit during shortage, unpaid upkeep or a liquidity failure ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? rejects stale/repeated commands and overflow atomically ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? reaches136 after27 arrivals and remains solvent through60 weeks with checkpoint parity ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? stops and resumes immigration over45 weeks when renewable support changes ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? does not mistake30 weeks of stored Wheat liquidation for renewable Food ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-population.test.ts ? rejects an unknown mode policy without changing gameplay ? deleted (removed behaviour): Removed economy-policy argument and INVALID_RULESET branch; no compatibility signature.
- packages/simulation/src/__tests__/tile-trial-save.test.ts ? restores multiweek buildings and resumes identical gameplay with a fresh revision ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-save.test.ts ? rebases above saved revision too, then rejects a repeated load ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial-save.test.ts ? rejects report states, malformed snapshots, changed layouts and revision overflow atomically ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? starts a separate valid RAM world with the five physical stocks and equipped Food chain ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? rejects invalid terrain, occupied tiles, unknown types, funds and materials atomically ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/tile-trial.test.ts ? upgrades capacity and replaces at full cost without refund, preserving placement rules ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? reserves one shared whole-WF pool and pausing releases workers ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? extracts before processing, services Goods exactly once and credits Farm batch upkeep ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? Market upgrades do not change demand or double multiply revenue ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? zero population uses no Goods materials and mints no tax/revenue or Happiness ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? reports unfunded buildings without negative stocks and can recover by pausing ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? rolls back overflow and rejects malformed state, stale revisions and getter commands ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/tile-trial.test.ts ? charges no Goods inputs without Market capacity or a complete input batch ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? caps partial service to population demand and never carries Goods stock ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? preserves approved Food shortage and recovery behavior without Goods service ? ported: setup old → society
- packages/simulation/src/__tests__/tile-trial.test.ts ? rejects unsafe clock/revision and repeated building commands without charging twice ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/tile-trial.test.ts ? sustains a 50-week baseline without negative resources, duplicate food or free Goods stock ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? harvests then processes with 4+4 WF: Gold 10→6, Wheat 0→8→0, Food 4→12 with a complete immutable ledger ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? runs only complete batches with Gold 2, leaving 4 reserved idle and 2 unassigned WF ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? Gold %i, assignment %i → Gold %i, Food %i ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? is pure on frozen inputs and deterministic on replay of old state ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? keeps a continuous ledger over multiple weeks without extra income or consumption ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? rejects invalid command %j without state mutation or report ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? rejects stale/future/invalid expectedWeek %j ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? rejects replay against the next state ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? rejects invalid state %j ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? rolls back Gold too when Food/week overflows %j ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? allows the exact safe Food boundary and preserves Wood/Iron ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? rejects END_WEEK with no active settlement, including a world with only legacy settlements ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? touches only the active inventory/root week, preserving every other field and settlement ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? follows the actual active pointer rather than a fixed fixture ID ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? uses real cohort count/class/legal status: %i %s/%s ? deleted (removed behaviour): Removed weekly command workforce fields and old class/legal workforce policy; society workforce is class-specific and validated by the retained society workforce suites.
- packages/simulation/src/__tests__/weekly.test.ts ? accepts zero workforce with zero cohorts, rejects positive assignment ? deleted (removed behaviour): Removed weekly reservation command fields; zero society population is ported in society-renewable-support and society-stock-policy-ports; tile assignment class limits remain in society tests.
- packages/simulation/src/__tests__/weekly.test.ts ? returns atomic OVERFLOW for true social result overflow count %i ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? preserves report snapshots after later state mutations ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? runs the same 4+4 WF chain with large safe canonical population %i ? deleted (removed behaviour): Removed canonical weekly command and shared workforce formula; society arithmetic boundaries and transaction overflow are ported, not the obsolete large-population workforce policy.
- packages/simulation/src/__tests__/weekly.test.ts ? returns structured failure for an otherwise-valid root Proxy that cannot be cloned ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? contains unexpected command errors without coercing thrown objects ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? uses one command snapshot so changing Proxy values cannot bypass processor availability ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? preserves the INVALID_STATE boundary for revoked Proxy input ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? G%i W%i reservations %i+%i preserve complete inputs and the shared pool ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? rejects shared 8 WF reservation against 6 WF before either activity runs ? deleted (removed behaviour): Removed shared workforce reservation command and single shared pool; society uses separate class pools.
- packages/simulation/src/__tests__/weekly.test.ts ? requires the processor for any processing reservation, but permits harvest-only without it ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? rejects intermediate Wheat overflow even when processing would restore the closing stock ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? permits the exact intermediate Wheat limit without double consumption ? ported: setup old → society
- packages/simulation/src/__tests__/weekly.test.ts ? rolls back the whole transaction when candidate validation fails ? ported: setup old → society
- packages/simulation/src/__tests__/world-npc.test.ts ? UNKNOWN_NPC, STALE_COMMAND, FORBIDDEN in Report, INVALID_COMMAND, INVALID_STATE ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/world-npc.test.ts ? REPLACE clears that post in the same result and the slot can be reassigned ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/simulation/src/__tests__/world-npc.test.ts ? a failed city command leaves the session untouched ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/ui/src/__tests__/character-life-session.test.ts ? loads either city generation into a detached complete Life session without conversion or grants ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/ui/src/__tests__/character-life-session.test.ts ? rejects an NPC-world checkpoint in the life slot and leaves every byte untouched ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/ui/src/__tests__/character-life-session.test.ts ? accepts society and refuses pinned Goods and legacy Life fixtures ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/ui/src/__tests__/character-life-session.test.ts ? saving a %s Life fixture never touches any slot ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present
- packages/ui/src/__tests__/world-session.test.ts ? T-4: keeps preparing a valid decoded checkpoint at the byte cap even when canonical encoding expands ? ported: setup old ? society; kept applicable assertions; removed old-generation contrasts where present

## Mechanical edits and shared setup ports

- packages/ui/src/CharacterLifeApp.svelte ? removed economy/ruleset arguments and forced imports.
- packages/ui/src/__tests__/character-life-session.test.ts ? removed NPC codec import/call ? original foreign payload JSON literal (or unused import removed); removed economy/ruleset arguments and forced imports; ported: setup old ? society; retained rejection/isolation/atomicity assertions; old refusal inputs kept inline.
- packages/ui/src/__tests__/world-npc-session.test.ts ? removed NPC codec import/call ? original foreign payload JSON literal (or unused import removed); removed economy/ruleset arguments and forced imports; ported: setup old ? society; retained rejection/isolation/atomicity assertions; old refusal inputs kept inline.
- packages/ui/src/__tests__/world-session.test.ts ? removed economy/ruleset arguments and forced imports; ported: setup old ? society; retained rejection/isolation/atomicity assertions; old refusal inputs kept inline.
- packages/ui/src/world-session.ts ? removed economy/ruleset arguments and forced imports.
- tests/e2e/character-life-boundary.spec.ts ? removed economy/ruleset arguments and forced imports.
- tests/e2e/character-life-navigation-accessibility.spec.ts ? removed economy/ruleset arguments and forced imports.
- tests/e2e/character-life-navigation.helpers.ts ? removed economy argument and Parameters<?>[2] type helper; removed economy/ruleset arguments and forced imports.
- tests/e2e/character-life.spec.ts ? removed NPC codec import/call ? original foreign payload JSON literal (or unused import removed); removed economy/ruleset arguments and forced imports.
- tests/e2e/goods-stock.spec.ts ? removed economy/ruleset arguments and forced imports.
- tests/e2e/society.spec.ts ? removed fixture-file reads ? identical inline JSON bytes; removed economy/ruleset arguments and forced imports.
- tests/e2e/tile-population.spec.ts ? removed fixture-file reads ? identical inline JSON bytes.
- tests/e2e/world-npc-session.spec.ts ? removed NPC codec import/call ? original foreign payload JSON literal (or unused import removed); removed economy/ruleset arguments and forced imports.
- tests/e2e/world-session.spec.ts ? removed fixture-file reads ? identical inline JSON bytes; removed economy/ruleset arguments and forced imports.

## Fixture test call shapes

- packages/persistence/src/__tests__/society-new-game-fixture.test.ts ? both pins ? changed: call shape only; removed factory economy argument; deleted tile codec call becomes the archived envelope JSON encoding; every existing assertion and expected byte remains unchanged.
- packages/persistence/src/__tests__/society-v1-fixture.test.ts ? pins five society weeks and conserves cohort counts ? changed: call shape only.

## RED/GREEN and generation log

- Task 1: on 263b965 before production edits, temporary Vitest generator called the existing tile codec with POPULATION_TILE_RULESET and the Life codec with seed 20261028 / Synthetic Keeper / SOCIETY_RULESET. writeFileSync wrote serializer text with no appended newline. Generator passed (1 test), then was replaced by the permanent two-pin test. Persistence run: 117 tests passed; full suite: 1451.
- Task 3: npx vitest run packages/persistence/src/__tests__/society-only-save.test.ts exited 1 (4 failed: old payloads accepted), then 0 (4 passed: INCOMPATIBLE_SAVE, no throw). Literal payloads were copied from the original Goods/legacy Life/world fixtures before deletion.
- Task 5: npx vitest run packages/simulation/src/__tests__/society-factory-determinism.test.ts exited 1 (no-argument factory had no society), then the full suite exited 0 including its five paired END_WEEK/NEXT_WEEK cycles and both byte pins.
- Before deleting the NPC codec, a temporary Vitest generator captured its actual seed-1/seed-0 serialized output for e2e and UI foreign-payload cases. Generator exited 0; generated literals keep their old exact text.
- Intermediate failures and the authorized scope clarifications are recorded in the task conversation. Final eight-gate results are reported on the final immutable HEAD in the Builder handoff.

## Tests affected through shared setup/import changes

- packages/core/src/__tests__/weekly.test.ts ? derives %i %s/%s as %i milli-WF from actual cohorts ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/__tests__/weekly.test.ts ? combines real cohorts, handles empty population, and does not mutate frozen inputs ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/__tests__/weekly.test.ts ? accepts exact safe workforce for count %i ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/__tests__/weekly.test.ts ? accepts a large Upper cohort when its nonlabor metrics remain safe ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/__tests__/weekly.test.ts ? rejects true social result overflow for count %i ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects noncanonical root %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects parallel root field %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects invalid week %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects malformed metadata %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects malformed settlements %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? requires settlement field %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects settlement defect %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects malformed inventory %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects invalid processor availability %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? accepts absent operational processor but does not migrate the old four-stock state ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects invalid stock %j for all five resources ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects invalid/dangling active pointer %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? accepts zero active only when the pointer and statuses agree ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects multiple active settlements and key/id mismatch ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects malformed cohort array %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects malformed cohort %j ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? requires cohort field %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? allows the same cohort ID in a different settlement ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects duplicate cohort identities ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects inherited, symbolic, hidden and accessor data without invoking getters ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects invalid inactive settlement inventory and cohort data ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? rejects array extensions and indexed getters without reading them ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/canonical-state.test.ts ? accepts zero cohorts, empty idle world, safe stock/week boundaries and frozen input ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/domain.test.ts ? creates a valid NamedCharacter with 3 axes and 8D relationship ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/domain.test.ts ? rejects invalid inputs: empty id/name, negative age, invalid health, NaN ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/domain.test.ts ? ensures strict object isolation: mutating caller's argument objects does not mutate character ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/domain.test.ts ? deep-clones memory tags so mutating external memory tags does not affect character (R1-F02) ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/domain.test.ts ? creates a valid PopulationCohort with mandatory socialClass ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/domain.test.ts ? rejects invalid cohort count or metrics outside [0, 100] ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/domain.test.ts ? rejects missing, null, non-string, or invalid socialClass (R1-COHORT-SOCIALCLASS-GUARD-01) ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/domain/__tests__/domain.test.ts ? accepts all five valid socialClass values including enslaved cohorts (R1-COHORT-SOCIALCLASS-GUARD-01) ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/trial/__tests__/society-map.test.ts ? pins the society map and ring boundaries ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/trial/__tests__/society-map.test.ts ? pins all fourteen active town building names to the approved catalog ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/trial/__tests__/society-map.test.ts ? pins reserved staff metadata without enabling reserved buildings ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/trial/__tests__/society.test.ts ? rejects accessors and non-plain society objects without reading getters ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/trial/__tests__/society.test.ts ? rejects unsafe population sums ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? matches the independent F12 seed 123 oracle ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? matches the independent F12 seed zero oracle ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? handles zero/one eligible tile (%s) ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? accepts deep frozen data and detaches every output array ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? rejects invalid deposit budget %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? rejects invalid loot budget %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? rejects invalid seed %s after config validation ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? accepts seed boundary %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? rejects hostile descriptors/prototypes without invoking getters or throwing ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? keeps ambient seed sources and platform dependencies out of core world runtime ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? F2: generates from validated descriptors rather than active indexed array reads ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? F2: snapshots %s descriptors without virtual property reads ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/generate.test.ts ? F2: returns a detached config including tile records and knowledge arrays ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? creates a valid session whose npcs do not alias starter content ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? resolves three distinct English pool names from the seed, reproducibly ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? uses no ambient randomness and leaves the outside world of the seed unchanged ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? keeps identity, stats and traits independent of the resolved names ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? has a small original English name pool and no fixed provisional names ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? rejects a bad seed like the world session ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? rejects %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? accepts posts on distinct manager tiles and an empty list ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? rejects missing npcs, extra keys, an invalid world part, and accessor fields ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/npc.test.ts ? keeps the world v1 validator rejecting a session with npcs ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/session.test.ts ? accepts future action shapes without regenerating or pinning starting ownership ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/session.test.ts ? rejects %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/session.test.ts ? rejects JSON __proto__ at %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/session.test.ts ? classifies provenance without mistaking malformed values for unsupported ids ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/core/src/world/__tests__/session.test.ts ? never leaks hidden features or other actors knowledge through the player summary ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/character-life-save.test.ts ? rejects %s with %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/character-life-save.test.ts ? rejects a non-finite axis from JSON 1e999 ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/character-life-save.test.ts ? rejects report-phase session on export ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/character-life-save.test.ts ? rejects non-text, malformed and over 1 MiB input ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/character-life-save.test.ts ? rejects %s on encode without running getters ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/character-life-save.test.ts ? captures once, never reading through original get traps ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/character-life-save.test.ts ? gives identical results on repeated operations ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/society-save.test.ts ? refuses hostile society accessors without invoking them ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/world-session-save.test.ts ? round trips frozen later-action shapes as detached data ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/world-session-save.test.ts ? loads a valid hand edited deposit verbatim without generation ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/world-session-save.test.ts ? maps %s to %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/world-session-save.test.ts ? enforces both UTF-8 and UTF-16 caps, allowing the exact boundary ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/world-session-save.test.ts ? rejects invalid encode input and never throws for revoked proxies ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/world-session-save.test.ts ? F1: serializes detached %s descriptors without virtual toJSON ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/world-session-save.test.ts ? F1: validates captured data without any original get traps ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/persistence/src/__tests__/world-session-save.test.ts ? F1: rejects %s without getter/toJSON execution ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? full-session parity through two week cycles ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? $type preserves fields/revision/phase ordering ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? rejects malformed raw descriptors without invoking getters or changing inputs ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? %s wins over session, revision and Report ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? rejects invalid %s before supported command fields/revision ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? accepts null-prototype command data with identical complete results ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? rejects failed raw inspection without touching the session ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? hostile live tile indices preserve both phases: %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? $type detaches nested mutable session data ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? preserves the frozen delegated report contract ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? revalidates invalid successful output from %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-command.test.ts ? preserves the original when cloning Player fails after successful delegation ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-observation.test.ts ? exports the projector and exposes only rendered character fields and exact nested keys ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-observation.test.ts ? changing undisclosed measurements/history changes no observation field ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-observation.test.ts ? known measurements appear only in the Measurements row; adult knowledge includes zero ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-observation.test.ts ? history projects %j to %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-observation.test.ts ? changing hidden seeds and feature placement preserves the entire observation ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-observation.test.ts ? zero free posts gives no reason when all NPCs are assigned, but explains an unassigned card once ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-observation.test.ts ? selects every visible report field while omitting hidden immigration inputs and reason ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/character-life-observation.test.ts ? all mutable nested projections detach from the session, frozen report, catalogue and future observations ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-end-week.test.ts ? releases the last basic assignment after Academy training shrinks the Free pool ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-end-week.test.ts ? releases basic staff when enslavement reduces the sum of rounded pools ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-end-week.test.ts ? reports resolved immigration with Elite Manor=%s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-guard.test.ts ? advances End Week and Next Week without mutating the source ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-guard.test.ts ? keeps the existing LOAD_TRIAL rejection without mutation ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? builds a tavern with pinned cost ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? rejects %s %s atomically ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? uses basic and Makers pools ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? discounts construction by the operating Yard ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? extends the wall atomically with exact costs and unlocks ring two ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? rejects wall extension at ring %s without prerequisites ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? rejects insufficient wall resources atomically ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? validates training target %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? rejects REPLACE on a locked plot without mutation ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? rejects a wrong-tier REPLACE without mutation ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? discounts the full level-two upgrade cost by ten percent ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? combines separately floored Free and Bound workforce pools ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? excludes Makers elites and floors common workforce ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? requires a fully staffed Town Hall for ring three: %s workers ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/society-plots.test.ts ? rejects UPGRADE at the validator boundary for an existing wrong-tier building ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/tile-trial.test.ts ? keeps catalog rules immutable across worlds ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? assigns an NPC with all skills 0 and health 1 to an unlocked slot ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? assigns an NPC with an adverse trait to an unlocked slot ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? ignores stats and traits: two NPCs differing only in them get identical results ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? starts with no automatic jobs and END_WEEK/NEXT_WEEK never assign anyone ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? changes only npcs and city.revision on success ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? LOCKED_POST for %s; nothing changes ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? POST_OCCUPIED when another NPC holds the slot ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? ALREADY_ASSIGNED when moving without unassign; same-target assign is a no-op ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? survives 3 assign/unassign/replace cycles without duplicate or lost posts or renamed NPCs ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? pause and resume keep the post ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? upgrade keeps the post ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? END_WEEK and NEXT_WEEK keep posts and return the report ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? refuses LOAD_TRIAL and invalid sessions ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? rejects %s for END_WEEK in Planning and NEXT_WEEK in Report, with no mutation ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/simulation/src/__tests__/world-npc.test.ts ? still runs valid END_WEEK then NEXT_WEEK with outside carried unchanged ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? uses its own slot key ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? save writes only its key and reads back the same session; other keys keep "protected-bytes" ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? read with empty slot returns the "No local checkpoint" message ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? contains storage failures and never saves an invalid session ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? prepare rebases revision and carries player/profiles; live unchanged ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? prepare rejects %s; nothing changes ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? prepare gives equal results on repeated calls ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? Continue never reads older Life slots ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? ported F1: active Proxy saves detached descriptor data without get callbacks ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? ported F1: invalid %s preserves prior valid bytes before storage access ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? ported slot guard: %s failure preserves browser bytes and session ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? ported checkpoint boundary: %s bytes stay untouched ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/character-life-session.test.ts ? ported checkpoint byte cap: oversized %s save never touches storage ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/world-npc-session.test.ts ? prepares city, outside and npcs together, rebasing the revision ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/world-npc-session.test.ts ? prepares nothing for %s ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/world-session.test.ts ? rejects %s during whole-session preparation without mutation ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/world-session.test.ts ? rebases revision for saved revision %s, including identical data ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/world-session.test.ts ? T-4: stateful outside reads cannot publish values different from the captured validated session ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/world-session.test.ts ? T-4: city and outside come from one detached capture without original get/toJSON callbacks ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/world-session.test.ts ? T-4: prepared city, outside, records and arrays share no mutable data with either input ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.
- packages/ui/src/__tests__/world-session.test.ts ? T-4: %s rejection preserves both inputs and checkpoint bytes without callbacks ? changed: call shape/import only, or ported shared setup old ? society; assertion body unchanged.

## Review correction: retained-field test integrity

The earlier Task 1?8 counts describe the original cleanup checkpoint, before this correction. The medium review finding identified lost coverage of a retained society field. Production code and all society fixture bytes remain unchanged. The optional redundant production check was left unchanged.

### Restored ports

- core/src/trial/__tests__/goods-stock.test.ts marker-descriptor matrix → packages/core/src/trial/__tests__/society-stock-integrity.test.ts: all five original inputs; both city validators reject; each case asserts reads === 0. Only cityEconomyRuleset assertions are omitted.
- The same deleted core file's starting stocks, strict marker/numeric validation and seeded outside/NPC/Player isolation → the same society stock-integrity file. The ordinary outside Market/family comparisons are removed; current inside Market and retained physical-stock assertions are kept.
- core/src/__tests__/weekly.test.ts clock/settlement ownership and fresh-world isolation → packages/core/src/__tests__/society-world-integrity.test.ts. Starting stock expectations use society values; root clock, metadata, cohort and mutation-isolation assertions remain.
- simulation/src/__tests__/goods-stock.test.ts stored production/carry/distribution, reserve accounting, zero demand, overflow rollback, sustainable support and detached observation → packages/simulation/src/__tests__/society-stock-integrity.test.ts. Setup uses class-consistent cohorts and inside spec-1 Market. Society default demand is 1450; the distribution matrix uses Makers-only populations to retain the original 20-milli demand cases exactly. Week six has Food shortage while society Goods reserves remain. Only removed-family contrasts are omitted.
- simulation/src/__tests__/tile-trial-immigration.test.ts → packages/simulation/src/__tests__/society-immigration-integrity.test.ts: low-population rounding, remaining-gap bound, configurable coefficients, global capacity, invalid fact integers and unsafe population/configuration. All original assertions remain; population setup synchronizes society class counts and cohorts.
- simulation/src/__tests__/tile-trial-save.test.ts → packages/simulation/src/__tests__/society-restore-integrity.test.ts: multiweek LOAD_TRIAL parity, revision rebasing/replay, malformed/report/layout/overflow atomicity. Gameplay equality additionally includes society and goodsStock. No removed tile codec is reintroduced.
- simulation/src/__tests__/tile-trial.test.ts retained upgrade/replace cost, pause/release, extraction/input accounting, Market demand/revenue and unfunded-upkeep recovery → packages/simulation/src/__tests__/society-stock-integrity.test.ts. Deleted service-only recipes and shared-pool policy are not restored.

### Remaining deletion scan

This first scan was incomplete for retained weekly and immigration branches; the second correction below supersedes its disposition for those paths. Classic GameState/daily economy, removed resource helpers/clock, legacy save schemas/codecs and family/cross-generation behaviour remain removed. Retained stock/week/cohort validity is also covered by domain/__tests__/canonical-state.test.ts; retained NPC/Player shape, descriptor capture, save detachment and invalid payload/storage atomicity remain covered by the current world/npc, character/validate, Life persistence and UI session suites. Old service-Goods recipes, plain Market placement, single Happiness formulas and old-mode goldens are removed behaviour, rather than the society stored-Goods contract. No production API or assertion was weakened to satisfy the review.

### Restored test titles

- packages/core/src/trial/__tests__/society-stock-integrity.test.ts › rejects retained Goods descriptors and extra keys without invoking code: %s — ported: setup old → society.
- packages/core/src/trial/__tests__/society-stock-integrity.test.ts › keeps the retained starting stocks while the Market is inside — ported: setup old → society.
- packages/core/src/trial/__tests__/society-stock-integrity.test.ts › accepts only the retained Goods marker and safe stock amounts in both validators — ported: setup old → society.
- packages/core/src/trial/__tests__/society-stock-integrity.test.ts › preserves seeded outside, NPC and Player data in detached society sessions: %s — ported: setup old → society.
- packages/core/src/__tests__/society-world-integrity.test.ts › starts only one root clock, with settlement-owned stocks/cohorts and metadata — ported: setup old → society.
- packages/core/src/__tests__/society-world-integrity.test.ts › new worlds share no mutable stocks/cohorts/metadata — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › preserves five default weeks, population, normal upkeep and no hidden grants — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › consumes reserves without production for five weeks and reports the sixth-week Food shortage — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › produces and carries stock without a %s Market; no production revenue — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › distributes stock %i at population %i with %s limit — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › keeps production independent of demand and capacity, bounded by Wood and whole workers — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › retains the no-production/no-revenue convention for zero demand — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › rejects stock overflow atomically — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › does not grant stored stock sustainable target or useful-work bonuses — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › projects detached stock flow without assigning manager buffs — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › upgrades and replaces at full cost without refunds while preserving placement rules — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › pausing releases workers and disallows assignment until resumed — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › reports unfunded buildings without negative stocks and recovers by pausing — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › Market upgrades do not change demand or double multiply revenue — ported: setup old → society.
- packages/simulation/src/__tests__/society-stock-integrity.test.ts › extracts before Goods processing and charges each input once regardless of tile order — ported: setup old → society.
- packages/simulation/src/__tests__/society-immigration-integrity.test.ts › makes the nominal2% low-population exception explicit with integer minimum1 — ported: setup old → society.
- packages/simulation/src/__tests__/society-immigration-integrity.test.ts › bounds the last integer arrival to the remaining gap — ported: setup old → society.
- packages/simulation/src/__tests__/society-immigration-integrity.test.ts › uses configurable provisional support and catchup coefficients — ported: setup old → society.
- packages/simulation/src/__tests__/society-immigration-integrity.test.ts › caps opportunities globally and excludes disabled or unpaid extraction — ported: setup old → society.
- packages/simulation/src/__tests__/society-immigration-integrity.test.ts › rejects invalid fact integers atomically: %s — ported: setup old → society.
- packages/simulation/src/__tests__/society-immigration-integrity.test.ts › rejects unsafe aggregate population and invalid configuration — ported: setup old → society.
- packages/simulation/src/__tests__/society-restore-integrity.test.ts › restores multiweek buildings and resumes identical gameplay with a fresh revision — ported: setup old → society.
- packages/simulation/src/__tests__/society-restore-integrity.test.ts › rebases above saved revision too, then rejects a repeated load — ported: setup old → society.
- packages/simulation/src/__tests__/society-restore-integrity.test.ts › rejects report states, malformed snapshots, changed layouts and revision overflow atomically — ported: setup old → society.

### Review correction verification

Focused command: npx vitest run packages/core/src/trial/__tests__/society-stock-integrity.test.ts packages/core/src/__tests__/society-world-integrity.test.ts packages/simulation/src/__tests__/society-stock-integrity.test.ts packages/simulation/src/__tests__/society-immigration-integrity.test.ts packages/simulation/src/__tests__/society-restore-integrity.test.ts ? exit 0, 44 cases across five files.

Full unit command: npm test ? exit 0, 1050 cases across 50 files (44 restored cases above the original cleanup checkpoint of 1006). The complete eight-gate results and correction commit are reported in the handoff.


## Second review correction: live weekly and immigration branches

Only tests and this ledger changed. All society fixtures and production code remain untouched. The scan covered every deleted entry from tile-trial-population.test.ts, tile-trial-needs.test.ts, tile-trial.test.ts and weekly.test.ts against tile-trial-immigration.ts, tile-trial-week.ts and tile-trial.ts. The original entries above now record the ports.

### Port destinations and explicit adaptations

- society-renewable-support.test.ts: stored Wheat liquidation for 30 weeks with the Farm disabled, Wheat/Food/Gold stocks present, zero renewable Food and zero arrivals each week; exact Wheat debit and Food conservation; inputs/assignments unchanged and transactional reports validated. Two funded Farms retain exact independent caps with one/two Processors: useful slots 20/25, renewable Food 10000, targets 200/227, cash debits 7500/8000, arrivals 2. Opening population tax/needs, idle capacity, zero/unsupported cohorts, no departures, shortage/unpaid/liquidity/target refusal, stale/overflow rollback, 60-week snapshot parity and 45-week pause/resume are also ported. Old exact population trajectories, old economy comparisons and deleted codecs are omitted. The unsupported-cohort end-week path currently rejects atomically after projection; the test records that existing society behavior without a production fix.
- society-command-transaction.test.ts: whole-batch funding and Gold/Wheat/Food conservation, frozen/replay purity, disabled Processor harvest, intermediate Wheat/Food/Wood/Iron overflow and exact safe limits, week/revision/population overflow, malformed/stale/phase commands, hostile proxies, command capture, post-validation rollback, report detachment, actual active-pointer ownership/legacy isolation and invalid-state atomicity. Old weekly command reservation fields, processor-availability parameter and report.flows schema are removed. Society tax, consumption and upkeep are included explicitly in conservation instead of the removed no-income/no-consumption assumptions.
- society-stock-policy-ports.test.ts: equipped starting stocks, zero population, incomplete Wood batches, demand/capacity and material accounting, eleven integer Food/Happiness rows, original Food recovery values 74/80/85 without Goods service, safe milli demand boundary, overflow purity, replay determinism and 50-week stock conservation. Stored Goods production no longer requires Market service or Iron and intentionally carries stock; those old service-only expectations are removed. Two fractional single-Happiness rows and preservation of a fractional aggregate at zero population are removed: society class scores are integers and the empty weighted aggregate is zero. Zero class-score preservation remains asserted.

### Remaining deleted subjects in the three live paths

- `tile-trial-population.test.ts`: keeps legacy default and explicit policy identical with no population report ? Removed default/explicit economy-policy dispatch and legacy report contrast; society always reports immigration.
- `tile-trial-population.test.ts`: rejects an unknown mode policy without changing gameplay ? Removed economy-policy argument and INVALID_RULESET branch; no compatibility signature.
- `weekly.test.ts`: uses real cohort count/class/legal status: %i %s/%s ? Removed weekly command workforce fields and old class/legal workforce policy; society workforce is class-specific and validated by the retained society workforce suites.
- `weekly.test.ts`: accepts zero workforce with zero cohorts, rejects positive assignment ? Removed weekly reservation command fields; zero society population is ported in society-renewable-support and society-stock-policy-ports; tile assignment class limits remain in society tests.
- `weekly.test.ts`: runs the same 4+4 WF chain with large safe canonical population %i ? Removed canonical weekly command and shared workforce formula; society arithmetic boundaries and transaction overflow are ported, not the obsolete large-population workforce policy.
- `weekly.test.ts`: rejects shared 8 WF reservation against 6 WF before either activity runs ? Removed shared workforce reservation command and single shared pool; society uses separate class pools.

Classic daily dispatcher/resource/clock tests do not execute these three tile modules: their GameState, daily commands and error/report schemas were deleted. Legacy codec tests exercise deleted serializers, not retained LOAD_TRIAL; retained snapshot atomicity/parity is covered by society-restore-integrity.test.ts. Deleted Goods-family Life/plot cases exercise removed family contrasts; society Life/plot command branches remain in their kept suites. No remaining generic deletion in the four weekly/tile files is treated as removed merely because its setup used an old generation.

### New ported titles

- society-renewable-support.test.ts: two funded Farms retain independent recipe caps with $processors funded Processor(s) ? ported: setup old → society.
- society-renewable-support.test.ts: does not mistake 30 weeks of stored Wheat liquidation for renewable Food ? ported: setup old → society.
- society-renewable-support.test.ts: settles the opening population before applying society arrivals without changing assignments ? ported: setup old → society.
- society-renewable-support.test.ts: starter reserves and stored Wheat liquidation do not create renewable support ? ported: setup old → society.
- society-renewable-support.test.ts: duplicate idle Processor cannot reuse the same Wheat capacity ? ported: setup old → society.
- society-renewable-support.test.ts: one funded Farm shares its five supply slots across two funded Processors ? ported: setup old → society.
- society-renewable-support.test.ts: duplicate idle Workshop cannot reuse Market distribution capacity ? ported: setup old → society.
- society-renewable-support.test.ts: never revives a zero city or introduces departures when support is below population ? ported: setup old → society.
- society-renewable-support.test.ts: does not admit during shortage, unpaid upkeep or tight liquidity ? ported: setup old → society.
- society-renewable-support.test.ts: rejects stale or repeated End Week and overflow atomically ? ported: setup old → society.
- society-renewable-support.test.ts: preserves complete gameplay and assignments through sixty weeks of snapshot restores ? ported: setup old → society.
- society-renewable-support.test.ts: stops and resumes immigration over forty-five weeks when renewable support changes ? ported: setup old → society.
- society-renewable-support.test.ts: retains the live immigration refusal branch: %s ? ported: setup old → society.
- society-command-transaction.test.ts: whole batches conserve Gold/Wheat/Food for G%s W%s and %s/%s workers ? ported: setup old → society.
- society-command-transaction.test.ts: harvests without processing when the Processor is paused ? ported: setup old → society.
- society-command-transaction.test.ts: rejects intermediate Wheat overflow before a later processing debit ? ported: setup old → society.
- society-command-transaction.test.ts: permits the exact intermediate Wheat limit and charges processing once ? ported: setup old → society.
- society-command-transaction.test.ts: rejects intermediate %s overflow atomically ? ported: setup old → society.
- society-command-transaction.test.ts: permits exact Food/Gold boundaries and preserves unrelated physical stocks ? ported: setup old → society.
- society-command-transaction.test.ts: rolls back the complete transaction on %s arithmetic overflow ? ported: setup old → society.
- society-command-transaction.test.ts: rejects malformed command data %j without mutation ? ported: setup old → society.
- society-command-transaction.test.ts: rejects unknown command fields and stale or repeated week/revision commands ? ported: setup old → society.
- society-command-transaction.test.ts: contains clone failures and thrown command objects without leaking a report ? ported: setup old → society.
- society-command-transaction.test.ts: uses one captured live command snapshot instead of rereading Proxy fields ? ported: setup old → society.
- society-command-transaction.test.ts: preserves the invalid-state boundary for revoked Proxy inputs ? ported: setup old → society.
- society-command-transaction.test.ts: rolls back and publishes no report if the candidate state fails final validation ? ported: setup old → society.
- society-command-transaction.test.ts: preserves immutable report snapshots after next-state mutation ? ported: setup old → society.
- society-command-transaction.test.ts: follows the active pointer and leaves the legacy settlement byte-for-byte unchanged ? ported: setup old → society.
- society-command-transaction.test.ts: rejects invalid society state atomically: %s ? ported: setup old → society.
- society-stock-policy-ports.test.ts: starts a valid independent world with five physical stocks and equipped Food chain ? ported: setup old → society.
- society-stock-policy-ports.test.ts: zero population consumes no materials or Food and mints no tax, revenue or class satisfaction ? ported: setup old → society.
- society-stock-policy-ports.test.ts: never charges an incomplete Wood batch even while stored Goods can be distributed ? ported: setup old → society.
- society-stock-policy-ports.test.ts: caps distribution at demand, charges complete production batches once and carries the remainder ? ported: setup old → society.
- society-stock-policy-ports.test.ts: ports the retained Food rule per class: $name ? ported: setup old → society.
- society-stock-policy-ports.test.ts: preserves Food shortage and recovery without Goods service ? ported: setup old → society.
- society-stock-policy-ports.test.ts: retains exact milli Food allocation at the last safe demand boundary ? ported: setup old → society.
- society-stock-policy-ports.test.ts: rejects overflowing per-class Food demand ? ported: setup old → society.
- society-stock-policy-ports.test.ts: keeps Food/Goods resolution deterministic and preserves caller-owned state ? ported: setup old → society.
- society-stock-policy-ports.test.ts: sustains fifty weeks with exact stock conservation and no duplicate Food or free Goods ? ported: setup old → society.

Focused validation: the three new files contain 68 passing cases (17 renewable-support, 31 command-transaction, 20 stock-policy). Full unit validation: npm test exited 0 with 1118 cases across 53 files, up from 1050 across 50 files. All eight gates are reported with the final commit in the handoff.
