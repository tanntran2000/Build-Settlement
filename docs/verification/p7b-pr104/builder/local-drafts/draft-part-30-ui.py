new(ui+'acquisition-view.ts','''import {
  acquisitionEnabled, acquisitionNpc, auctionOpeningMilli, auctionRivals, CARD_TRIAL, homeBeds, homeResidents, ITEM_TRIAL,
  npcAgeTitle, npcSellMilli, npcValueMilli, NPC_ORIGINS, P7B_TRIAL, REQUIRED_SKILLS, TRIAL_BUILDINGS,
  type AcquisitionSource, type AuctionLot, type TileTrialState, type WorldNpc,
} from '@haven/core';
import { ACQUISITION_MESSAGES, auctionTranscript } from '@haven/simulation';
import { formatMilli } from './milli-format.js';

export const goldLabel = (amount: number) => `${formatMilli(amount)} Gold`;
export const sourceLabel = (source: AcquisitionSource) => TRIAL_BUILDINGS[source].name;

export function cardFor(npc: WorldNpc, priceMilli: number) {
  const { character, life, household } = npc;
  return {
    name: character.name, age: character.age, title: npcAgeTitle(character.age),
    origin: NPC_ORIGINS[life.origin].name, source: sourceLabel(household.source),
    status: household.status === 'slave' ? 'Slave' : household.status === 'servant' ? 'Servant' : 'Lifelong servant',
    skills: REQUIRED_SKILLS.map(key => ({ label: key.charAt(0).toUpperCase() + key.slice(1), value: character.skills[key] }))
      .sort((a, b) => b.value - a.value).slice(0, CARD_TRIAL.topSkillCount),
    beauty: life.beauty, mind: life.mind, obedience: household.obedience, priceMilli,
    wageMilli: household.contract?.wageMilli,
  };
}

export function acquisitionView(city: TileTrialState, npcs: readonly WorldNpc[], source: AcquisitionSource) {
  const { world: { worldMetadata: { worldSeed: seed }, week }, society } = city;
  const state = society!.acquisition;
  const current = state.week === week && acquisitionEnabled(city, source);
  const stock = current ? state.stock.filter(offer => offer.source === source).map(offer => {
    const { npc } = acquisitionNpc(seed, week, source, offer.slot, offer.nameSalt);
    return { offer, card: cardFor(npc, npcValueMilli(npc, source, false)) };
  }) : [];
  const lot = current ? state.lots.find(entry => entry.source === source) : undefined;
  const auction = lot ? auctionView(seed, week, lot) : null;
  const homes = city.tiles.flatMap(tile => {
    const beds = homeBeds(city, tile.id);
    return beds ? [{ id: tile.id, label: `${TRIAL_BUILDINGS[tile.building!.typeId].name} (${tile.id})`,
      free: beds - homeResidents(npcs, tile.id) }] : [];
  });
  return { stock, auction, homes, goldMilli: city.world.settlements[city.world.activeSettlementId!].inventory.gold };
}

function auctionView(seed: number, week: number, lot: AuctionLot) {
  const { source, nameSalt, priceMilli } = lot;
  const { npc } = acquisitionNpc(seed, week, source, 'lot', nameSalt);
  const value = npcValueMilli(npc, source, true);
  const opening = auctionOpeningMilli(value);
  const rivals = auctionRivals(seed, week, source, value);
  const rounds = auctionTranscript(opening, lot, rivals);
  const log = rounds.flatMap(round => [
    `You bid ${goldLabel(round.playerBidMilli)}.`,
    ...round.dropped.map(index => `${rivals[index].name} drops out at ${formatMilli(round.playerBidMilli)}.`),
    round.leader === 'player' ? `You win at ${goldLabel(round.priceMilli)}.` :
      `${rivals[round.leader].name} bids ${goldLabel(round.priceMilli)}.`,
  ]);
  const leader = lot.leader === 'player' ? 'You' : lot.leader === null ? 'No bidder' : rivals[lot.leader].name;
  if (lot.status === 'lost') log.push(`You withdraw. ${leader} wins at ${goldLabel(priceMilli)}.`);
  return { card: cardFor(npc, priceMilli), lot, opening, leader, rivals: rivals.map(({ name, hint }, index) =>
    ({ name, hint, out: lot.out[index] })), log };
}

export function recruitReason(locked: boolean, open: boolean, goldMilli: number, priceMilli: number, hasBed: boolean, npcCount: number): string {
  if (locked) return 'Plan next week to recruit.';
  if (!open) return ACQUISITION_MESSAGES.OFFER_GONE;
  if (goldMilli < priceMilli) return ACQUISITION_MESSAGES.NOT_ENOUGH_GOLD;
  if (!hasBed) return ACQUISITION_MESSAGES.NO_BED;
  if (npcCount >= P7B_TRIAL.npcCap) return ACQUISITION_MESSAGES.NPC_CAP;
  return '';
}

export function departureReason(city: TileTrialState, npc: WorldNpc, locked: boolean, selling: boolean): string {
  if (locked) return 'Plan next week to make changes.';
  if (selling && npc.household.status !== 'slave') return ACQUISITION_MESSAGES.NOT_A_SLAVE;
  const { equipped, storage } = city.society!.items;
  const count = Object.hasOwn(equipped, npc.character.id) ? Object.keys(equipped[npc.character.id]).length : 0;
  return storage.length + count > ITEM_TRIAL.storageCap ? ACQUISITION_MESSAGES.STORAGE_FULL : '';
}
export const saleGold = (npc: WorldNpc) => goldLabel(npcSellMilli(npc));
''','Pure view with the shared prices, bid replay and actionable refusal copy.')
new(ui+'AcquisitionPanel.svelte','''<script lang="ts">
  import { tick } from 'svelte';
  import { AUCTION_TRIAL, type AcquisitionSource, type TileTrialState, type WorldNpc } from '@haven/core';
  import { ACQUISITION_MESSAGES, isAcquisitionCommand } from '@haven/simulation';
  import { acquisitionView, departureReason, goldLabel, recruitReason, saleGold, sourceLabel, type cardFor } from './acquisition-view.js';

  export let state: TileTrialState;
  export let npcs: readonly WorldNpc[];
  export let source: AcquisitionSource;
  export let tileId: string;
  export let locked: boolean;
  export let managementError: { action: string; message: string } | null;
  export let oncommand: (type: string, fields?: Record<string, unknown>) => boolean;

  type Tab = 'sale' | 'auction';
  let active: Tab = 'sale';
  let tabButtons: Partial<Record<Tab, HTMLButtonElement>> = {};
  let heading: HTMLHeadingElement;
  let choices: Record<string, string> = {};
  $: view = acquisitionView(state, npcs, source);
  $: tabs = (source === 'guild' ? ['sale'] : ['sale', 'auction']) as Tab[];
  $: defaultHome = view.homes.find(home => home.free > 0)?.id ?? view.homes[0]?.id ?? '';
  $: recruit = source === 'guild' ? 'Hire' : 'Buy';

  function focusTab(event: KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    active = event.key === 'Home' ? 'sale' : event.key === 'End' ? tabs[tabs.length - 1] :
      tabs[(tabs.indexOf(active) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    tabButtons[active]?.focus();
  }

  async function sell(npcId: string, reason: string) {
    if (reason || !oncommand('SELL_NPC', { npcId })) return;
    await tick();
    heading.focus();
  }
</script>

{#snippet cardDetails(card: ReturnType<typeof cardFor>)}
  <p>Age {card.age} · {card.title} · {card.origin}</p>
  <p>{card.source} · {card.status}</p>
  <p>{card.skills.map(skill => `${skill.label} ${skill.value}`).join(' · ')}</p>
  <p>Beauty {card.beauty} · Mind {card.mind} · Obedience {card.obedience}</p>
{/snippet}

{#snippet homePicker(key: string, label: string, homeTileId: string)}
  <label for={`acq-${key}-home`}>Home for {label}</label>
  <select id={`acq-${key}-home`} value={homeTileId} onchange={event => { choices = { ...choices, [key]: event.currentTarget.value }; }}>
    {#each view.homes as home (home.id)}
      <option value={home.id}>{home.label} · {home.free} free</option>
    {/each}
  </select>
{/snippet}

<section class="card acquisition" aria-labelledby={`acquisition-panel-${tileId}`} data-acquisition-panel={source}>
  <h4 id={`acquisition-panel-${tileId}`} tabindex="-1" bind:this={heading}>{sourceLabel(source)} acquisitions</h4>
  <div role="tablist" aria-label="Acquisition listings">
    {#each tabs as tab (tab)}
      <button type="button" role="tab" bind:this={tabButtons[tab]} id={`acq-${tileId}-${tab}`}
        aria-selected={active === tab} aria-controls={`acq-${tileId}-${tab}-panel`} tabindex={active === tab ? 0 : -1}
        onclick={() => { active = tab; }} onkeydown={focusTab}>{tab === 'sale' ? 'For sale' : 'Auction'}</button>
    {/each}
  </div>
  <div role="tabpanel" id={`acq-${tileId}-sale-panel`} aria-labelledby={`acq-${tileId}-sale`} hidden={active !== 'sale'}>
    <div class="listings">
      {#each view.stock as { offer, card } (offer.slot)}
        {@const key = `${tileId}-${offer.slot}`}
        {@const home = choices[key] ?? defaultHome}
        {@const reason = recruitReason(locked, offer.status === 'open', view.goldMilli, card.priceMilli,
          view.homes.some(entry => entry.id === home && entry.free > 0), npcs.length)}
        <article data-acquisition-offer={offer.slot}>
          <h5>{card.name}</h5>
          {@render cardDetails(card)}
          <p>{offer.status === 'bought' ? (source === 'guild' ? 'Hired' : 'Bought') : goldLabel(card.priceMilli)}
            {#if card.wageMilli !== undefined} · {goldLabel(card.wageMilli)}/week{/if}</p>
          {@render homePicker(key, card.name, home)}
          <button type="button" data-acquisition-action="BUY_NPC" aria-disabled={!!reason}
            aria-describedby={reason ? `acq-${key}-reason` : undefined}
            onclick={() => { if (!reason) oncommand('BUY_NPC', { source, slot: offer.slot, homeTileId: home }); }}>{recruit}</button>
          {#if reason}<p id={`acq-${key}-reason`}>{reason}</p>{/if}
        </article>
      {:else}<p>No offers this week.</p>{/each}
    </div>
    {#if source === 'slave-market' && npcs.length}
      <section aria-label="Sell an NPC">
        <h5>Sell an NPC</h5>
        <ul>
          {#each npcs as npc (npc.character.id)}
            {@const reason = departureReason(state, npc, locked, true)}
            <li><span>{npc.character.name}{npc.household.status === 'slave' ? ` · ${saleGold(npc)}` : ''}</span>
              <button type="button" data-acquisition-action="SELL_NPC" aria-label={`Sell ${npc.character.name}`} aria-disabled={!!reason}
                aria-describedby={reason ? `acq-sell-${npc.character.id}-reason` : undefined}
                onclick={() => sell(npc.character.id, reason)}>Sell</button>
              {#if reason}<span id={`acq-sell-${npc.character.id}-reason`}>{reason}</span>{/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
  {#if source !== 'guild'}
    <div role="tabpanel" id={`acq-${tileId}-auction-panel`} aria-labelledby={`acq-${tileId}-auction`} hidden={active !== 'auction'}>
      {#if view.auction}
        {@const { card, lot, opening, leader, rivals, log } = view.auction}
        {@const home = choices[tileId + '-lot'] ?? defaultHome}
        {@const withdrawReason = locked ? 'Plan next week to make changes.' : lot.status !== 'open' ? ACQUISITION_MESSAGES.OFFER_GONE : ''}
        <article>
          <h5>{card.name}</h5>
          {@render cardDetails(card)}
          <p>Opening {goldLabel(opening)} · Current {goldLabel(lot.priceMilli)} · Leader {leader}</p>
          <ul aria-label="Rival bidders">
            {#each rivals as rival (rival.name)}
              <li>{rival.name} · {rival.hint} · {rival.out ? 'Out' : 'In'}</li>
            {/each}
          </ul>
          {@render homePicker(tileId + '-lot', card.name, home)}
          <div class="bid-controls">
            {#each AUCTION_TRIAL.playerRaisesMilli as raise}
              {@const reason = recruitReason(locked, lot.status === 'open', view.goldMilli, lot.priceMilli + raise,
                view.homes.some(entry => entry.id === home && entry.free > 0), npcs.length)}
              <div>
                <button type="button" data-acquisition-action="BID_NPC" aria-disabled={!!reason}
                  aria-describedby={reason ? `acq-${tileId}-bid-${raise}-reason` : undefined}
                  onclick={() => { if (!reason) oncommand('BID_NPC', { source, raise, homeTileId: home }); }}>+{goldLabel(raise)}</button>
                {#if reason}<p id={`acq-${tileId}-bid-${raise}-reason`}>{reason}</p>{/if}
              </div>
            {/each}
            <div>
              <button type="button" data-acquisition-action="WITHDRAW_BID" aria-disabled={!!withdrawReason}
                aria-describedby={withdrawReason ? `acq-${tileId}-withdraw-reason` : undefined}
                onclick={() => { if (!withdrawReason) oncommand('WITHDRAW_BID', { source }); }}>Withdraw</button>
              {#if withdrawReason}<p id={`acq-${tileId}-withdraw-reason`}>{withdrawReason}</p>{/if}
            </div>
          </div>
          <h5>Bid log</h5>
          {#if !log.length}<p>No bids yet.</p>{/if}
          <ol aria-label="Bid log" aria-live="polite" aria-relevant="additions">
            {#each log as line}<li>{line}</li>{/each}
          </ol>
        </article>
      {:else}<p>No lot this week.</p>{/if}
    </div>
  {/if}
  {#if managementError && isAcquisitionCommand(managementError.action)}<p role="alert">{managementError.message}</p>{/if}
</section>

<style>
  .acquisition, article { min-width: 0; overflow-wrap: anywhere; }
  .listings { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: 1rem; }
  article { padding: 0.75rem; border: 1px solid currentColor; }
  label, select { display: block; max-width: 100%; }
  .bid-controls, [role="tablist"] { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block: 0.5rem; }
  button[aria-selected="true"] { text-decoration: underline; text-underline-offset: 0.2em; }
  button[aria-disabled="true"] { cursor: not-allowed; }
</style>
''','B3.3 ledger panels and keyboard-reachable reason strings.')
edit(ui+'InsideCity.svelte'," import MarketPanel from './MarketPanel.svelte';"," import MarketPanel from './MarketPanel.svelte';\n import AcquisitionPanel from './AcquisitionPanel.svelte';",'Mount the panel behind the existing tile selection.')
edit(ui+'InsideCity.svelte'," import { TRIAL_BUILDINGS, societyStaff,"," import { TRIAL_BUILDINGS, isAcquisitionSource, societyStaff,",'Mount only on enabled acquisition sources.')
edit(ui+'InsideCity.svelte'," export let selectedId:string;"," export let selectedId:string;\n export let uiEpoch:number;",'Reset local tab and home choices after successful import or Continue.')
edit(ui+'InsideCity.svelte'," $: wall=wallStatus(state);"," $: wall=wallStatus(state);\n $: selectedBuilding=state.tiles.find(tile=>tile.id===selectedId)?.building;\n $: source=selectedBuilding?.enabled && isAcquisitionSource(selectedBuilding.typeId) ? selectedBuilding.typeId : null;",'Use the selected building and its enabled state for the mount.')
edit(ui+'InsideCity.svelte'," <PotionPanel {state} {npcs} tileId={selectedId} {locked} {managementError} {oncommand} />",""" {#if source}
  {#key `${selectedId}:${uiEpoch}`}
   <AcquisitionPanel {state} {npcs} {source} tileId={selectedId} {locked} {managementError} {oncommand} />
  {/key}
 {/if}
 <PotionPanel {state} {npcs} tileId={selectedId} {locked} {managementError} {oncommand} />""",'Mount one panel and preserve the other selected-tile panels.')
