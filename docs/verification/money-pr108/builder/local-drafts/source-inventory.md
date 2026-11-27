# Exact source inventory

Detached 0b2b3a6. Paths and line numbers refer to that checkout. The exact old and proposed source for each hunk follows. Full file bytes, SHA-256, line endings and EOF are in the byte inventories.

## packages/core/src/__tests__/catalog-data.test.ts

Enumerate the eight fields in the existing strict tuning expectation and keep recursive freeze checking the export.

Proposed 10,577 bytes. Ending CRLF.

packages/core/src/__tests__/catalog-data.test.ts:31 (insert; next original line for inserts)

Before

```
```

After

```
        robberySafeBaseMilli: PURSE_TRIAL.robberySafeBaseMilli,
        robberySafePerSecurityMilli: PURSE_TRIAL.robberySafePerSecurityMilli,
        robberyChanceBpsPerGold: PURSE_TRIAL.robberyChanceBpsPerGold,
        robberyChanceCapBps: PURSE_TRIAL.robberyChanceCapBps,
        robberyRansomBps: PURSE_TRIAL.robberyRansomBps,
        robberyLossBps: PURSE_TRIAL.robberyLossBps,
        robberyChaseSecurityMin: PURSE_TRIAL.robberyChaseSecurityMin,
        robberyChaseSuccessBpsPerSecurity: PURSE_TRIAL.robberyChaseSuccessBpsPerSecurity,
```

## packages/core/src/__tests__/purse-tuning.test.ts

Extend the exact key order in the existing PURSE_TRIAL export test.

Proposed 1,508 bytes. Ending LF.

packages/core/src/__tests__/purse-tuning.test.ts:10 (insert; next original line for inserts)

Before

```
```

After

```
    'robberySafeBaseMilli', 'robberySafePerSecurityMilli', 'robberyChanceBpsPerGold', 'robberyChanceCapBps',
    'robberyRansomBps', 'robberyLossBps', 'robberyChaseSecurityMin', 'robberyChaseSuccessBpsPerSecurity',
```

## packages/core/src/character/purse.ts

Share safe exposure, exact loss, and deterministic salted draws.

Proposed 2,666 bytes. Ending LF.

packages/core/src/character/purse.ts:4 (insert; next original line for inserts)

Before

```
```

After

```

import { mixSeed } from '../trial/crime.js';
import { createSeededRandom } from '../world/random.js';
```

packages/core/src/character/purse.ts:24 (insert; next original line for inserts)

Before

```
```

After

```

export type HomeRobberyOption = 'pay' | 'chase' | 'let-go';

const homeRobberySalts = { 'home-robbery': 0x48524f42, 'home-robbery-chase': 0x48524348 } as const;

export function homeRobberyRoll(seed: number, week: number, stream: keyof typeof homeRobberySalts): number {
  return createSeededRandom(mixSeed(mixSeed(seed, week), homeRobberySalts[stream]))() * 10000;
}

export function safeAmountMilli(security: number): number {
  return PURSE_TRIAL.robberySafeBaseMilli + security * PURSE_TRIAL.robberySafePerSecurityMilli;
}

export function homeRobberyChanceBps(excessMilli: number): number {
  if (excessMilli <= 0) return 0;
  const { robberyChanceBpsPerGold: rate, robberyChanceCapBps: cap } = PURSE_TRIAL;
  if (excessMilli >= Math.ceil(cap * 1000 / rate)) return cap;
  return Math.floor(excessMilli * rate / 1000);
}

export function homeRobberyChaseChanceBps(security: number): number {
  return Math.min(10000, security * PURSE_TRIAL.robberyChaseSuccessBpsPerSecurity);
}

export function homeRobberyLossMilli(
  excessMilli: number, moneyMilli: number, security: number, option: 'pay' | 'let-go',
): number {
  const rate = option === 'pay' ? PURSE_TRIAL.robberyRansomBps : PURSE_TRIAL.robberyLossBps;
  return Math.min(applyDifficulty(excessMilli, rate), Math.max(0, moneyMilli - safeAmountMilli(security)));
}
```

## packages/core/src/data/tuning.json

Ship eight candidate TRIAL values.

Proposed 15,178 bytes. Ending CRLF.

packages/core/src/data/tuning.json:193 (replace; next original line for inserts)

Before

```
    "donateSatisfactionCapPerWeek": 2
```

After

```
    "donateSatisfactionCapPerWeek": 2,
    "robberySafeBaseMilli": 15000,
    "robberySafePerSecurityMilli": 250,
    "robberyChanceBpsPerGold": 120,
    "robberyChanceCapBps": 2500,
    "robberyRansomBps": 2500,
    "robberyLossBps": 6000,
    "robberyChaseSecurityMin": 15,
    "robberyChaseSuccessBpsPerSecurity": 250
```

## packages/core/src/data/validate.ts

Declare and validate new tuning keys, the maximum safe balance, and strict ransom ordering.

Proposed 67,245 bytes. Ending CRLF.

packages/core/src/data/validate.ts:431 (insert; next original line for inserts)

Before

```
```

After

```
        robberySafeBaseMilli: number;
        robberySafePerSecurityMilli: number;
        robberyChanceBpsPerGold: number;
        robberyChanceCapBps: number;
        robberyRansomBps: number;
        robberyLossBps: number;
        robberyChaseSecurityMin: number;
        robberyChaseSuccessBpsPerSecurity: number;
```

packages/core/src/data/validate.ts:602 (insert; next original line for inserts)

Before

```
```

After

```
        robberySafeBaseMilli: nonnegative,
        robberySafePerSecurityMilli: nonnegative,
        robberyChanceBpsPerGold: integerInRange(1, 10000),
        robberyChanceCapBps: integerInRange(1, 10000),
        robberyRansomBps: integerInRange(0, 10000),
        robberyLossBps: integerInRange(1, 10000),
        robberyChaseSecurityMin: integerInRange(0, 100),
        robberyChaseSuccessBpsPerSecurity: integerInRange(1, 10000),
```

packages/core/src/data/validate.ts:880 (insert; next original line for inserts)

Before

```
```

After

```
    const purse = tuning.PURSE_TRIAL;
    if (!Number.isSafeInteger(purse.robberySafeBaseMilli + 100 * purse.robberySafePerSecurityMilli))
        fail('tuning.json#PURSE_TRIAL', 'robberySafePerSecurityMilli', 'expected a safe integer amount at Security 100');
    if (purse.robberyRansomBps >= purse.robberyLossBps)
        fail('tuning.json#PURSE_TRIAL', 'robberyRansomBps', 'expected less than robberyLossBps');
```

## packages/core/src/index.ts

Expose shared purse math and option type through the package API.

Proposed 1,845 bytes. Ending CRLF.

packages/core/src/index.ts:24 (replace; next original line for inserts)

Before

```
export { levySatisfactionCost, levyDueMilli, donationGoldMilli } from "./character/purse.js";
```

After

```
export {
  levySatisfactionCost, levyDueMilli, donationGoldMilli, safeAmountMilli, homeRobberyChanceBps,
  homeRobberyRoll, homeRobberyChaseChanceBps, homeRobberyLossMilli, type HomeRobberyOption,
} from "./character/purse.js";
```

## packages/core/src/trial/types.ts

Add report-only result union inside the purse to preserve no-hit report shapes.

Proposed 6,517 bytes. Ending CRLF.

packages/core/src/trial/types.ts:43 (insert; next original line for inserts)

Before

```
```

After

```
export type HomeRobberyReport =
  | { outcome: 'pending'; excessMilli: number }
  | { outcome: 'pay' | 'chase-success' | 'chase-failure' | 'let-go'; excessMilli: number; lossMilli: number };
export type HomeRobberyResolution = Exclude<HomeRobberyReport, { outcome: 'pending' }> & { week: number };

```

packages/core/src/trial/types.ts:44 (insert; next original line for inserts)

Before

```
```

After

```
  robbery?: Readonly<HomeRobberyReport>;
```

## packages/simulation/src/__tests__/lord-health.test.ts

Keep the closed-city command enumeration exhaustive.

Proposed 7,599 bytes. Ending CRLF.

packages/simulation/src/__tests__/lord-health.test.ts:74 (replace; next original line for inserts)

Before

