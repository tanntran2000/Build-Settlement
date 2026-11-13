import type { ImmigrationTrialConfig, TrialBuildingDefinition } from '../trial/catalog.js';
import type { SocietyBuildingInfo } from '../trial/society-map.js';
import type { LawDefinition } from '../trial/law.js';
import type { OutsideTerrain, OutsidePlotState } from '../trial/outside.js';
import type { ItemDefinition, ItemTrial } from '../trial/items.js';
type IMMIGRATION_TRIAL_DEFAULTSData = Readonly<ImmigrationTrialConfig>;
type TRIAL_BUILDINGSData = Readonly<Record<string, TrialBuildingDefinition>>;
type TILE_TRIAL_BALANCEData = Readonly<{
    initialWoodMilli: 8000;
    initialIronMilli: 4000;
    initialHappiness: 80;
    loggingWoodPerWorker: 2000;
    mineIronPerWorker: 1000;
    goodsDemandPerResident: 20;
    taxGoldPerResident: 30;
    goldPerServiceMilli: 1000;
    foodDemandPerResident: 40;
}>;
type CRISIS_TRIALData = Readonly<{
    warningTension: 50;
    demandHungerWeeks: 3;
    happinessBelow: 30;
    protest: Readonly<{
        minWeeks: 2;
        tension: 75;
    }>;
    rebellion: Readonly<{
        minWeeks: 2;
        tension: 90;
    }>;
    finalWeeks: 4;
    calmWeeksToStepDown: 2;
    pay: Readonly<{
        demand: Readonly<{
            milliPerResident: 20;
            tension: -10;
        }>;
        protest: Readonly<{
            milliPerResident: 40;
            tension: -15;
        }>;
        rebellion: Readonly<{
            milliPerResident: 60;
            tension: -20;
        }>;
    }>;
    promise: Readonly<{
        weeks: 2;
        kept: Readonly<{
            demand: -15;
            protest: -20;
            rebellion: -25;
        }>;
        keptAuthority: 5;
        brokenTension: 10;
        brokenAuthority: -10;
    }>;
    force: Readonly<{
        security: Readonly<{
            demand: 40;
            protest: 55;
            rebellion: 70;
        }>;
        tension: Readonly<{
            demand: -10;
            protest: -15;
            rebellion: -20;
        }>;
        authority: 5;
        crime: 5;
        satisfaction: -5;
    }>;
    refuse: Readonly<{
        tension: 5;
    }>;
}>;
type RESEARCH_TOPICSData = readonly [
    "deep-mining",
    "watch-patrols",
    "barracks-drill"
];
type OUTSIDE_PLOTSData = readonly Readonly<{
    id: string;
    terrain: OutsideTerrain;
    ring: 1 | 2 | 3;
}>[];
type OUTSIDE_TRIALData = Readonly<{
    deposit: Readonly<{
        forest: 60000;
        ore: 80000;
        rock: 100000;
    }>;
    forestRegrowMilli: 3000;
    clearWork: Readonly<{
        fertile: 4000;
        pasture: 4000;
        meadow: 4000;
        plain: 4000;
        forest: 6000;
        ore: 8000;
        rock: 8000;
    }>;
    clearFeeGoldMilli: 2000;
    forestClearWoodMilli: 5000;
    perWorker: Readonly<{
        wool: 1000;
        herbs: 500;
        stone: 1000;
    }>;
    weaver: Readonly<{
        woolPerBatchMilli: 2000;
        clothPerBatchMilli: 1000;
    }>;
    workshopClothRecipe: Readonly<{
        woodMilli: 1000;
        clothMilli: 1000;
    }>;
    hospitalHerbsPerLevelMilli: 1000;
    storage: Readonly<{
        baseMilli: 40000;
        warehousePerLevelMilli: 40000;
    }>;
    research: Readonly<{
        'deep-mining': Readonly<{
            workMilli: 8000;
            goldMilli: 10000;
        }>;
        'watch-patrols': Readonly<{
            workMilli: 6000;
            goldMilli: 6000;
        }>;
        'barracks-drill': Readonly<{
            workMilli: 8000;
            goldMilli: 8000;
        }>;
    }>;
    deepShaft: Readonly<{
        stoneMilli: 10000;
        woodMilli: 5000;
        goldMilli: 10000;
        depositBonusMilli: 60000;
        outputBps: 15000;
    }>;
    wallRing3StoneMilli: 30000;
    level3StoneMilli: 5000;
}>;
type CRIME_TRIALData = Readonly<{
    baseChance: 5;
    idleWatchHouse: 2;
    bands: Readonly<{
        minorMax: 33;
        seriousMax: 66;
    }>;
    weights: Readonly<{
        robbery: 4;
        smear: 3;
        raid: 2;
        assassination: 1;
    }>;
    assassinationMinCrime: 70;
    robberyBps: Readonly<{
        minor: 500;
        serious: 1000;
        severe: 2000;
    }>;
    smear: Readonly<{
        minor: 3;
        serious: 6;
        severe: 10;
    }>;
    raidDeaths: Readonly<{
        minor: 1;
        serious: 2;
        severe: 3;
    }>;
    fatal: Readonly<{
        minCrime: 90;
        maxSecurity: 30;
        chance: 0.5;
    }>;
    wound: Readonly<{
        health: 20;
        standing: 5;
        authority: 5;
    }>;
    standing: Readonly<{
        newGame: 50;
        drift: 1;
        authorityDivisor: 5;
    }>;
}>;
type ORDER_TRIALData = Readonly<{
    newGame: Readonly<{
        security: 30;
        crime: 10;
        authority: 50;
    }>;
    drift: Readonly<{
        security: 5;
        crime: 5;
        authority: 3;
    }>;
    security: Readonly<{
        base: 10;
        perWallRing: 5;
        watchHouseByLevel: readonly number[];
        slumWatchHouseBonus: 5;
        patrolsNumerator: 3;
        patrolsDenominator: 2;
        barracksPerWorker: 2;
        drilledPerWorker: 3;
        residentsPerPoint: 20;
        slumPenalty: 3;
        darkPenalty: 5;
    }>;
    crime: Readonly<{
        base: 10;
        perSlum: 5;
        desperationDivisor: 5;
        dark: 10;
        light: -5;
        securityDivisor: 2;
    }>;
    authority: Readonly<{
        base: 40;
        securityDivisor: 5;
        crimeDivisor: 4;
        townHall: 10;
        satisfactionDivisor: 5;
        tensionDivisor: 10;
    }>;
    theft: Readonly<{
        threshold: 20;
        bpsPerPoint: 10;
    }>;
    tensionDivisor: 25;
    satisfactionLoss: readonly (Readonly<{
        crime: 70;
        loss: 2;
    }> | Readonly<{
        crime: 40;
        loss: 1;
    }>)[];
    tax: Readonly<{
        bpsPerPoint: 40;
    }>;
    immigration: Readonly<{
        halveBelow: 30;
        bonusAtOrAbove: 70;
    }>;
    bands: Readonly<{
        lowMax: 33;
        fairMax: 66;
    }>;
}>;
type GARRISON_TRIALData = Readonly<{
    securityPerStep: 3;
    soldiersPerStep: 4;
    cap: 12;
}>;
type LAW_CATALOGData = Readonly<Record<"curfew" | "watch-levy" | "guild-charters" | "war-tithe" | "poor-relief" | "free-assembly" | "public-punishments" | "licensed-vice", LawDefinition>>;
type LAW_TRIALData = Readonly<{
    maxActive: 3;
    eliteWeight: 5;
    payMilliPerVote: 200;
    force: Readonly<{
        satisfaction: -10;
        tension: 5;
        standing: -3;
        minSecurity: 40;
    }>;
    promise: Readonly<{
        weeks: 4;
        keptAuthority: 3;
        brokenSatisfaction: -10;
        brokenTension: 10;
    }>;
    repeal: Readonly<{
        authority: -5;
        cooldownWeeks: 4;
    }>;
    corruptionPerTag: 10;
}>;
type LAW_MESSAGESData = Readonly<{
    CARD_PENDING: "Answer the crisis first.";
    UNKNOWN_LAW: "Choose a law from the Council list.";
    TOWN_HALL_CLOSED: "Staff the Town Hall to call a vote.";
    VOTE_USED: "The Council has already voted this week.";
    LAW_ACTIVE: "This law is already in force.";
    LAW_SLOTS_FULL: "Three laws are in force. Repeal one first.";
    LAW_COOLDOWN: "This law returns in week {N}.";
    LOBBY_INVALID: "Only groups with a vote that are not For can be lobbied.";
    VOTE_SHORT: "The vote would fail: For {F} · Against {A}.";
    LAW_INACTIVE: "This law is not in force.";
}>;
type GOODS_STOCK_TRIALData = Readonly<{
    initialFoodMilli: 20000;
    initialGoodsMilli: 10000;
    initialGoldMilli: 45000;
    woodPerBatchMilli: 2000;
    goodsPerBatchMilli: 2000;
    capacityPerLevelMilli: 2000;
    goldPerGoodsMilli: 1000;
}>;
type SOCIETY_TRIALData = Readonly<{
    readonly rulesetId: "tile-society-07";
    readonly standing: 50;
    readonly laws: Readonly<{
        active: never[];
        votedWeek: null;
        repealedUntil: {};
        promise: null;
    }>;
    readonly order: Readonly<{
        security: 30;
        crime: 10;
        authority: 50;
    }>;
    readonly crisis: Readonly<{
        fallCause: null;
        stage: "none";
        weeksInStage: 0;
        hungerStreak: 0;
        calmStreak: 0;
        promise: null;
        lastChoice: null;
    }>;
    readonly pendingCard: null;
    readonly stocksMilli: Readonly<{
        stone: 0;
        wool: 0;
        cloth: 0;
        herbs: 0;
    }>;
    readonly outside: Readonly<Record<string, OutsidePlotState>>;
    readonly research: Readonly<{
        topic: null;
        progressMilli: Readonly<{
            'deep-mining': 0;
            'watch-patrols': 0;
            'barracks-drill': 0;
        }>;
        paid: never[];
        completed: never[];
    }>;
    readonly classes: Readonly<{
        free: 55;
        makers: Readonly<{
            common: 20;
            elite: 0;
        }>;
        luminaries: Readonly<{
            common: 12;
            elite: 0;
        }>;
        merchants: Readonly<{
            common: 13;
            elite: 0;
        }>;
        bound: Readonly<{
            free: 0;
            makers: 0;
            luminaries: 0;
            merchants: 0;
        }>;
    }>;
    readonly satisfaction: Readonly<{
        free: 80;
        makers: 80;
        luminaries: 80;
        merchants: 80;
        bound: 80;
    }>;
    readonly desperation: 0;
    readonly tension: 0;
    readonly debtPressure: Readonly<{
        free: 0;
        makers: 0;
        luminaries: 0;
        merchants: 0;
    }>;
    readonly corruption: 50;
    readonly luxuryStockMilli: 0;
    readonly training: Readonly<{
        target: null;
        progressMilli: 0;
    }>;
    readonly wallRing: 1;
}>;
type SOCIETY_BUILDINGSData = Readonly<Record<string, SocietyBuildingInfo>>;
export interface BuildingCatalog {
    trial: TRIAL_BUILDINGSData;
    society: SOCIETY_BUILDINGSData;
}
export interface LawCatalog {
    catalog: LAW_CATALOGData;
    trial: LAW_TRIALData;
    messages: LAW_MESSAGESData;
}
export interface TuningCatalog {
    ORDER_TRIAL: ORDER_TRIALData;
    GARRISON_TRIAL: GARRISON_TRIALData;
    CRIME_TRIAL: CRIME_TRIALData;
    CRISIS_TRIAL: CRISIS_TRIALData;
    SOCIETY_TRIAL: SOCIETY_TRIALData;
    GOODS_STOCK_TRIAL: GOODS_STOCK_TRIALData;
    TILE_TRIAL_BALANCE: TILE_TRIAL_BALANCEData;
    IMMIGRATION_TRIAL_DEFAULTS: IMMIGRATION_TRIAL_DEFAULTSData;
    OUTSIDE_TRIAL: OUTSIDE_TRIALData;
}
// Core's existing deepFreeze helpers are module-private outside this WP's allowlist.
// Reuse their implementation here without changing those modules' public surface.
export function deepFreeze<T>(value: T): T {
    if (value && typeof value === 'object') {
        Object.values(value).forEach(deepFreeze);
        Object.freeze(value);
    }
    return value;
}
export class CatalogError extends Error {
    constructor(public readonly ref: string, field: string, rule: string) {
        super(`${ref}.${field}: ${rule}`);
        this.name = 'CatalogError';
    }
}
type Rule = (value: unknown, ref: string, field: string) => void;
const fail = (ref: string, field: string, rule: string): never => { throw new CatalogError(ref, field, rule); };
const child = (field: string, key: string) => field ? `${field}.${key}` : key;
const integer: Rule = (value, ref, field) => {
    if (!Number.isSafeInteger(value))
        fail(ref, field, 'expected integer');
};
const nonnegative: Rule = (value, ref, field) => {
    if (!Number.isSafeInteger(value) || (value as number) < 0)
        fail(ref, field, 'expected integer >= 0');
};
const positive: Rule = (value, ref, field) => {
    if (!Number.isSafeInteger(value) || (value as number) <= 0)
        fail(ref, field, 'expected integer > 0');
};
const probability: Rule = (value, ref, field) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1)
        fail(ref, field, 'expected number in [0, 1]');
};
const text: Rule = (value, ref, field) => {
    if (typeof value !== 'string' || !value.trim())
        fail(ref, field, 'expected nonempty string');
};
const boolean: Rule = (value, ref, field) => {
    if (typeof value !== 'boolean')
        fail(ref, field, 'expected boolean');
};
function oneOf(...values: readonly unknown[]): Rule {
    return (value, ref, field) => { if (!values.includes(value))
        fail(ref, field, `expected ${values.join(' | ')}`); };
}
const literal = (value: unknown): Rule => oneOf(value);
const optional = (rule: Rule): Rule => (value, ref, field) => { if (value !== undefined)
    rule(value, ref, field); };