edit(ui+'CharacterLifeCity.svelte',"  export function focusManage(): void { managementHeading?.focus(); }","""  export function focusManage(fromTile = false): void {
    const acquisitionHeading = fromTile ? document.getElementById(`acquisition-panel-${selectedId}`) : null;
    (acquisitionHeading ?? managementHeading)?.focus();
  }""",'Focus the new panel when its tile opens and keep existing manage focus elsewhere.')
edit(ui+'CharacterLifeCity.svelte',"<InsideCity {state} {npcs} {selectedId} {locked}","<InsideCity {state} {npcs} {selectedId} {uiEpoch} {locked}",'Pass the checkpoint reset generation to the panel.')
edit(ui+'TileManagement.svelte'," 'NO_BED', 'NOT_A_HOME'];"," 'NO_BED', 'NOT_A_HOME', 'NO_BUILDING', 'OFFER_GONE', 'NPC_CAP', 'NOT_A_SLAVE', 'STORAGE_FULL'];",'Recognize expected domain refusals instead of UNKNOWN_COMMAND_FAILURE.')
edit(ui+'TileManagement.svelte',"'CLEAR', 'MOVE_NPC_HOME'].includes(type)", "'CLEAR', 'MOVE_NPC_HOME', 'BUY_NPC', 'BID_NPC', 'WITHDRAW_BID', 'SELL_NPC', 'RELEASE_NPC'].includes(type)",'Route market errors into the panel alert via the existing command bridge.')
edit(ui+'TileManagement.svelte',"async function openLifeCity(): Promise<void>", "async function openLifeCity(fromTile = false): Promise<void>",'Keep draft and shortcut focus behavior while opening acquisition tiles.')
edit(ui+'TileManagement.svelte',"    lifeCity.focusManage();","    lifeCity.focusManage(fromTile);",'Preserve existing focus unless the selected tile has a mounted market panel.')
edit(ui+'TileManagement.svelte',"onselect={id => { selectTile(id); void openLifeCity(); }}","onselect={id => { selectTile(id); void openLifeCity(true); }}",'Focus the selected acquisition panel through the same navigation path.')
edit(ui+'CharacterLifeCharacters.svelte',"  import EquipmentView from './EquipmentView.svelte';","  import EquipmentView from './EquipmentView.svelte';\n  import { tick } from 'svelte';\n  import { departureReason } from './acquisition-view.js';",'Release remains reachable without a market and uses the shared storage refusal.')
edit(ui+'CharacterLifeCharacters.svelte',"  function run(type: 'ASSIGN_NPC' | 'UNASSIGN_NPC', npcId: string) {","""  let playerButton: HTMLButtonElement;
  async function release(npcId: string, reason: string) {
    if (reason) return;
    const result = executeCharacterLifeCommand(session, { type: 'RELEASE_NPC', expectedRevision: session.city.revision, npcId });
    if (!result.success) { assignError = { npcId, message: result.error.message }; return; }
    assignError = null;
    selectedCharacterId = PLAYER_CHARACTER_ID;
    onapply(result.next);
    await tick();
    playerButton.focus();
  }
  function run(type: 'ASSIGN_NPC' | 'UNASSIGN_NPC', npcId: string) {""",'Use the Character Life dispatcher for release and move focus to the persistent You control.')