```
  for (const type of ['BUILD','REPLACE','UPGRADE','SET_WORKERS','SET_ENABLED','END_WEEK','NEXT_WEEK','ENACT_LAW','REPEAL_LAW','CHOOSE_CARD_OPTION','ASSIGN_NPC','UNASSIGN_NPC','MOVE_NPC_HOME','BUY_NPC','BID_NPC','WITHDRAW_BID','SELL_NPC','RELEASE_NPC','ANSWER_NOTICE','EXTEND_WALL','SET_TRAINING','CLEAR','SET_RESEARCH','BUILD_DEEP_SHAFT','SET_LEVY','DONATE_MONEY',...ITEM_COMMAND_TYPES]) {
```

After

```
  for (const type of ['BUILD','REPLACE','UPGRADE','SET_WORKERS','SET_ENABLED','END_WEEK','NEXT_WEEK','ENACT_LAW','REPEAL_LAW','CHOOSE_CARD_OPTION','ASSIGN_NPC','UNASSIGN_NPC','MOVE_NPC_HOME','BUY_NPC','BID_NPC','WITHDRAW_BID','SELL_NPC','RELEASE_NPC','ANSWER_NOTICE','EXTEND_WALL','SET_TRAINING','CLEAR','SET_RESEARCH','BUILD_DEEP_SHAFT','SET_LEVY','DONATE_MONEY','ANSWER_ROBBERY',...ITEM_COMMAND_TYPES]) {
```

## packages/simulation/src/character-life-command.ts

Join the End Week lock at the Player-aware boundary and use the reserved opportunity after levy.

Proposed 9,589 bytes. Ending CRLF.

packages/simulation/src/character-life-command.ts:1 (replace; next original line for inserts)

Before

```
import { hasWeeklyKeys, isLiveCharacterLifeSessionState, buildItemWeekContext, emptyHouseholdReport, levySatisfactionCost, donationGoldMilli, type CharacterLifeSessionState, type TileTrialReport } from '@haven/core';
```

After

```
import { hasWeeklyKeys, isLiveCharacterLifeSessionState, buildItemWeekContext, emptyHouseholdReport, levySatisfactionCost, donationGoldMilli, type CharacterLifeSessionState, type HomeRobberyResolution, type TileTrialReport } from '@haven/core';
```

packages/simulation/src/character-life-command.ts:8 (replace; next original line for inserts)

Before

```
import { runLevyWeek } from './purse-week.js';
```

After

```
import { runHomeRobberyCheck, runLevyWeek } from './purse-week.js';
```

packages/simulation/src/character-life-command.ts:15 (replace; next original line for inserts)

Before

```
  | { success: true; next: CharacterLifeSessionState; report?: Readonly<TileTrialReport> }
```

After

```
  | { success: true; next: CharacterLifeSessionState; report?: Readonly<TileTrialReport>; robberyResolution?: Readonly<HomeRobberyResolution> }
```

packages/simulation/src/character-life-command.ts:51 (insert; next original line for inserts)

Before

```
```

After

```
  if (type === 'END_WEEK' && session.player.purse.robbery && Object.getOwnPropertyDescriptor(raw as object, 'expectedRevision')?.value === session.city.revision) {
    return fail('CARD_PENDING', session.city.society?.pendingCard ? 'Answer the crisis first.' : 'Answer the robbery first.');
  }
```

packages/simulation/src/character-life-command.ts:53 (replace; next original line for inserts)

Before

```
    const wages = type === 'END_WEEK' && session.city.phase === 'planning' && !session.city.society?.pendingCard
```

After

```
    const wages = type === 'END_WEEK' && session.city.phase === 'planning' && !session.city.society?.pendingCard && !session.player.purse.robbery
```

packages/simulation/src/character-life-command.ts:112 (replace; next original line for inserts)

Before

```
      // M3 inserts the home robbery check here, before the weekly donation reset.
```

After

```
      const robbery = runHomeRobberyCheck(next, report.week);
```

packages/simulation/src/character-life-command.ts:116 (replace; next original line for inserts)

Before

```
      report = Object.freeze({ ...report, after, purse });
```

After

```
      report = Object.freeze({ ...report, after, purse: robbery ? Object.freeze({ ...purse, robbery }) : purse });
```

## packages/simulation/src/character-life-observation.ts

Advertise only phase- and card-eligible actions and disable End Week while either card remains.

Proposed 9,686 bytes. Ending CRLF.

packages/simulation/src/character-life-observation.ts:104 (insert; next original line for inserts)

Before

```
```

After

```
  const crisis = city.society?.pendingCard;
  const robbery = session.player.purse.robbery;
  if (crisis || robbery) disabledReasons.push(crisis ? 'Answer the crisis first.' : 'Answer the robbery first.');
```

packages/simulation/src/character-life-observation.ts:110 (replace; next original line for inserts)

Before

```
    actionTypes: city.phase === 'report' ? ['NEXT_WEEK']
      : ['BUILD', 'REPLACE', 'UPGRADE', 'SET_WORKERS', 'SET_ENABLED', 'END_WEEK', 'ASSIGN_NPC', 'UNASSIGN_NPC',
        ...(city.society ? ['EXTEND_WALL', 'SET_TRAINING', ...PURSE_COMMAND_TYPES] as const : []),
```

After

```
    actionTypes: city.phase === 'report'
      ? ['NEXT_WEEK', ...(crisis ? ['CHOOSE_CARD_OPTION'] as const : [])]
      : ['BUILD', 'REPLACE', 'UPGRADE', 'SET_WORKERS', 'SET_ENABLED',
        ...(crisis || robbery ? [] : ['END_WEEK'] as const), 'ASSIGN_NPC', 'UNASSIGN_NPC',
        ...(city.society ? ['EXTEND_WALL', 'SET_TRAINING', ...PURSE_COMMAND_TYPES.filter(type =>
          type !== 'ANSWER_ROBBERY' || (robbery && !crisis))] as const : []),
        ...(crisis ? ['CHOOSE_CARD_OPTION'] as const : []),
```

## packages/simulation/src/purse-command.ts

Route and validate the exact answer shape; debit Money, clear card, increment revision, and return an unsaved outcome.

Proposed 4,122 bytes. Ending LF.

packages/simulation/src/purse-command.ts:2 (replace; next original line for inserts)

Before

```
  donationGoldMilli, hasWeeklyKeys, isLiveCharacterLifeSessionState, PURSE_TRIAL,
  type CharacterLifeSessionState,
```

After

```
  donationGoldMilli, hasWeeklyKeys, homeRobberyChaseChanceBps, homeRobberyLossMilli, homeRobberyRoll,
  isLiveCharacterLifeSessionState, PURSE_TRIAL, type CharacterLifeSessionState, type HomeRobberyResolution,
```

packages/simulation/src/purse-command.ts:7 (replace; next original line for inserts)

Before

```
export const PURSE_COMMAND_TYPES = ['SET_LEVY', 'DONATE_MONEY'] as const;
```

After

```
export const PURSE_COMMAND_TYPES = ['SET_LEVY', 'DONATE_MONEY', 'ANSWER_ROBBERY'] as const;
```

packages/simulation/src/purse-command.ts:10 (replace; next original line for inserts)

Before

```
const fields: Record<PurseCommandType, string> = { SET_LEVY: 'percent', DONATE_MONEY: 'amountMilli' };
```

After

```
const fields: Record<PurseCommandType, string> = { SET_LEVY: 'percent', DONATE_MONEY: 'amountMilli', ANSWER_ROBBERY: 'option' };
```

packages/simulation/src/purse-command.ts:18 (replace; next original line for inserts)

Before

```
    return fail('FORBIDDEN', 'Plan next week before changing the purse.');
```

After

```
    return type === 'ANSWER_ROBBERY'
      ? fail('FORBIDDEN', 'Choose Plan next week to answer.')
      : fail('FORBIDDEN', 'Plan next week before changing the purse.');
```

packages/simulation/src/purse-command.ts:26 (replace; next original line for inserts)

Before

```
  if (type === 'SET_LEVY') {
```

After