function record(value: unknown, ref: string, field: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype)
        fail(ref, field, 'expected object');
    return value as Record<string, unknown>;
}
function object(shape: Record<string, Rule>): Rule {
    return (value, ref, field) => {
        const fields = record(value, ref, field);
        for (const key of Object.keys(fields))
            if (!Object.hasOwn(shape, key))
                fail(ref, child(field, key), 'unexpected field');
        for (const [key, rule] of Object.entries(shape))
            rule(fields[key], ref, child(field, key));
    };
}
function tuple(rules: Rule[]): Rule {
    return (value, ref, field) => {
        if (!Array.isArray(value) || value.length !== rules.length)
            fail(ref, field, `expected array of length ${rules.length}`);
        rules.forEach((rule, i) => rule((value as unknown[])[i], ref, child(field, String(i))));
    };
}
function list(rule: Rule): Rule {
    return (value, ref, field) => {
        if (!Array.isArray(value) || value.length === 0)
            fail(ref, field, 'expected nonempty array');
        (value as unknown[]).forEach((v, i) => rule(v, ref, child(field, String(i))));
    };
}
function catalog(value: unknown, file: string, ids: readonly string[], rule: Rule) {
    const entries = record(value, `${file}#catalog`, 'entries');
    for (const id of Object.keys(entries))
        if (!ids.includes(id))
            fail(`${file}#${id}`, 'id', 'unknown id');
    for (const id of ids)
        rule(entries[id], `${file}#${id}`, '');
}
const buildingSchema = object({
    name: text, operation: oneOf('farm', 'processor', 'logging', 'mine', 'goods', 'market', 'society', 'wool', 'herbs', 'stone', 'cloth'),
    terrain: list(oneOf('fertile', 'pasture', 'meadow', 'forest', 'ore', 'rock', 'plain', 'town')),
    maxLevel: positive, maxWorkers: nonnegative,
    cost: object({
        gold: nonnegative, wood: nonnegative, iron: nonnegative
    }), upkeepMilli: nonnegative,
});
const tier = oneOf('housing', 'service', 'specialist', 'slum');
const societyBuildingSchema = object({
    tier, alsoTier: optional(tier), staff: oneOf('basic', 'makers', 'luminaries', 'merchants', null), reserved: boolean,
    housing: optional(object({
        class: oneOf('free', 'makers', 'luminaries', 'merchants', 'elite', 'bound'), byLevel: list(nonnegative)
    })),
});
const stance = oneOf('for', 'against', 'neutral');
const classEffects = object({
    free: optional(integer), makers: optional(integer), luminaries: optional(integer), merchants: optional(integer)
});
const lawSchema = object({
    name: text, tag: oneOf('light', 'dark', null), stances: object({
        free: stance, makers: stance, luminaries: stance, merchants: stance
    }),
    effect: object({
        securityTarget: optional(integer), crimeTarget: optional(integer), authorityTarget: optional(integer),
        satisfaction: optional(classEffects), desperation: optional(integer), tension: optional(integer), taxBps: optional(integer),
        costMilli: optional(nonnegative), incomeMilli: optional(nonnegative)
    }),
});
const BUILDING_IDS = [
    "sheep-pasture", "herb-garden", "quarry", "weaver", "watch-house", "military-barracks", "library", "warehouse", "farm", "processor", "logging", "mine", "workshop", "common-housing", "makers-rowhouses", "scholars-quarters", "merchant-townhouses", "elite-manor", "tavern", "hospital", "town-hall", "builders-yard", "academy", "town-market", "trading-post", "counting-house", "slave-quarters"
];
const SOCIETY_IDS = [
    "common-housing", "makers-rowhouses", "scholars-quarters", "merchant-townhouses", "elite-manor", "tavern", "hospital", "town-hall", "builders-yard", "academy", "town-market", "trading-post", "counting-house", "slave-quarters", "military-barracks", "watch-house", "warehouse", "smithy", "library", "brothel", "black-market", "arena", "drug-store"
];
const LAW_IDS = [
    "curfew", "watch-levy", "guild-charters", "war-tithe", "poor-relief", "free-assembly", "public-punishments", "licensed-vice"
];
const PLOT_IDS = [
    "field-1", "plain-1", "forest-1", "ore-1", "plain-2", "plain-3", "forest-2", "ore-2", "field-2", "plain-4", "field-3", "field-4", "pasture-1", "pasture-2", "meadow-1", "meadow-2", "forest-3", "rock-1", "rock-2", "plain-5", "field-5", "pasture-3", "meadow-3", "forest-4", "forest-5", "ore-3", "ore-4", "rock-3", "plain-6", "plain-7"
];
const lawTrialSchema = object({
    "maxActive": nonnegative, "eliteWeight": nonnegative, "payMilliPerVote": nonnegative, "force": object({
        "satisfaction": integer, "tension": nonnegative, "standing": integer, "minSecurity": nonnegative
    }), "promise": object({
        "weeks": nonnegative, "keptAuthority": nonnegative, "brokenSatisfaction": integer, "brokenTension": nonnegative
    }), "repeal": object({
        "authority": integer, "cooldownWeeks": nonnegative
    }), "corruptionPerTag": nonnegative
});
const lawMessagesSchema = object({
    CARD_PENDING: text, UNKNOWN_LAW: text, TOWN_HALL_CLOSED: text, VOTE_USED: text, LAW_ACTIVE: text, LAW_SLOTS_FULL: text, LAW_COOLDOWN: text, LOBBY_INVALID: text, VOTE_SHORT: text, LAW_INACTIVE: text
});
const tuningSchemas: Record<string, Rule> = {
    "ORDER_TRIAL": object({
        "newGame": object({
            "security": nonnegative, "crime": nonnegative, "authority": nonnegative
        }), "drift": object({
            "security": nonnegative, "crime": nonnegative, "authority": nonnegative
        }), "security": object({
            "base": nonnegative, "perWallRing": nonnegative, "watchHouseByLevel": tuple([
                nonnegative, nonnegative
            ]), "slumWatchHouseBonus": nonnegative, "patrolsNumerator": nonnegative, "patrolsDenominator": positive, "barracksPerWorker": nonnegative, "drilledPerWorker": nonnegative, "residentsPerPoint": nonnegative, "slumPenalty": nonnegative, "darkPenalty": nonnegative
        }), "crime": object({
            "base": nonnegative, "perSlum": nonnegative, "desperationDivisor": positive, "dark": nonnegative, "light": integer, "securityDivisor": positive
        }), "authority": object({
            "base": nonnegative, "securityDivisor": positive, "crimeDivisor": positive, "townHall": nonnegative, "satisfactionDivisor": positive, "tensionDivisor": positive
        }), "theft": object({
            "threshold": nonnegative, "bpsPerPoint": nonnegative
        }), "tensionDivisor": positive, "satisfactionLoss": tuple([
            object({
                "crime": nonnegative, "loss": nonnegative
            }), object({
                "crime": nonnegative, "loss": nonnegative
            })
        ]), "tax": object({
            "bpsPerPoint": nonnegative
        }), "immigration": object({
            "halveBelow": nonnegative, "bonusAtOrAbove": nonnegative
        }), "bands": object({
            "lowMax": nonnegative, "fairMax": nonnegative
        })
    }), "GARRISON_TRIAL": object({
        "securityPerStep": positive, "soldiersPerStep": positive, "cap": nonnegative
    }), "CRIME_TRIAL": object({
        "baseChance": nonnegative, "idleWatchHouse": nonnegative, "bands": object({
            "minorMax": nonnegative, "seriousMax": nonnegative
        }), "weights": object({
            "robbery": nonnegative, "smear": nonnegative, "raid": nonnegative, "assassination": nonnegative
        }), "assassinationMinCrime": nonnegative, "robberyBps": object({
            "minor": nonnegative, "serious": nonnegative, "severe": nonnegative
        }), "smear": object({
            "minor": nonnegative, "serious": nonnegative, "severe": nonnegative
        }), "raidDeaths": object({
            "minor": nonnegative, "serious": nonnegative, "severe": nonnegative
        }), "fatal": object({
            "minCrime": nonnegative, "maxSecurity": nonnegative, "chance": probability
        }), "wound": object({
            "health": nonnegative, "standing": nonnegative, "authority": nonnegative
        }), "standing": object({
            "newGame": nonnegative, "drift": nonnegative, "authorityDivisor": positive
        })
    }), "CRISIS_TRIAL": object({
        "warningTension": nonnegative, "demandHungerWeeks": nonnegative, "happinessBelow": nonnegative, "protest": object({
            "minWeeks": nonnegative, "tension": nonnegative
        }), "rebellion": object({
            "minWeeks": nonnegative, "tension": nonnegative
        }), "finalWeeks": nonnegative, "calmWeeksToStepDown": nonnegative, "pay": object({
            "demand": object({
                "milliPerResident": nonnegative, "tension": integer
            }), "protest": object({
                "milliPerResident": nonnegative, "tension": integer
            }), "rebellion": object({
                "milliPerResident": nonnegative, "tension": integer
            })
        }), "promise": object({
            "weeks": nonnegative, "kept": object({
                "demand": integer, "protest": integer, "rebellion": integer
            }), "keptAuthority": nonnegative, "brokenTension": nonnegative, "brokenAuthority": integer
        }), "force": object({
            "security": object({
                "demand": nonnegative, "protest": nonnegative, "rebellion": nonnegative
            }), "tension": object({
                "demand": integer, "protest": integer, "rebellion": integer
            }), "authority": nonnegative, "crime": nonnegative, "satisfaction": integer
        }), "refuse": object({
            "tension": nonnegative
        })
    }), "SOCIETY_TRIAL": object({
        "rulesetId": literal("tile-society-07"), "standing": nonnegative, "laws": object({
            "active": tuple([]), "votedWeek": literal(null), "repealedUntil": object({}), "promise": literal(null)
        }), "order": object({
            "security": nonnegative, "crime": nonnegative, "authority": nonnegative
        }), "crisis": object({
            "fallCause": literal(null), "stage": literal("none"), "weeksInStage": nonnegative, "hungerStreak": nonnegative, "calmStreak": nonnegative, "promise": literal(null), "lastChoice": literal(null)
        }), "pendingCard": literal(null), "stocksMilli": object({
            "stone": nonnegative, "wool": nonnegative, "cloth": nonnegative, "herbs": nonnegative
        }), "outside": object({
            "field-1": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "plain-1": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "forest-1": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "ore-1": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "plain-2": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "plain-3": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "forest-2": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "ore-2": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "field-2": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "plain-4": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "field-3": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "field-4": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "pasture-1": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "pasture-2": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "meadow-1": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "meadow-2": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "forest-3": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "rock-1": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "rock-2": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "plain-5": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "field-5": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "pasture-3": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "meadow-3": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "forest-4": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "forest-5": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "ore-3": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "ore-4": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "rock-3": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": nonnegative, "capMilli": nonnegative, "deepShaft": boolean
            }), "plain-6": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            }), "plain-7": object({
                "wild": boolean, "clearMilli": nonnegative, "clearWorkers": nonnegative, "clearPaid": boolean, "depositMilli": literal(null), "capMilli": literal(null), "deepShaft": boolean
            })
        }), "research": object({
            "topic": literal(null), "progressMilli": object({
                "deep-mining": nonnegative, "watch-patrols": nonnegative, "barracks-drill": nonnegative
            }), "paid": tuple([]), "completed": tuple([])
        }), "classes": object({
            "free": nonnegative, "makers": object({
                "common": nonnegative, "elite": nonnegative
            }), "luminaries": object({
                "common": nonnegative, "elite": nonnegative
            }), "merchants": object({
                "common": nonnegative, "elite": nonnegative
            }), "bound": object({
                "free": nonnegative, "makers": nonnegative, "luminaries": nonnegative, "merchants": nonnegative
            })
        }), "satisfaction": object({
            "free": nonnegative, "makers": nonnegative, "luminaries": nonnegative, "merchants": nonnegative, "bound": nonnegative
        }), "desperation": nonnegative, "tension": nonnegative, "debtPressure": object({
            "free": nonnegative, "makers": nonnegative, "luminaries": nonnegative, "merchants": nonnegative
        }), "corruption": nonnegative, "luxuryStockMilli": nonnegative, "training": object({
            "target": literal(null), "progressMilli": nonnegative
        }), "wallRing": nonnegative
    }), "GOODS_STOCK_TRIAL": object({
        "initialFoodMilli": nonnegative, "initialGoodsMilli": nonnegative, "initialGoldMilli": nonnegative, "woodPerBatchMilli": nonnegative, "goodsPerBatchMilli": nonnegative, "capacityPerLevelMilli": nonnegative, "goldPerGoodsMilli": nonnegative
    }), "TILE_TRIAL_BALANCE": object({
        "initialWoodMilli": nonnegative, "initialIronMilli": nonnegative, "initialHappiness": nonnegative, "loggingWoodPerWorker": nonnegative, "mineIronPerWorker": nonnegative, "goodsDemandPerResident": nonnegative, "taxGoldPerResident": nonnegative, "goldPerServiceMilli": nonnegative, "foodDemandPerResident": nonnegative
    }), "IMMIGRATION_TRIAL_DEFAULTS": object({
        "foodSupportBps": nonnegative, "catchupBps": nonnegative, "weeklyCapBps": nonnegative
    }), "OUTSIDE_TRIAL": object({
        "deposit": object({
            "forest": nonnegative, "ore": nonnegative, "rock": nonnegative
        }), "forestRegrowMilli": nonnegative, "clearWork": object({
            "fertile": nonnegative, "pasture": nonnegative, "meadow": nonnegative, "plain": nonnegative, "forest": nonnegative, "ore": nonnegative, "rock": nonnegative
        }), "clearFeeGoldMilli": nonnegative, "forestClearWoodMilli": nonnegative, "perWorker": object({
            "wool": nonnegative, "herbs": nonnegative, "stone": nonnegative
        }), "weaver": object({
            "woolPerBatchMilli": nonnegative, "clothPerBatchMilli": nonnegative
        }), "workshopClothRecipe": object({
            "woodMilli": nonnegative, "clothMilli": nonnegative
        }), "hospitalHerbsPerLevelMilli": nonnegative, "storage": object({
            "baseMilli": nonnegative, "warehousePerLevelMilli": nonnegative
        }), "research": object({
            "deep-mining": object({
                "workMilli": nonnegative, "goldMilli": nonnegative
            }), "watch-patrols": object({
                "workMilli": nonnegative, "goldMilli": nonnegative
            }), "barracks-drill": object({
                "workMilli": nonnegative, "goldMilli": nonnegative
            })
        }), "deepShaft": object({
            "stoneMilli": nonnegative, "woodMilli": nonnegative, "goldMilli": nonnegative, "depositBonusMilli": nonnegative, "outputBps": nonnegative
        }), "wallRing3StoneMilli": nonnegative, "level3StoneMilli": nonnegative
    })
};
export function validateBuildings(json: unknown): BuildingCatalog {
    const data = record(json, 'buildings.json#catalog', 'entries');
    object({
        trial: () => { }, society: () => { }
    })(data, 'buildings.json#catalog', '');
    catalog(data.trial, 'buildings.json', BUILDING_IDS, buildingSchema);
    catalog(data.society, 'buildings.json', SOCIETY_IDS, societyBuildingSchema);
    return data as unknown as BuildingCatalog;
}
export function validateLaws(json: unknown): LawCatalog {
    const data = record(json, 'laws.json#catalog', 'entries');
    object({
        catalog: () => { }, trial: lawTrialSchema, messages: lawMessagesSchema
    })(data, 'laws.json#catalog', '');
    catalog(data.catalog, 'laws.json', LAW_IDS, lawSchema);
    return data as unknown as LawCatalog;
}
export function validateResearch(json: unknown): RESEARCH_TOPICSData {
    if (!Array.isArray(json) || json.length !== 3)
        fail('research.json#catalog', 'entries', 'expected array of length 3');
    const ids = [
        'deep-mining', 'watch-patrols', 'barracks-drill'
    ] as const;
    const entries = json as unknown[];
    for (const [i, entry] of entries.entries()) {
        const data = record(entry, 'research.json#catalog', String(i));
        object({
            id: literal(ids[i])
        })(data, `research.json#${String(data.id)}`, '');
    }
    return entries.map(entry => (entry as {
        id: string;
    }).id) as unknown as RESEARCH_TOPICSData;
}
export function validateOutsidePlots(json: unknown): OUTSIDE_PLOTSData {
    if (!Array.isArray(json) || json.length !== PLOT_IDS.length)
        fail('outside-plots.json#catalog', 'entries', `expected array of length ${PLOT_IDS.length}`);
    for (const [i, entry] of (json as unknown[]).entries()) {
        const data = record(entry, 'outside-plots.json#catalog', String(i));
        object({
            id: literal(PLOT_IDS[i]), terrain: oneOf('fertile', 'pasture', 'meadow', 'forest', 'ore', 'rock', 'plain'), ring: oneOf(1, 2, 3)
        })(data, `outside-plots.json#${String(data.id)}`, '');
    }
    return json as OUTSIDE_PLOTSData;
}
export function validateTuning(json: unknown): TuningCatalog {
    const data = record(json, 'tuning.json#catalog', 'entries');
    for (const id of Object.keys(data))
        if (!Object.hasOwn(tuningSchemas, id))
            fail(`tuning.json#${id}`, 'id', 'unknown id');
    for (const [id, rule] of Object.entries(tuningSchemas))
        rule(data[id], `tuning.json#${id}`, '');
    return data as unknown as TuningCatalog;
}