edit(ui+'CharacterLifeCharacters.svelte',"""    <button data-testid={`character-${person.id}`} aria-pressed={selectedCharacterId === person.id}
      onclick={() => { selectedCharacterId = person.id; }}>{person.name} · {person.role}</button>""","""    {#if person.id === PLAYER_CHARACTER_ID}
      <button bind:this={playerButton} data-testid={`character-${person.id}`} aria-pressed={selectedCharacterId === person.id}
        onclick={() => { selectedCharacterId = person.id; }}>{person.name} · {person.role}</button>
    {:else}
      <button data-testid={`character-${person.id}`} aria-pressed={selectedCharacterId === person.id}
        onclick={() => { selectedCharacterId = person.id; }}>{person.name} · {person.role}</button>
    {/if}""",'Bind the persistent focus target without changing roster labels or DOM for existing controls.')
edit(ui+'CharacterLifeCharacters.svelte',"""          {#if inHall && !npc.postTileId && !freeSlots.length}<p>No free manager post. Build a Farm, Processor, Logging Camp, Mine, Workshop or Market.</p>{/if}
        {/if}""","""          {#if inHall && !npc.postTileId && !freeSlots.length}<p>No free manager post. Build a Farm, Processor, Logging Camp, Mine, Workshop or Market.</p>{/if}
          {@const reason = departureReason(session.city, npc, locked, false)}
          <button type="button" data-acquisition-action="RELEASE_NPC" aria-disabled={!!reason}
            aria-describedby={reason ? 'npc-release-reason' : undefined}
            onclick={() => release(npc!.character.id, reason)}>Release</button>
          {#if reason}<p id="npc-release-reason">{reason}</p>{/if}
        {/if}""",'Add Release for owned NPCs with report-lock and storage reasons.')