```
  let robberyResolution: Readonly<HomeRobberyResolution> | undefined;
  if (type === 'ANSWER_ROBBERY') {
    const { option } = raw;
    if (option !== 'pay' && option !== 'chase' && option !== 'let-go')
      return fail('UNKNOWN_OPTION', 'Choose Pay, Chase or Let go.');
    const card = purse.robbery;
    if (!card) return fail('UNKNOWN_CARD', 'No home robbery is pending.');
    const { society, world } = next.city;
    if (society!.pendingCard) return fail('CARD_PENDING', 'Answer the crisis first.');
    const { security } = society!.order;
    if (option === 'chase' && security < PURSE_TRIAL.robberyChaseSecurityMin)
      return fail('CHASE_UNAVAILABLE', 'Needs Security ' + PURSE_TRIAL.robberyChaseSecurityMin + '.');
    const chased = option === 'chase' &&
      homeRobberyRoll(world.worldMetadata.worldSeed, card.week, 'home-robbery-chase') < homeRobberyChaseChanceBps(security);
    const lossMilli = chased ? 0 :
      homeRobberyLossMilli(card.excessMilli, purse.moneyMilli, security, option === 'pay' ? 'pay' : 'let-go');
    purse.moneyMilli -= lossMilli;
    purse.robbery = null;
    robberyResolution = Object.freeze({
      week: card.week, excessMilli: card.excessMilli, lossMilli,
      outcome: option === 'chase' ? (chased ? 'chase-success' : 'chase-failure') : option,
    });
  } else if (type === 'SET_LEVY') {
```

packages/simulation/src/purse-command.ts:48 (replace; next original line for inserts)

Before

```
  return { success: true, next };
```

After

```
  return { success: true, next, ...(robberyResolution ? { robberyResolution } : {}) };
```

## packages/simulation/src/purse-week.ts

Check post-levy exposure on the isolated draft and report a hit only.

Proposed 1,872 bytes. Ending LF.

packages/simulation/src/purse-week.ts:2 (replace; next original line for inserts)

Before

```
  applyDifficulty, difficultyProfile, donationGoldMilli, levyDueMilli, type CharacterLifeSessionState, type PurseWeekReport,
```

After

```
  applyDifficulty, difficultyProfile, donationGoldMilli, levyDueMilli, homeRobberyChanceBps, homeRobberyRoll, safeAmountMilli,
  type CharacterLifeSessionState, type HomeRobberyReport, type PurseWeekReport,
```

packages/simulation/src/purse-week.ts:22 (insert; next original line for inserts)

Before

```
```

After

```

export function runHomeRobberyCheck(session: CharacterLifeSessionState, week: number): Readonly<HomeRobberyReport> | undefined {
  const { world, society } = session.city;
  const purse = session.player.purse;
  if (society!.crisis.stage === 'fallen') return;
  const excessMilli = purse.moneyMilli - safeAmountMilli(society!.order.security);
  if (excessMilli <= 0) return;
  const chanceBps = homeRobberyChanceBps(excessMilli);
  if (chanceBps === 0 || homeRobberyRoll(world.worldMetadata.worldSeed, week, 'home-robbery') >= chanceBps) return;
  purse.robbery = { id: 'home-robbery-w' + week, week, excessMilli };
  return Object.freeze({ outcome: 'pending', excessMilli });
}
```

## packages/ui/src/CharacterLifeShell.svelte

Share crisis-first mounting between Report and Information, and lock the top-bar button.

Proposed 19,726 bytes. Ending CRLF.

packages/ui/src/CharacterLifeShell.svelte:4 (replace; next original line for inserts)

Before

```
  import { type CharacterLifeSessionState, type TileTrialState, type TileTrialReport } from '@haven/core';
```

After

```
  import { type CharacterLifeSessionState, type TileTrialState, type TileTrialReport, type HomeRobberyOption } from '@haven/core';
```

packages/ui/src/CharacterLifeShell.svelte:7 (insert; next original line for inserts)

Before

```
```

After

```
  import HomeRobberyCard from './HomeRobberyCard.svelte';
```

packages/ui/src/CharacterLifeShell.svelte:24 (insert; next original line for inserts)

Before

```
```

After

```
  export let onanswerrobbery: (option: HomeRobberyOption) => void;
```

packages/ui/src/CharacterLifeShell.svelte:68 (insert; next original line for inserts)

Before

```
```

After

```
  $: robbery = storageSession.player.purse.robbery;
  $: endWeekReason = state.society?.pendingCard ? 'Answer the crisis first.' : robbery ? 'Answer the robbery first.' : '';

  async function chooseCrisis(cardId: string, option: import('@haven/core').CardOption) {
    onchoose(cardId, option);
    if (robbery) {
      await tick();
      if (!state.society?.pendingCard) document.getElementById('home-robbery-title')?.focus();
    }
  }
```

packages/ui/src/CharacterLifeShell.svelte:76 (insert; next original line for inserts)

Before

```
```

After

```

{#snippet urgentLetter()}
  <CrisisCard {state} onchoose={chooseCrisis} />
  {#if !state.society?.pendingCard && robbery}
    <HomeRobberyCard purse={storageSession.player.purse} security={state.society!.order.security} {locked} onanswer={onanswerrobbery} />
  {/if}
{/snippet}
```

packages/ui/src/CharacterLifeShell.svelte:88 (replace; next original line for inserts)

Before

```
    <button class="ledger-wax" data-testid="life-end-week" disabled={!!state.society?.pendingCard} aria-disabled={locked || !!state.society?.pendingCard} onmousedown={event => { if (locked) event.preventDefault(); }} onclick={event => { endWeekClickTime = event.timeStamp; onendweek(event.currentTarget); }}>{state.society?.pendingCard ? 'Answer the crisis first.' : locked ? 'Report open — Plan next week in Report' : 'End Week'}</button>
```

After

```
    <button class="ledger-wax" data-testid="life-end-week" disabled={!!endWeekReason} aria-disabled={locked || !!endWeekReason} onmousedown={event => { if (locked) event.preventDefault(); }} onclick={event => { endWeekClickTime = event.timeStamp; onendweek(event.currentTarget); }}>{endWeekReason || (locked ? 'Report open — Plan next week in Report' : 'End Week')}</button>
```

packages/ui/src/CharacterLifeShell.svelte:133 (replace; next original line for inserts)

Before

```
          {#if destination === 'reports' && activeWindow !== 'information'}<CrisisCard {state} {onchoose} />{/if}
```

After

```
          {#if destination === 'reports' && activeWindow !== 'information'}{@render urgentLetter()}{/if}
```

packages/ui/src/CharacterLifeShell.svelte:160 (replace; next original line for inserts)

Before

```
    {#if activeWindow === 'information'}<CrisisCard {state} {onchoose} />{/if}
```

After

```
    {#if activeWindow === 'information'}{@render urgentLetter()}{/if}
```

packages/ui/src/CharacterLifeShell.svelte:164 (replace; next original line for inserts)

Before

```
        <PursePanel purse={storageSession.player.purse} difficulty={state.society!.difficulty} {locked} oncommand={onpurse} />
```

After

```
        <PursePanel purse={storageSession.player.purse} difficulty={state.society!.difficulty} security={state.society!.order.security} {locked} oncommand={onpurse} />
```

## packages/ui/src/PursePanel.svelte

Replace the M2 placeholders with shared Money formatting.

Proposed 3,317 bytes. Ending LF.

packages/ui/src/PursePanel.svelte:4 (replace; next original line for inserts)

Before

```
  import { purseControls } from './purse-view.js';
```

After

```
  import { purseControls, purseRisk } from './purse-view.js';
```

packages/ui/src/PursePanel.svelte:8 (insert; next original line for inserts)

Before

```
```

After

```
  export let security: number;
```

packages/ui/src/PursePanel.svelte:13 (insert; next original line for inserts)

Before

```
```

After

```
  $: risk = purseRisk(purse.moneyMilli, security);
```

packages/ui/src/PursePanel.svelte:39 (replace; next original line for inserts)

Before

```
  <p>Safe amount — · At risk —</p>
```

After

```
  <p data-testid="purse-risk">Safe amount {formatMilli(risk.safeMilli)} Money · At risk {formatMilli(risk.atRiskMilli)} Money</p>
```

## packages/ui/src/TileManagement.svelte

Guard the actual handler, handle chase refusals, and retain the resolution on the matching report or announce it after load.

Proposed 21,664 bytes. Ending CRLF.

packages/ui/src/TileManagement.svelte:11 (insert; next original line for inserts)

Before

```
```

After

```
  import { homeRobberyReportText } from './report-letters.js';
```

packages/ui/src/TileManagement.svelte:81 (replace; next original line for inserts)

Before