export function validateItems(json: unknown): {definitions:Record<string,ItemDefinition>;ITEM_TRIAL:ItemTrial} {
    const root = record(json, 'items.json#catalog', 'entries');
    object({definitions:()=>{},ITEM_TRIAL:()=>{}})(root,'items.json#catalog','');
    const definitions = record(root.definitions,'items.json#catalog','definitions');
    if (!Object.keys(definitions).length) fail('items.json#catalog','definitions','expected nonempty object');
    const rarity: Rule = (v,r,f) => { if(!['common','rare','epic','legendary'].includes(v as string)) fail(r,f,'expected one of common|rare|epic|legendary'); };
    const skill = oneOf('management','technical','medical','combat','negotiation');
    for (const [id,value] of Object.entries(definitions)) {
        const ref = `items.json#${id}`;
        if(!/^[a-z][a-z0-9-]*$/.test(id))fail(ref,'id','expected stable lowercase id');
        const d=record(value,ref,'definition');
        object({name:text,category:oneOf('material','equipment','accessory','outfit','consumable'),rarity,
            kind:optional(oneOf('player','npc')),slot:optional(text),mainStat:optional(skill),secondaryStat:optional(skill),
            regen:optional(nonnegative),exclusiveClass:optional(text),trait:optional(text),basePriceMilli:nonnegative,
            building:optional(list(oneOf('mine','quarry','logging','weaver','sheep-pasture','herb-garden')))})(d,ref,'');
        const wearable=['equipment','accessory','outfit'].includes(d.category as string);
        if(wearable){
            oneOf('player','npc')(d.kind,ref,'kind'); skill(d.mainStat,ref,'mainStat');
            const slots=d.category==='equipment'?['weapon']:d.category==='accessory'?['earrings','necklace','ring','hand']:['top','bottom','shoes','set'];
            oneOf(...slots)(d.slot,ref,'slot');
            if(d.rarity!=='common')skill(d.secondaryStat,ref,'secondaryStat');
            if(d.kind==='npc'&&d.regen!==undefined)fail(ref,'regen','Player only');
            if(d.kind==='player')nonnegative(d.regen,ref,'regen');
            if(d.rarity==='legendary')text(d.trait,ref,'trait');
            if(d.building!==undefined)fail(ref,'building','material only');
        } else {
            for(const key of ['kind','slot','mainStat','secondaryStat','regen','exclusiveClass','trait'])if(d[key]!==undefined)fail(ref,key,'wearable only');
            if(d.category==='material')list(oneOf('mine','quarry','logging','weaver','sheep-pasture','herb-garden'))(d.building,ref,'building');
            else if(d.building!==undefined)fail(ref,'building','material only');
        }
    }
    const rarities = (rule:Rule)=>object({common:rule,rare:rule,epic:rule,legendary:rule});
    const sale = (rule:Rule)=>object({common:rule,rare:rule,epic:rule});
    const potions=object({'1':positive,'2':positive,'3':positive});
    const bps:Rule=(v,r,f)=>{nonnegative(v,r,f);if((v as number)>10000)fail(r,f,'expected <= 10000');};
    object({marker:literal('TRIAL'),bonuses:rarities(object({main:positive,secondary:nonnegative,regen:positive})),
        setMultiplier:positive,marketCounts:sale(positive),marketPricesMilli:sale(positive),resaleBps:bps,
        potionPricesMilli:potions,potionHeal:potions,findOddsBps:sale(bps),materialOddsBps:rarities(bps),
        stackCap:positive,inventoryCap:positive,consumableCap:positive,storageCap:positive,storageWeeks:positive,
        effects:object(Object.fromEntries(['threshold','outputStep','outputPercent','outputCapPercent','securityStep','securityCap','authorityStep','marketStep','marketCapPercent','fatalStep','fatalCap','woundStep','woundFloor','wardenSecurity','crownAuthority','ironhideWoundReduction','ledgerOutputPercent'].map(k=>[k,positive])))})(root.ITEM_TRIAL,'items.json#ITEM_TRIAL','');
    return root as unknown as {definitions:Record<string,ItemDefinition>;ITEM_TRIAL:ItemTrial};
}
