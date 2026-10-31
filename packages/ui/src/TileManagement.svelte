<script lang="ts">
  import { tick } from 'svelte';
  import CharacterLifeShell from './CharacterLifeShell.svelte';
  import CharacterLifeCity from './CharacterLifeCity.svelte';
  import CharacterLifeCharacters from './CharacterLifeCharacters.svelte';
  import SoloWeekReport from './SoloWeekReport.svelte';
  import type { LifeDestination, LifeWindow, PostDraftEntry } from './character-life-navigation.js';
  import { type OutsideWorldState, type NpcWorldSessionState, type WorldNpc, type TileTrialReport, type CharacterLifeSessionState, type CharacterProfile as Profile, type PlayerCharacter } from '@haven/core';
  import { executeCharacterLifeCommand } from '@haven/simulation';
  import { serializeCharacterLifeSave, deserializeCharacterLifeSave, TILE_SAVE_MAX_BYTES } from '@haven/persistence';
  import ErrorLog from './ErrorLog.svelte';
  import { errorLog } from './error-log.js';
  import { formatFulfillment, formatMilli as units } from './milli-format.js';
  import { formatLifeWeek } from './life-calendar.js';
  import { prepareCharacterLifeLoad, readLocalCharacterLife, saveLocalCharacterLife, isPlayableCheckpoint, OLD_CHECKPOINT_MESSAGE } from './character-life-session.js';

  export let lifeMode = true;
  export let initialLife: CharacterLifeSessionState;
  let state = initialLife.city;
  let selectedId = 'forest-1';
  let typeId = 'logging';
  let workers = '0';
  let error = '';
  let workforceError = '';
  let managementError: { action: string; message: string } | null = null;
  let destination: LifeDestination = 'city';
  let activeWindow: LifeWindow = null;
  let lifeShell: CharacterLifeShell;
  let lifeStatus = '';
  let lifeCity: CharacterLifeCity;
  let lifeCharacters: CharacterLifeCharacters;
  let uiEpoch = 0;
  let postDrafts: PostDraftEntry[] = [];
  let saveNotice = '';
  let importRead = 0;
  let report: Readonly<TileTrialReport> | null = null;
  let outside: OutsideWorldState | null = null;
  let npcs: WorldNpc[] | null = null;
  let player: PlayerCharacter | null = null;
  let profiles: Profile[] | null = null;
  ({ outside, npcs, player, profiles } = initialLife);
  $: checkpointLocked = locked || !(outside && npcs && player && profiles);
  $: settlement = state.world.settlements[state.world.activeSettlementId!];
  $: selected = state.tiles.find(t => t.id === selectedId)!;
  $: locked = state.phase === 'report';
  $: unapplied = [
    ...(selected.building && workers !== String(selected.building.workers)
      ? [{ id: 'workforce', label: `Workforce · ${selectedId}`, onopen: () => { void openLifeCity(); } }] : []),
    ...postDrafts.map(entry => ({ id: entry.npcId, label: `Post · ${entry.name}`, onopen: () => { void openLifePost(entry.npcId); } })),
  ];
  errorLog.setContext('weekly', { week: state.world.week });

  function selectTile(id: string) {
    selectedId = id;
    workers = String(state.tiles.find(t => t.id === id)!.building?.workers ?? 0);
    error = '';
    workforceError = '';
    managementError = null;
  }
  function command(type: string, fields: Record<string, unknown> = {}, expectedRevision = state.revision) {
    saveNotice = '';
    workforceError = '';
    managementError = null;
    const action = { type, expectedRevision, ...fields };
    const result = executeCharacterLifeCommand({ city: state, outside, npcs, player, profiles }, action);
    if (!result.success) {
      error = '';
      if (type === 'SET_WORKERS') workforceError = result.error.message;
      else if (['BUILD', 'REPLACE', 'UPGRADE', 'SET_ENABLED', 'EXTEND_WALL', 'SET_TRAINING'].includes(type)) managementError = { action: type, message: result.error.message };
      else error = result.error.message;
      errorLog.record(type === 'END_WEEK' ? 'END_WEEK' : 'RUNTIME', 'INVALID_COMMAND');
      return false;
    }
    ({ city: state, outside, npcs, player, profiles } = result.next);
    if (result.report) report = result.report;
    // Keep the last report mounted so a repeated pointer click cannot fall onto End Week.
    if (type === 'LOAD_TRIAL') report = null;
    workers = String(state.tiles.find(t => t.id === selectedId)!.building?.workers ?? 0);
    errorLog.setContext('weekly', { week: state.world.week });
    error = '';
    return true;
  }
  async function endLifeWeek(opener: HTMLButtonElement): Promise<void> {
    if (state.phase !== 'planning') return;
    if (command('END_WEEK', { expectedWeek: state.world.week })) {
      lifeStatus = '';
      const resolvedRevision = state.revision, resolvedReport = report;
      await lifeShell.openWindow('report', opener);
      if (state.revision === resolvedRevision && report === resolvedReport && activeWindow === 'report') {
        lifeStatus = `${formatLifeWeek(resolvedReport!.week)} report ready.`;
      }
    }
  }
  function nextLifeWeek(): void {
    if (state.phase !== 'report') return;
    if (command('NEXT_WEEK')) lifeStatus = `Planning ${formatLifeWeek(state.world.week)}. Previous report retained.`;
  }
  async function openLifeCity(): Promise<void> {
    destination = 'city';
    await tick();
    lifeCity.focusManage();
  }
  async function openLifePost(npcId: string): Promise<void> {
    destination = 'characters';
    await tick();
    lifeCharacters.openWork(npcId);
    await tick();
    const post = document.getElementById(`npc-slot-${npcId}`) as HTMLSelectElement | null;
    (post && !post.disabled ? post : document.getElementById(`profile-${npcId}-tab-work`))?.focus();
  }
  async function focusLifeCityNavigation(): Promise<void> {
    await tick();
    document.getElementById('life-nav-city')?.focus();
  }
  function checkpointError(message: string) {
    error = message; saveNotice = '';
    errorLog.record('RUNTIME', 'INVALID_COMMAND');
  }
  function exportCheckpoint() {
    const result = serializeCharacterLifeSave({ city: state, outside, npcs, player, profiles });
    if (!result.success) { checkpointError(result.error.message); return; }
    let url: string | undefined; let anchor: HTMLAnchorElement | undefined;
    try {
      url = URL.createObjectURL(new Blob([result.text], { type: 'application/json' }));
      anchor = document.createElement('a'); anchor.href = url; anchor.download = `haven-world-life-week-${state.world.week}.json`;
      document.body.append(anchor); anchor.click(); error = ''; saveNotice = 'Checkpoint download requested.';
    } catch { checkpointError('Could not download the checkpoint. Your game was preserved.'); }
    finally { anchor?.remove(); if (url) URL.revokeObjectURL(url); }
  }
  function loadWorldSession(loaded: unknown, expectedRevision: number, notice: string, invalidateReads = false) {
    if (!(outside && npcs && player && profiles)) { checkpointError('A world session is not available. Reload to try New Game again.'); return false; }
    const prepared = prepareCharacterLifeLoad({ city: state, outside, npcs, player, profiles }, loaded, expectedRevision);
    if (!prepared.success) { checkpointError(prepared.message); return false; }
    let nextWorkers: string;
    try { nextWorkers = String(prepared.next.city.tiles.find(t => t.id === selectedId)!.building?.workers ?? 0); }
    catch { checkpointError('Could not prepare the checkpoint. Your game was preserved.'); return false; }
    // Publish all prepared parts before UI effects, with no fallible work between.
    state = prepared.next.city;
    outside = prepared.next.outside;
    if (npcs) npcs = (prepared.next as NpcWorldSessionState).npcs;
    if (lifeMode) ({ player, profiles } = prepared.next as CharacterLifeSessionState);
    if (invalidateReads) importRead++;
    report = null; workers = nextWorkers;
    if (lifeMode) {
      uiEpoch++; postDrafts = []; destination = 'city'; lifeStatus = '';
      lifeShell.closeWindow();
      void focusLifeCityNavigation();
    }
    errorLog.setContext('weekly', { week: state.world.week });
    error = ''; workforceError = ''; managementError = null; saveNotice = notice;
    return true;
  }
  async function importCheckpoint(event: Event) {
    const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; input.value = '';
    if (!file) return;
    const ticket = ++importRead, expectedRevision = state.revision;
    error = ''; saveNotice = '';
    if (state.phase !== 'planning') { checkpointError('Choose Plan next week before importing.'); return; }
    if (file.size > TILE_SAVE_MAX_BYTES) { checkpointError('Checkpoint exceeds the 1 MiB limit.'); return; }
    try {
      const text = await file.text();
      if (ticket !== importRead) return;
      const result = deserializeCharacterLifeSave(text);
      if (!result.success || !isPlayableCheckpoint(result.state)) { checkpointError(OLD_CHECKPOINT_MESSAGE); return; }
      loadWorldSession(result.state, expectedRevision, 'Checkpoint imported. Planning restored.');
    } catch { if (ticket === importRead) checkpointError('Could not read the checkpoint file. Your game was preserved.'); }
  }
  function saveLocally() {
    const result = saveLocalCharacterLife({ city: state, outside, npcs, player, profiles });
    if (!result.success) { checkpointError(result.message); return; }
    error = ''; saveNotice = result.replaced ? 'Saved in this browser. Replaced the previous local checkpoint.' : 'Saved in this browser.';
  }
  function continueLocally() {
    const result = readLocalCharacterLife();
    if (!result.success) { checkpointError(result.message); return; }
    loadWorldSession(result.state, state.revision, 'Local checkpoint loaded. Planning restored.', true);
  }