```
      const known = ['INVALID_COMMAND', 'STALE_COMMAND', 'FORBIDDEN', 'UNSUPPORTED_RULESET', 'INVALID_STATE', 'INVALID_WORKFORCE', 'INVALID_PLAN', 'EXECUTION_ERROR', 'WEEK_MISMATCH', 'INVALID_TILE', 'INVALID_BUILDING', 'INVALID_PLACEMENT', 'OCCUPIED', 'EMPTY_TILE', 'MAX_LEVEL', 'INSUFFICIENT_RESOURCES', 'LOCKED_PLOT', 'NOT_AVAILABLE', 'WRONG_TIER', 'WALL_COMPLETE', 'PREREQUISITE_MISSING', 'UNSUPPORTED_ACTION', 'CARD_PENDING', 'CITY_FALLEN', 'UNKNOWN_CARD', 'UNKNOWN_OPTION', 'OPTION_UNAVAILABLE', 'SLOT_MISMATCH', 'KIND_MISMATCH', 'NOT_ENOUGH_GOLD', 'NOT_ENOUGH_MONEY', 'INVALID_AMOUNT', 'INVENTORY_FULL', 'NO_SHOP', 'ITEM_UNKNOWN', 'NOT_SELLABLE', 'RECIPE_UNKNOWN', 'NO_WORKSHOP', 'MISSING_INPUT', 'QUEUE_FULL', 'ORDER_UNKNOWN', 'WORKSHOP_BUSY', 'FIXED_BUILDING', 'HOME_OCCUPIED', 'ONE_PER_CITY', 'HALL_LIMIT', 'UNKNOWN_NPC', 'NO_BED', 'NOT_A_HOME', 'NO_BUILDING', 'OFFER_GONE', 'NPC_CAP', 'NOT_A_SLAVE', 'STORAGE_FULL', 'NOTICE_MISSING', 'NOTICE_CHOICE'];
```

After

```
      const known = ['INVALID_COMMAND', 'STALE_COMMAND', 'FORBIDDEN', 'UNSUPPORTED_RULESET', 'INVALID_STATE', 'INVALID_WORKFORCE', 'INVALID_PLAN', 'EXECUTION_ERROR', 'WEEK_MISMATCH', 'INVALID_TILE', 'INVALID_BUILDING', 'INVALID_PLACEMENT', 'OCCUPIED', 'EMPTY_TILE', 'MAX_LEVEL', 'INSUFFICIENT_RESOURCES', 'LOCKED_PLOT', 'NOT_AVAILABLE', 'WRONG_TIER', 'WALL_COMPLETE', 'PREREQUISITE_MISSING', 'UNSUPPORTED_ACTION', 'CARD_PENDING', 'CITY_FALLEN', 'UNKNOWN_CARD', 'UNKNOWN_OPTION', 'OPTION_UNAVAILABLE', 'SLOT_MISMATCH', 'KIND_MISMATCH', 'NOT_ENOUGH_GOLD', 'NOT_ENOUGH_MONEY', 'INVALID_AMOUNT', 'INVENTORY_FULL', 'NO_SHOP', 'ITEM_UNKNOWN', 'NOT_SELLABLE', 'RECIPE_UNKNOWN', 'NO_WORKSHOP', 'MISSING_INPUT', 'QUEUE_FULL', 'ORDER_UNKNOWN', 'WORKSHOP_BUSY', 'FIXED_BUILDING', 'HOME_OCCUPIED', 'ONE_PER_CITY', 'HALL_LIMIT', 'UNKNOWN_NPC', 'NO_BED', 'NOT_A_HOME', 'NO_BUILDING', 'OFFER_GONE', 'NPC_CAP', 'NOT_A_SLAVE', 'STORAGE_FULL', 'NOTICE_MISSING', 'NOTICE_CHOICE', 'CHASE_UNAVAILABLE'];
```

packages/ui/src/TileManagement.svelte:99 (insert; next original line for inserts)

Before

```
```

After

```
    if (result.robberyResolution) {
      const { week, ...robbery } = result.robberyResolution;
      if (report?.purse?.robbery?.outcome === 'pending' && report.week === week) {
        report = Object.freeze({ ...report, purse: Object.freeze({ ...report.purse, robbery: Object.freeze(robbery) }) });
      }
      lifeStatus = 'Robbery · ' + homeRobberyReportText(robbery);
    }
```

packages/ui/src/TileManagement.svelte:108 (replace; next original line for inserts)

Before

```
    if (state.phase !== 'planning' || state.society?.pendingCard) return;
```

After

```
    if (state.phase !== 'planning' || state.society?.pendingCard || player?.purse.robbery) return;
```

packages/ui/src/TileManagement.svelte:148 (insert; next original line for inserts)

Before

```
```

After

```
  }
  async function focusLifeReport(): Promise<void> {
    await tick();
    const id = activeWindow === 'information' ? 'life-window-heading' : 'life-reports-heading';
    document.getElementById(id)?.focus();
```

packages/ui/src/TileManagement.svelte:233 (replace; next original line for inserts)

Before

```
  <CharacterLifeShell bind:this={lifeShell} {state} {report} storageSession={{city:state,outside,npcs,player,profiles}} recoveryLine={healthLine({city:state,outside,npcs,player,profiles})} bind:destination bind:activeWindow {error} status={lifeStatus} {unapplied} onchoose={(cardId,option)=>command('CHOOSE_CARD_OPTION',{cardId,option})} onendweek={endLifeWeek} onmainmenu={mainMenu} onpurse={command}>
```

After

```
  <CharacterLifeShell bind:this={lifeShell} {state} {report} storageSession={{city:state,outside,npcs,player,profiles}} recoveryLine={healthLine({city:state,outside,npcs,player,profiles})} bind:destination bind:activeWindow {error} status={lifeStatus} {unapplied} onchoose={(cardId,option)=>command('CHOOSE_CARD_OPTION',{cardId,option})} onanswerrobbery={option => { if (command('ANSWER_ROBBERY', { option })) void focusLifeReport(); }} onendweek={endLifeWeek} onmainmenu={mainMenu} onpurse={command}>
```

## packages/ui/src/purse-view.ts

Expose exact safe/exposed amounts and the option costs using the dispatcher’s math.

Proposed 2,584 bytes. Ending LF.

packages/ui/src/purse-view.ts:1 (replace; next original line for inserts)

Before

```
import { donationGoldMilli, levySatisfactionCost, PURSE_TRIAL, type DifficultyId, type PlayerCharacter } from '@haven/core';
```

After

```
import { donationGoldMilli, levySatisfactionCost, PURSE_TRIAL, homeRobberyLossMilli, safeAmountMilli, type DifficultyId, type HomeRobberyOption, type PlayerCharacter } from '@haven/core';
```

packages/ui/src/purse-view.ts:27 (insert; next original line for inserts)

Before

```
```

After

```

export function purseRisk(moneyMilli: number, security: number) {
  const safeMilli = safeAmountMilli(security);
  return { safeMilli, atRiskMilli: Math.max(0, moneyMilli - safeMilli) };
}

export function homeRobberyOptions(purse: PlayerCharacter['purse'], security: number, locked: boolean) {
  const excess = purse.robbery?.excessMilli ?? 0;
  const pay = homeRobberyLossMilli(excess, purse.moneyMilli, security, 'pay');
  const loss = homeRobberyLossMilli(excess, purse.moneyMilli, security, 'let-go');
  const reportReason = locked ? 'Choose Plan next week to answer.' : '';
  const chaseReason = reportReason || (security < PURSE_TRIAL.robberyChaseSecurityMin
    ? 'Needs Security ' + PURSE_TRIAL.robberyChaseSecurityMin + '.' : '');
  return [
    { option: 'pay', label: 'Pay', lossMilli: pay, reason: reportReason },
    { option: 'chase', label: 'Chase', lossMilli: loss, reason: chaseReason },
    { option: 'let-go', label: 'Let go', lossMilli: loss, reason: reportReason },
  ] satisfies { option: HomeRobberyOption; label: string; lossMilli: number; reason: string }[];
}
```

## packages/ui/src/report-letters.ts

Render an optional, independently parseable Robbery report row.

Proposed 16,302 bytes. Ending CRLF.

packages/ui/src/report-letters.ts:255 (insert; next original line for inserts)

Before

```
```

After