edit(ui+'report-letters.ts',"export function npcLifeReportRows(","""export function householdReportRows(report: Readonly<TileTrialReport>) {
  const household = report.household;
  if (!household) return [];
  return [
    ...household.bought.map(value => ({ kind: 'bought', label: 'Recruited', value })),
    ...household.sold.map(value => ({ kind: 'sold', label: 'Sold', value })),
    ...household.released.map(value => ({ kind: 'released', label: 'Released', value })),
    ...household.lotsToRivals.map(({ source, priceMilli }) => ({
      kind: 'lotsToRivals', label: 'Lot sold to a rival',
      value: `${source === 'auction-house' ? 'Auction House' : 'Slave Market'} · ${formatMilli(priceMilli)} Gold`,
    })),
  ];
}

export function npcLifeReportRows(""",'Render household event rows using stable names and amounts.')
edit(ui+'SoloWeekReport.svelte',"  import { npcLifeReportRows,","  import { householdReportRows, npcLifeReportRows,",'Show Department 14 rows as a distinct report region when there are entries.')
edit(ui+'SoloWeekReport.svelte',"    {@const npcRows = npcLifeReportRows(report, npcs)}","    {@const npcRows = npcLifeReportRows(report, npcs)}\n    {@const householdRows = householdReportRows(report)}",'Compute visible household rows only for a resolved report.')
edit(ui+'SoloWeekReport.svelte',"    {#if npcRows.length}","""    {#if householdRows.length}
      <section aria-label="Household activity">
        <h3>Household activity</h3>
        <ul>
          {#each householdRows as row}
            <li data-household-kind={row.kind}><span>{row.label}</span> · <strong>{row.value}</strong></li>
          {/each}
        </ul>
      </section>
    {/if}
    {#if npcRows.length}""",'Render actual ledger text for the browser report reader and leave empty report markup alone.')