</script>

{#if lifeMode && outside && npcs && player && profiles}
  <CharacterLifeShell bind:this={lifeShell} {state} {report} bind:destination bind:activeWindow {error} status={lifeStatus} {unapplied} onendweek={endLifeWeek}>
    {#snippet playerInfo()}
      <p>{player!.character.name}</p><p>Leader of Haven</p>
    {/snippet}
    {#snippet city()}
      <section class="card life-requirements" aria-label="City Requirements">
        <header><h3>City Requirements</h3>
        {#if report}<p>Last resolved week: {formatLifeWeek(report.week)}</p>
        {:else}<p>No resolved week yet</p>{/if}
        </header>
        <div class="requirements-strip">
          <div>
            {#if report}
              {@const fulfillment = formatFulfillment(report.foodConsumedMilli, report.foodDemandMilli)}
              <div class="requirement-heading"><h4>Food</h4><p data-testid="life-requirement-food">{units(report.foodConsumedMilli)} / {units(report.foodDemandMilli)} · {fulfillment}</p></div>
              {#if fulfillment.endsWith('%')}<div class="fulfillment-track" data-fulfillment-track="food" aria-hidden="true"><span style:width={fulfillment}></span></div>{/if}
            {:else}<h4>Food</h4>{/if}
            <details><summary>Food requirements</summary>
              <h3>Current inventory</h3>
              <dl><div><dt>Food stock</dt><dd data-testid="trial-stock-food">{units(settlement.inventory.food)}</dd></div></dl>
            </details>
          </div>
          <div>
            {#if report}
              {@const fulfillment = formatFulfillment(report.goods.servedMilli, report.goods.demandMilli)}
              <div class="requirement-heading"><h4>Goods</h4><p data-testid="life-requirement-goods">{units(report.goods.servedMilli)} / {units(report.goods.demandMilli)} · {fulfillment}</p></div>
              {#if fulfillment.endsWith('%')}<div class="fulfillment-track" data-fulfillment-track="goods" aria-hidden="true"><span style:width={fulfillment}></span></div>{/if}
            {:else}<h4>Goods</h4>{/if}
            {#if state.goodsStock}<details><summary>Goods requirements</summary>
              <h3>Current inventory</h3><dl><div><dt>Goods stock</dt><dd data-testid="trial-stock-goods">{units(state.goodsStock.amountMilli)}</dd></div></dl>
            </details>{/if}
          </div>
        </div>
      </section>
      {#if npcs && outside}
      <CharacterLifeCity bind:this={lifeCity} {state} {npcs} {selectedId} bind:typeId bind:workers {workforceError} {managementError} {outside}
        onselect={id => { selectTile(id); void openLifeCity(); }} onworkersinput={() => { workforceError = ''; }} oncommand={command} />
      {/if}
    {/snippet}
    {#snippet characters()}
      {#if outside && npcs && player && profiles}
        {#key uiEpoch}
        <CharacterLifeCharacters bind:this={lifeCharacters} session={{ city: state, outside, npcs, player, profiles }} {locked} onpostdrafts={entries => { postDrafts = entries; }}
          onapply={next => { ({ city: state, outside, npcs, player, profiles } = next); saveNotice = ''; error = ''; }} />
        {/key}
      {/if}
    {/snippet}
    {#snippet reports()}
      <SoloWeekReport {report} planningWeek={state.world.week} {locked} onnextweek={nextLifeWeek} />
    {/snippet}
    {#snippet session()}
  <section class="card" aria-label="Planning checkpoints">
    <h3>Planning checkpoint</h3>
    <p>Save or restore a Planning checkpoint in this browser or a JSON file.</p>
    <details><summary>About checkpoints</summary>
    <p>Save locally keeps one checkpoint in this browser profile and site, replacing the previous one; clearing site data removes it. Export a JSON file as a portable backup; Import replaces the current plan after validation. Checkpoints from older versions of Haven cannot be played.</p>
</details>
    {#if locked}<p>Choose Plan next week before saving, continuing, exporting or importing.</p>{/if}
    <button disabled={checkpointLocked} onclick={saveLocally}>Save locally</button>
    <button disabled={checkpointLocked} onclick={() => continueLocally()}>Continue locally</button>
    <button disabled={checkpointLocked} onclick={exportCheckpoint}>Export checkpoint</button>
    <label for="tile-save-file">Import checkpoint</label>
    <input id="tile-save-file" type="file" accept=".json,application/json" disabled={checkpointLocked} onchange={importCheckpoint} />
    {#if saveNotice}<p role="status">{saveNotice}</p>{/if}
  </section>

      <ErrorLog />
    {/snippet}
    {#snippet help()}
<details class="card"><summary>Getting started</summary><p>Your 100 residents are Free residents, Makers, Luminaries and Merchants, each with their own housing. Farm and Food Processor start with 2 WF each; the Market on spec-1 distributes stored Goods. Build inside the walls on plots of the matching tier, and extend the wall to open more plots.</p></details>
<details class="card"><summary>Weekly rules</summary><p>TRIAL: each class eats and uses Goods separately; the Bound eat last. Missing Food, Goods or housing lowers that class's satisfaction and stops its arrivals. Each class supplies 1 WF per 10 residents; Elites do not work.</p></details>
<details class="card"><summary>About this build</summary><p>Balance and building policies are TRIAL. Character profiles are TRIAL content. Weekly life events and Player interactions are not available yet.</p></details>
    {/snippet}
  </CharacterLifeShell>
{/if}

<style>
p{margin:8px 0;line-height:1.5}.card{margin-bottom:16px}.requirements-strip{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.requirements-strip>div{min-width:0;overflow-wrap:anywhere}.life-requirements{background:var(--bg-tertiary);padding:20px;margin-bottom:22px}.life-requirements header{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}.requirement-heading{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}.fulfillment-track{height:8px;background:var(--bg-primary);border-radius:4px;overflow:hidden}.fulfillment-track span{display:block;height:100%;background:var(--accent-green)}label{display:block;margin:12px 0}input{max-width:100%}@media(max-width:500px){.requirements-strip{grid-template-columns:minmax(0,1fr)}}
</style>