```
import type { HomeRobberyReport } from '@haven/core';

const robberyOutcomeText = { pay: 'Paid', 'chase-success': 'Chase succeeded', 'chase-failure': 'Chase failed', 'let-go': 'Let go' } as const;
export function homeRobberyReportText(robbery: Readonly<HomeRobberyReport>): string {
  if (robbery.outcome === 'pending') return 'Awaiting answer · ' + formatMilli(robbery.excessMilli) + ' Money at risk';
  return robberyOutcomeText[robbery.outcome] + ' · ' + signedMilli(-robbery.lossMilli) + ' Money · ' +
    formatMilli(robbery.excessMilli) + ' Money at risk';
}
```

packages/ui/src/report-letters.ts:266 (insert; next original line for inserts)

Before

```
```

After

```
    ...(purse.robbery ? [{ label: 'Robbery', value: homeRobberyReportText(purse.robbery) }] : []),
```

## scripts/money-calibration.ts

Keep current routes and Gold reconciliation, measure end-of-week exposure and answer hits by a fixed pay policy.

Proposed 12,315 bytes. Ending CRLF.

scripts/money-calibration.ts:6 (replace; next original line for inserts)

Before

```
const { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, CRISIS_TRIAL, buildItemWeekContext, crisisOptions, societyPopulation } = await import('@haven/core');
```

After

```
const { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, CRISIS_TRIAL, buildItemWeekContext, crisisOptions, societyPopulation, safeAmountMilli, homeRobberyChanceBps } = await import('@haven/core');
```

scripts/money-calibration.ts:21 (insert; next original line for inserts)

Before

```
```

After

```
  security: number; safeMoneyMilli: number; robberyExcessMilli: number; robberyChanceBps: number;
  robberyHit: boolean; robberyLossMilli: number; moneyAfterAnswerMilli: number;
```

scripts/money-calibration.ts:112 (insert; next original line for inserts)

Before

```
```

After

```
    const security = report.order!.after.security;
    const safeMoneyMilli = safeAmountMilli(security);
    const robberyExcessMilli = Math.max(0, report.purse.moneyAfterMilli - safeMoneyMilli);
    const robberyHit = report.purse.robbery?.outcome === 'pending';
    let robberyLossMilli = 0;
    if (robberyHit) {
      act('NEXT_WEEK');
      act('ANSWER_ROBBERY', { option: 'pay' });
      robberyLossMilli = report.purse.moneyAfterMilli - state.player.purse.moneyMilli;
    }
```

scripts/money-calibration.ts:120 (replace; next original line for inserts)

Before

```
      moneyAfterMilli: report.purse.moneyAfterMilli, crisisStage: report.crisis?.stageAfter ?? 'unavailable',
```

After

```
      moneyAfterMilli: report.purse.moneyAfterMilli, security, safeMoneyMilli, robberyExcessMilli,
      robberyChanceBps: fallen ? 0 : homeRobberyChanceBps(robberyExcessMilli), robberyHit,
      robberyLossMilli, moneyAfterAnswerMilli: state.player.purse.moneyMilli,
      crisisStage: report.crisis?.stageAfter ?? 'unavailable',
```

scripts/money-calibration.ts:123 (replace; next original line for inserts)

Before

```
    act('NEXT_WEEK');
```

After

```
    if (!robberyHit) act('NEXT_WEEK');
```

scripts/money-calibration.ts:147 (insert; next original line for inserts)

Before

```
```

After

```
      firstAboveSafe:run.find(row=>row.robberyExcessMilli>0)?.week??null,
      robberies:run.filter(row=>row.robberyHit).length,
      robberyLossMilli:run.reduce((sum,row)=>sum+row.robberyLossMilli,0),
```

scripts/money-calibration.ts:155 (replace; next original line for inserts)

Before

```
  writeFileSync(path,JSON.stringify({schemaVersion:2,levyColumns,rows,summary},null,2)+'\n','utf8');
```

After

```
  writeFileSync(path,JSON.stringify({schemaVersion:3,levyColumns,rows,summary},null,2)+'\n','utf8');
```

## tests/e2e/character-life-navigation.helpers.ts

Check export phase through the export control and independently read exact optional Robbery row text.

Proposed 51,258 bytes. Ending CRLF.

tests/e2e/character-life-navigation.helpers.ts:158 (delete; next original line for inserts)

Before

```
  expect(await page.getByTestId('life-end-week').getAttribute('aria-disabled')).toBe('false');
```

After

```
```

tests/e2e/character-life-navigation.helpers.ts:160 (insert; next original line for inserts)

Before

```
```

After

```
  const button = page.getByRole('button', { name: 'Export checkpoint', exact: true });
  await expect(button).toBeEnabled();
```

tests/e2e/character-life-navigation.helpers.ts:161 (replace; next original line for inserts)

Before

```
  await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
```

After

```
  await button.click();
```

tests/e2e/character-life-navigation.helpers.ts:588 (replace; next original line for inserts)

Before

```
    await expect(purse.locator('dt')).toHaveText(['Levy', 'Donation', 'Money after']);
```

After

```
    const robbery = expected.purse.robbery;
    await expect(purse.locator('dt')).toHaveText(['Levy', 'Donation', 'Money after', ...(robbery ? ['Robbery'] : [])]);
```

tests/e2e/character-life-navigation.helpers.ts:594 (insert; next original line for inserts)

Before

```
```

After

```
    if (robbery) {
      const atRisk = u(robbery.excessMilli) + ' Money at risk';
      const labels = { pay: 'Paid', 'chase-success': 'Chase succeeded', 'chase-failure': 'Chase failed', 'let-go': 'Let go' };
      const row = purse.locator('dt:text-is("Robbery") + dd');
      const loss = robbery.outcome === 'pending' ? '' : robbery.lossMilli ? '−' + u(robbery.lossMilli) : '0';
      await expect(row).toHaveText(robbery.outcome === 'pending'
        ? 'Awaiting answer · ' + atRisk : labels[robbery.outcome] + ' · ' + loss + ' Money · ' + atRisk);
      const parsed = (await row.textContent())!.split(' · ');
      const excessMilli = milli(parsed.at(-1)!.replace(' Money at risk', ''));
      if (parsed[0] === 'Awaiting answer') actual.purse.robbery = { outcome: 'pending', excessMilli };
      else {
        const entry = Object.entries(labels).find(([, label]) => label === parsed[0]);
        if (!entry) throw Error('Invalid Robbery report outcome.');
        actual.purse.robbery = { outcome: entry[0] as keyof typeof labels, excessMilli,
          lossMilli: milli(parsed[1].replace(/^−/, '').replace(' Money', '')) };
      }
      expect(actual.purse.robbery).toStrictEqual(robbery);
    }
```

## tests/e2e/crafting.spec.ts

W1 seed 42 would trigger from the synthetic 1,000-Money allocation. Keep crafting-only runs funded and below safe.

Proposed 21,140 bytes. Ending CRLF.

tests/e2e/crafting.spec.ts:14 (replace; next original line for inserts)

Before

```
  s.player.purse.moneyMilli = 1000000;
```

After

```
  s.player.purse.moneyMilli = 12000;
```

## tests/e2e/items.spec.ts

Only the crowded W1 seed (2) reaches the robbery draw bound. Isolate that visual/loot fixture from home robbery.

Proposed 23,477 bytes. Ending CRLF.

tests/e2e/items.spec.ts:122 (replace; next original line for inserts)

Before

```
  if(seed===200)throw Error('No seeded item report');let s=funded(seed);s.npcs[0].character.skills.management=40;s.npcs[0].character.skills.combat=30;s=act(s,'BUILD',{tileId:'ore-1',typeId:'mine'});s=act(s,'ASSIGN_NPC',{npcId:s.npcs[0].character.id,tileId:'ore-1'});
```

After

```
  if(seed===200)throw Error('No seeded item report');let s=funded(seed);s.player.purse.moneyMilli=12000;s.npcs[0].character.skills.management=40;s.npcs[0].character.skills.combat=30;s=act(s,'BUILD',{tileId:'ore-1',typeId:'mine'});s=act(s,'ASSIGN_NPC',{npcId:s.npcs[0].character.id,tileId:'ore-1'});
```

## tests/e2e/purse.spec.ts

Pin the exact opening Security 30 preview at both desktop widths.

Proposed 8,530 bytes. Ending LF.

tests/e2e/purse.spec.ts:23 (replace; next original line for inserts)

Before

```
    await expect(purse.getByText('Safe amount — · At risk —', { exact: true })).toBeVisible();
```

After

```
    await expect(purse.getByTestId('purse-risk')).toHaveText('Safe amount 22.5 Money · At risk 0 Money');
```

## packages/core/src/character/__tests__/home-robbery-tuning.test.ts

Pin exact field-specific messages, strict ransom order, and safe-integer bounds.

Proposed 1,205 bytes. Ending LF.

New file. Full text follows.

```
import { expect, it } from 'vitest';
import tuning from '../../data/tuning.json' with { type: 'json' };
import { validateTuning } from '../../data/validate.js';

it.each([
  ['robberySafeBaseMilli', -1, 'expected integer >= 0'],
  ['robberySafePerSecurityMilli', 0.5, 'expected integer >= 0'],
  ['robberySafePerSecurityMilli', Number.MAX_SAFE_INTEGER, 'expected a safe integer amount at Security 100'],
  ['robberyChanceBpsPerGold', 0, 'expected integer in [1, 10000]'],
  ['robberyChanceCapBps', 10001, 'expected integer in [1, 10000]'],
  ['robberyRansomBps', 6000, 'expected less than robberyLossBps'],
  ['robberyLossBps', 0, 'expected integer in [1, 10000]'],
  ['robberyChaseSecurityMin', 101, 'expected integer in [0, 100]'],
  ['robberyChaseSuccessBpsPerSecurity', 10001, 'expected integer in [1, 10000]'],
] as const)('rejects %s = %s with exact catalog error', (key, value, rule) => {
  const copy = structuredClone(tuning);
  Object.assign(copy.PURSE_TRIAL, { [key]: value });
  let message: string | undefined;
  try { validateTuning(copy); }
  catch (error) { if (error instanceof Error) message = error.message; }
  expect(message).toBe('tuning.json#PURSE_TRIAL.' + key + ': ' + rule);
});
```

## packages/simulation/src/__tests__/home-robbery.test.ts

Pin per-difficulty seeded actions, strict refusals and matched boundary cases through the dispatcher.

Proposed 9,528 bytes. Ending LF.

New file. Full text follows.

```
import { expect, it } from 'vitest';
import {
  createCharacterLifeSession, CRISIS_TRIAL, DEFAULT_PLAYER_DRAFT, homeRobberyChanceBps,
  type CharacterLifeSessionState, type DifficultyId, type TileTrialReport,
} from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '@haven/persistence';
import { executeCharacterLifeCommand } from '../character-life-command.js';

function make(seed = 40, difficulty: DifficultyId = 'normal') {
  const made = createCharacterLifeSession(seed, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' }, difficulty);
  if (!made.success) throw Error(made.error.message);
  return made.value;
}
const stocks = (s: CharacterLifeSessionState) => s.city.world.settlements[s.city.world.activeSettlementId!].inventory;

function dispatch(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  return executeCharacterLifeCommand(s, { type, expectedRevision: s.city.revision, ...fields });
}
function act(s: CharacterLifeSessionState, type: string, fields: Record<string, unknown> = {}) {
  const result = dispatch(s, type, fields);
  if (!result.success) throw Error(result.error.code + ': ' + result.error.message);
  return result;
}
function close(s: CharacterLifeSessionState) {
  const closed = act(s, 'END_WEEK', { expectedWeek: s.city.world.week });
  if (!closed.report) throw Error('Expected weekly report.');
  return { ...closed, report: closed.report as Readonly<TileTrialReport> };
}
function refusal(s: CharacterLifeSessionState, code: string, message: string, type: string, fields: Record<string, unknown> = {}) {
  const before = structuredClone(s);
  expect(dispatch(s, type, fields)).toStrictEqual({ success: false, error: { code, message } });
  expect(s).toStrictEqual(before);
}
function reload(s: CharacterLifeSessionState) {
  const saved = serializeCharacterLifeSave(s);
  if (!saved.success) throw Error(saved.error.message);
  const decoded = deserializeCharacterLifeSave(saved.text);
  expect(decoded).toStrictEqual({ success: true, state: s });
  if (!decoded.success) throw Error(decoded.error.message);
  expect(serializeCharacterLifeSave(decoded.state)).toStrictEqual(saved);
  return decoded.state;
}

it('never robs at the exact post-levy safe amount against the same funded route', () => {
  const atSafe = make();
  atSafe.player.purse.moneyMilli = 19913;
  atSafe.player.purse.levyPercent = 5;
  const below = structuredClone(atSafe);
  below.player.purse.moneyMilli--;
  const control = close(below), exact = close(atSafe);
  expect(exact.next.city.society!.order.security).toBe(25);
  expect(exact.report.purse).toStrictEqual({
    levyPercent: 5, levyDueMilli: 1337, levyPaidMilli: 1337, donationsMilli: 0,
    donationGoldMilli: 0, moneyAfterMilli: 21250,
  });
  expect(exact.next.player.purse).toStrictEqual({
    moneyMilli: 21250, levyPercent: 5, donatedThisWeekMilli: 0, robbery: null,
  });
  expect(exact).toStrictEqual({
    ...control, next: { ...control.next, player: { ...control.next.player, purse: exact.next.player.purse } },
    report: { ...control.report, purse: exact.report.purse },
  });
});

it('floors fractional exposure and caps the exact basis-point calculation', () => {
  expect([homeRobberyChanceBps(0), homeRobberyChanceBps(8), homeRobberyChanceBps(9),
    homeRobberyChanceBps(20833), homeRobberyChanceBps(20834), homeRobberyChanceBps(Number.MAX_SAFE_INTEGER)])
    .toStrictEqual([0, 0, 1, 2499, 2500, 2500]);
});

it.each([
  ['normal', 51338, 30088, 7522, 18052],
  ['easy', 52855, 31605, 7901, 18963],
] as const)('keeps the %s hit and exact losses across reload', (difficulty, balance, excess, ransom, loss) => {
  for (const [seed, option, outcome, debit] of [
    [40, 'pay', 'pay', ransom],
    [40, 'chase', 'chase-failure', loss],
    [93, 'chase', 'chase-success', 0],
    [40, 'let-go', 'let-go', loss],
  ] as const) {
    const s = make(seed, difficulty);
    s.player.purse.moneyMilli = 50001;
    s.player.purse.levyPercent = 5;
    const closed = close(s);
    expect(close(reload(s))).toStrictEqual(closed);
    expect(closed.report.purse?.robbery).toStrictEqual({ outcome: 'pending', excessMilli: excess });
    expect(closed.next.player.purse.robbery).toStrictEqual({ id: 'home-robbery-w1', week: 1, excessMilli: excess });
    refusal(closed.next, 'FORBIDDEN', 'Choose Plan next week to answer.', 'ANSWER_ROBBERY', { option });
    const planning = act(closed.next, 'NEXT_WEEK').next;
    refusal(planning, 'CARD_PENDING', 'Answer the robbery first.', 'END_WEEK', { expectedWeek: 2 });
    const answer = act(planning, 'ANSWER_ROBBERY', { option });
    expect(act(reload(planning), 'ANSWER_ROBBERY', { option })).toStrictEqual(answer);
    expect(answer.robberyResolution).toStrictEqual({ week: 1, outcome, excessMilli: excess, lossMilli: debit });
    const expected = structuredClone(planning);
    expected.city.revision++;
    expected.player.purse.moneyMilli = balance - debit;
    expected.player.purse.robbery = null;
    expect(answer.next).toStrictEqual(expected);
    expect(stocks(answer.next).gold).toBe(stocks(planning).gold);
    expect(close(answer.next).report.week).toBe(2);
  }
});

it('checks Money after levy and donations and then resets the donation tally', () => {
  const s = make();
  s.player.purse.moneyMilli = 20750;
  s.player.purse.levyPercent = 5;
  const donated = act(s, 'DONATE_MONEY', { amountMilli: 1000 }).next;
  const unchanged = structuredClone(s);
  stocks(unchanged).gold += 1000;
  const control = close(unchanged);
  expect(control.report.purse?.robbery).toStrictEqual({ outcome: 'pending', excessMilli: 837 });
  const result = close(donated);
  expect(result.report.purse).toStrictEqual({
    levyPercent: 5, levyDueMilli: 1337, levyPaidMilli: 1337, donationsMilli: 1000,
    donationGoldMilli: 1000, moneyAfterMilli: 21087,
  });
  expect(result.next.player.purse).toStrictEqual({ moneyMilli: 21087, levyPercent: 5, donatedThisWeekMilli: 0, robbery: null });
  expect(stocks(result.next)).toStrictEqual(stocks(control.next));
});

it('opens both cards, preserves both across checkpoint reload, and resolves crisis first', () => {
  const s = make();
  const society = s.city.society!;
  society.crisis.stage = 'warning';
  society.crisis.hungerStreak = CRISIS_TRIAL.demandHungerWeeks - 1;
  for (const key of ['free', 'makers', 'luminaries', 'merchants', 'bound'] as const) society.satisfaction[key] = 0;
  stocks(s).food = 0;
  stocks(s).wheat = 0;
  for (const id of ['field-1', 'plain-1']) {
    const building = s.city.tiles.find(tile => tile.id === id)!.building!;
    building.workers = 0;
  }
  s.player.purse.moneyMilli = 50001;
  const week = close(s);
  expect(week.report.crisis?.cardOpened).toBe('demand');
  const planning = reload(act(week.next, 'NEXT_WEEK').next);
  const card = planning.city.society!.pendingCard;
  expect(card).toStrictEqual({ id: 'crisis-demand-w2', kind: 'demand', source: 'crisis', week: 2 });
  expect(planning.player.purse.robbery?.id).toBe('home-robbery-w1');
  refusal(planning, 'CARD_PENDING', 'Answer the crisis first.', 'END_WEEK', { expectedWeek: 2 });
  refusal(planning, 'CARD_PENDING', 'Answer the crisis first.', 'ANSWER_ROBBERY', { option: 'pay' });
  const answered = reload(act(planning, 'CHOOSE_CARD_OPTION', { cardId: card!.id, option: 'refuse' }).next);
  expect(answered.player.purse.robbery).toStrictEqual(planning.player.purse.robbery);
  refusal(answered, 'CARD_PENDING', 'Answer the robbery first.', 'END_WEEK', { expectedWeek: 2 });
  expect(act(answered, 'ANSWER_ROBBERY', { option: 'pay' }).next.player.purse.robbery).toBeNull();
});

it('rejects exact invalid command shapes and unavailable chase without mutating state', () => {
  const s = make();
  refusal(s, 'UNKNOWN_CARD', 'No home robbery is pending.', 'ANSWER_ROBBERY', { option: 'pay' });
  s.player.purse = { moneyMilli: 22500, levyPercent: 0, donatedThisWeekMilli: 0,
    robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 4000 } };
  s.city.society!.order.security = 14;
  refusal(s, 'CHASE_UNAVAILABLE', 'Needs Security 15.', 'ANSWER_ROBBERY', { option: 'chase' });
  refusal(s, 'UNKNOWN_OPTION', 'Choose Pay, Chase or Let go.', 'ANSWER_ROBBERY', { option: 'send-guard' });
  refusal(s, 'INVALID_COMMAND', 'Command must contain plain data fields.', 'ANSWER_ROBBERY');
  refusal(s, 'INVALID_COMMAND', 'Command must contain plain data fields.', 'ANSWER_ROBBERY', { option: 'pay', extra: 1 });
  refusal(s, 'STALE_COMMAND', 'The purse changed. Try again.', 'ANSWER_ROBBERY', { option: 'pay', expectedRevision: -1 });
  s.city.society!.order.security = 15;
  expect(act(s, 'ANSWER_ROBBERY', { option: 'chase' }).robberyResolution)
    .toStrictEqual({ week: 1, outcome: 'chase-failure', excessMilli: 4000, lossMilli: 2400 });
});

it('preserves the safe balance when a permitted Planning donation changes exposure', () => {
  const s = make();
  s.player.purse = { moneyMilli: 26500, levyPercent: 0, donatedThisWeekMilli: 0,
    robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 4000 } };
  const donated = act(s, 'DONATE_MONEY', { amountMilli: 3000 }).next;
  const outcome = act(donated, 'ANSWER_ROBBERY', { option: 'let-go' });
  expect(outcome.robberyResolution).toStrictEqual({ week: 1, outcome: 'let-go', excessMilli: 4000, lossMilli: 1000 });
  expect(outcome.next.player.purse).toStrictEqual({
    moneyMilli: 22500, levyPercent: 0, donatedThisWeekMilli: 3000, robbery: null,
  });
  expect(stocks(outcome.next)).toStrictEqual(stocks(donated));
});
```

## packages/ui/src/HomeRobberyCard.svelte

Render an urgent letter using native buttons, focusable disabled reasons, and the dispatcher preview.

Proposed 2,046 bytes. Ending LF.

New file. Full text follows.

```
<script lang="ts">
  import type { HomeRobberyOption, PlayerCharacter } from '@haven/core';
  import { formatMilli } from './milli-format.js';
  import { homeRobberyOptions } from './purse-view.js';

  export let purse: PlayerCharacter['purse'];
  export let security: number;
  export let locked: boolean;
  export let onanswer: (option: HomeRobberyOption) => void;

  $: options = homeRobberyOptions(purse, security, locked);
</script>

<section class="card urgent-letter" data-testid="home-robbery-card" aria-labelledby="home-robbery-title">
  <p aria-hidden="true">Urgent letter</p>
  <p class="ledger-seal urgent-seal">Answer before End Week</p>
  <div class="image-slot" aria-hidden="true"></div>
  <h3 id="home-robbery-title" tabindex="-1">Robbers at the Mansion</h3>
  {#each options as option (option.option)}
    <div>
      <button type="button" class="ledger-plaque" data-robbery-option={option.option}
        aria-disabled={!!option.reason}
        aria-describedby={'home-robbery-' + option.option + '-amount' + (option.reason ? ' home-robbery-' + option.option + '-reason' : '')}
        onclick={() => { if (!option.reason) onanswer(option.option); }}>{option.label}</button>
      <p id={'home-robbery-' + option.option + '-amount'}>
        {option.option === 'chase' ? 'Success: lose 0 Money. Failure: lose ' : 'Lose '}{formatMilli(option.lossMilli)} Money.
      </p>
      {#if option.reason}<p id={'home-robbery-' + option.option + '-reason'}>{option.reason}</p>{/if}
    </div>
  {/each}
</section>

<style>
  .urgent-letter {
    background: var(--wood-dark);
    color: var(--wax-text);
    --text-main: var(--wax-text);
    --text-muted: var(--wax-text);
    border: calc(2 * var(--px)) solid var(--wax);
    padding: 16px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .urgent-seal { display: inline-block; padding: 8px; }
  .image-slot { min-height: 120px; }
  button { font: inherit; min-height: 44px; max-width: 100%; padding: 10px; }
  p { margin: 8px 0; }
  section > div { margin-bottom: 12px; }
</style>
```

## packages/ui/src/__tests__/home-robbery-view.test.ts

Assert exact preview fields and the rendered row model.

Proposed 1,846 bytes. Ending LF.

New file. Full text follows.

```
import { expect, it } from 'vitest';
import { homeRobberyOptions, purseRisk } from '../purse-view.js';
import { purseReportRows } from '../report-letters.js';

it('shows exact exposure, option costs and chase restriction', () => {
  expect(purseRisk(22500, 30)).toStrictEqual({ safeMilli: 22500, atRiskMilli: 0 });
  expect(purseRisk(26501, 30)).toStrictEqual({ safeMilli: 22500, atRiskMilli: 4001 });
  const purse = { moneyMilli: 26501, levyPercent: 0, donatedThisWeekMilli: 0,
    robbery: { id: 'home-robbery-w1', week: 1, excessMilli: 4001 } };
  expect(homeRobberyOptions(purse, 14, false)).toStrictEqual([
    { option: 'pay', label: 'Pay', lossMilli: 1000, reason: '' },
    { option: 'chase', label: 'Chase', lossMilli: 2400, reason: 'Needs Security 15.' },
    { option: 'let-go', label: 'Let go', lossMilli: 2400, reason: '' },
  ]);
  expect(homeRobberyOptions(purse, 30, true).map(view => view.reason))
    .toStrictEqual(Array(3).fill('Choose Plan next week to answer.'));
});

it.each(['normal', 'easy'] as const)('renders the %s Robbery row independently from the levy rate', difficulty => {
  const purse = { levyPercent: 0, levyDueMilli: 0, levyPaidMilli: 0, donationsMilli: 0,
    donationGoldMilli: 0, moneyAfterMilli: 26501 };
  expect(purseReportRows({ ...purse, robbery: { outcome: 'pending', excessMilli: 4001 } }, difficulty)).toStrictEqual([
    { label: 'Levy', value: '0 Money · 0% · 0 of 0 Gold paid' },
    { label: 'Donation', value: '0 Money · 0 Gold' },
    { label: 'Money after', value: '26.501 Money' },
    { label: 'Robbery', value: 'Awaiting answer · 4.001 Money at risk' },
  ]);
  expect(purseReportRows({ ...purse, robbery: { outcome: 'pay', excessMilli: 4001, lossMilli: 1000 } }, difficulty).at(-1))
    .toStrictEqual({ label: 'Robbery', value: 'Paid · −1 Money · 4.001 Money at risk' });
});
```

## tests/e2e/home-robbery.spec.ts

Pin exact card, keyboard, report, both difficulty paths and save/load priority at desktop widths and narrow reflow.

Proposed 7,603 bytes. Ending LF.

New file. Full text follows.

```
import { expect, test, type Page } from '@playwright/test';
import { CRISIS_TRIAL, type CharacterLifeSessionState } from '@haven/core';
import { executeCharacterLifeCommand } from '@haven/simulation';
import { expectReport, exportLife, go, importLife, keyActivate, makeLife, tabTo } from './character-life-navigation.helpers.ts';

function close(s: CharacterLifeSessionState) {
  const r = executeCharacterLifeCommand(s, { type: 'END_WEEK', expectedWeek: 1, expectedRevision: s.city.revision });
  if (!r.success || !r.report) throw Error('Expected End Week report.');
  return { next: r.next, report: r.report };
}
const card = (page: Page) => page.getByRole('region', { name: 'Robbers at the Mansion', exact: true });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const row = (page: Page) => page.getByTestId('purse-report').locator('dt:text-is("Robbery") + dd');

for (const [width, difficulty, excess, ransom, loss, rest] of [
  [1280, 'normal', '30.088', '7.522', '18.052', '43.816'],
  [1600, 'easy', '31.605', '7.901', '18.963', '44.954'],
] as const) {
  test('renders and answers the ' + difficulty + ' home robbery at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const s = makeLife(40);
    s.city.society!.difficulty = difficulty;
    s.player.purse.moneyMilli = 50001;
    s.player.purse.levyPercent = 5;
    const expected = close(s);
    await page.goto('/');
    await importLife(page, s);
    await page.locator('#life-nav-player').click();
    await expect(page.getByTestId('purse-risk')).toHaveText('Safe amount 22.5 Money · At risk 27.501 Money');
    await page.keyboard.press('Escape');
    const end = page.getByTestId('life-end-week');
    await keyActivate(page, end);
    await expect(end).toBeDisabled();
    await expect(end).toHaveText('Answer the robbery first.');
    const robbery = card(page);
    await expect(robbery).toBeVisible();
    await expect(robbery.getByRole('button')).toHaveText(['Pay', 'Chase', 'Let go']);
    await expect(robbery.locator('#home-robbery-pay-amount')).toHaveText('Lose ' + ransom + ' Money.');
    await expect(robbery.locator('#home-robbery-chase-amount')).toHaveText('Success: lose 0 Money. Failure: lose ' + loss + ' Money.');
    await expect(robbery.locator('#home-robbery-let-go-amount')).toHaveText('Lose ' + loss + ' Money.');
    for (const name of ['pay', 'chase', 'let-go']) {
      const disabled = robbery.locator('[data-robbery-option="' + name + '"]');
      await expect(disabled).toHaveAttribute('aria-disabled', 'true');
      await expect(disabled).toHaveAttribute('aria-describedby', 'home-robbery-' + name + '-amount home-robbery-' + name + '-reason');
      await expect(robbery.locator('#home-robbery-' + name + '-reason')).toHaveText('Choose Plan next week to answer.');
      await disabled.press('Enter');
      await expect(row(page)).toHaveText('Awaiting answer · ' + excess + ' Money at risk');
    }
    await expectReport(page, expected.report, difficulty);
    await keyActivate(page, button(page, 'Plan next week'));
    await expect(end).toBeDisabled();
    const pay = robbery.getByRole('button', { name: 'Pay', exact: true });
    await tabTo(page, pay);
    await keyActivate(page, pay);
    await expect(robbery).toHaveCount(0);
    await expect(end).toBeEnabled();
    await expect(row(page)).toHaveText('Paid · −' + ransom + ' Money · ' + excess + ' Money at risk');
    await expect(page.getByTestId('purse-money')).toHaveText('Money ' + rest);
    await expect(page.locator('#life-reports-heading')).toBeFocused();

    const low = makeLife(40);
    low.city.society!.difficulty = difficulty;
    low.city.society!.order.security = 14;
    low.player.purse.moneyMilli = 22500;
    low.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4000 };
    await importLife(page, low);
    await go(page, 'reports');
    const chase = card(page).getByRole('button', { name: 'Chase', exact: true });
    await tabTo(page, chase);
    await expect(chase).toHaveAttribute('aria-disabled', 'true');
    await expect(chase).toHaveAttribute('aria-describedby', 'home-robbery-chase-amount home-robbery-chase-reason');
    await expect(card(page).locator('#home-robbery-chase-reason')).toHaveText('Needs Security 15.');
    await chase.press('Space');
    expect((await exportLife(page)).player.purse).toStrictEqual(low.player.purse);

    await go(page, 'reports');
    for (const narrow of [320, 375]) {
      await page.setViewportSize({ width: narrow, height: 812 });
      await expect(card(page)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await card(page).getByRole('button').evaluateAll(nodes =>
        nodes.every(node => node.getBoundingClientRect().height >= 44 && node.getBoundingClientRect().right <= innerWidth))).toBe(true);
    }
  });
}

test('shows crisis first and resumes between the two answers from IndexedDB and JSON', async ({ page }) => {
  const s = makeLife(40);
  const society = s.city.society!;
  society.crisis.stage = 'warning';
  society.crisis.hungerStreak = CRISIS_TRIAL.demandHungerWeeks - 1;
  for (const key of ['free', 'makers', 'luminaries', 'merchants', 'bound'] as const) society.satisfaction[key] = 0;
  const stock = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  stock.food = 0;
  stock.wheat = 0;
  for (const id of ['field-1', 'plain-1']) {
    const building = s.city.tiles.find(tile => tile.id === id)!.building!;
    building.workers = 0;
  }
  s.player.purse.moneyMilli = 50001;
  await page.goto('/');
  await importLife(page, s);
  await keyActivate(page, page.getByTestId('life-end-week'));
  await expect(page.getByTestId('crisis-card')).toBeVisible();
  await expect(card(page)).toHaveCount(0);
  await expect(page.getByTestId('life-end-week')).toHaveText('Answer the crisis first.');
  await keyActivate(page, button(page, 'Plan next week'));
  const both = await exportLife(page);
  expect(both.city.society!.pendingCard).toStrictEqual({ id: 'crisis-demand-w2', source: 'crisis', kind: 'demand', week: 2 });
  expect(both.player.purse.robbery?.id).toBe('home-robbery-w1');
  await button(page, 'Save locally').click();
  await expect(page.getByText('Saved in this browser.', { exact: true })).toBeVisible();
  await page.reload();
  await button(page, 'Continue').click();
  expect((await exportLife(page)).player.purse).toStrictEqual(both.player.purse);
  await go(page, 'reports');
  const refuse = page.getByTestId('crisis-card').getByRole('button', { name: 'Refuse', exact: true });
  await keyActivate(page, refuse);
  await expect(card(page).getByRole('heading')).toBeFocused();
  await expect(page.getByTestId('life-end-week')).toHaveText('Answer the robbery first.');
  const between = await exportLife(page);
  expect(between.city.society!.pendingCard).toBeNull();
  expect(between.player.purse).toStrictEqual(both.player.purse);
  await importLife(page, between);
  await go(page, 'reports');
  await expect(page.getByTestId('crisis-card')).toHaveCount(0);
  await keyActivate(page, card(page).getByRole('button', { name: 'Let go', exact: true }));
  await expect(page.getByTestId('life-shell').getByRole('status').filter({ hasText: 'Robbery · Let go · −17.25 Money · 28.751 Money at risk' })).toHaveText('Robbery · Let go · −17.25 Money · 28.751 Money at risk');
  await expect(page.getByTestId('life-end-week')).toBeEnabled();
  expect((await exportLife(page)).player.purse.robbery).toBeNull();
});
```

