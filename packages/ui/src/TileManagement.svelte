<script lang="ts">
  import { tick } from 'svelte';
  import CharacterLifeShell from './CharacterLifeShell.svelte';
  import CharacterLifeCity from './CharacterLifeCity.svelte';
  import CharacterLifeCharacters from './CharacterLifeCharacters.svelte';
  import SoloWeekReport from './SoloWeekReport.svelte';
  import type { LifeDestination, LifeWindow, PostDraftEntry } from './character-life-navigation.js';
  import { createNpcWorldSession, createTileTrialState, createWorldSession, isLiveCharacterLifeSessionState, summarizeOutside, weeklyWorkforceMilli, WEEKLY_RESOURCE_KEYS, TRIAL_BUILDINGS, TILE_TRIAL_BALANCE as B, LEGACY_TILE_RULESET, POPULATION_TILE_RULESET, type OutsideWorldState, type NpcWorldSessionState, type WorldNpc, type TileTrialRuleset, type TileTrialReport, type CharacterLifeSessionState, type CharacterProfile as Profile, type PlayerCharacter } from '@haven/core';
  import { executeCharacterLifeCommand, executeTileTrialCommand, executeWorldNpcCityCommand } from '@haven/simulation';
  import { serializeTileTrialSave, deserializeTileTrialSave, serializeWorldSessionSave, deserializeWorldSessionSave, serializeNpcWorldSessionSave, deserializeNpcWorldSessionSave, serializeCharacterLifeSave, deserializeCharacterLifeSave, TILE_SAVE_MAX_BYTES } from '@haven/persistence';
  import ErrorLog from './ErrorLog.svelte';
  import { errorLog } from './error-log.js';
  import { formatMilli as units } from './milli-format.js';
  import { readLocalCheckpoint, saveLocalCheckpoint } from './tile-local-checkpoint.js';
  import { prepareWorldSessionLoad, readLocalWorldSession, saveLocalWorldSession } from './world-session.js';
  import { prepareNpcWorldSessionLoad, readLocalNpcWorldSession, saveLocalNpcWorldSession } from './world-npc-session.js';
  import { prepareCharacterLifeLoad, readLocalCharacterLife, saveLocalCharacterLife } from './character-life-session.js';
  import WorldNpcPanel from './WorldNpcPanel.svelte';
  import CharacterProfile from './CharacterProfile.svelte';

  export let ruleset: TileTrialRuleset = LEGACY_TILE_RULESET;
  export let world = false;
  export let npcMode = false;
  // Character Life passes a created or loaded session; it composes the NPC world session (world and npcMode stay true).
  export let lifeMode = false;
  export let initialLife: CharacterLifeSessionState | null = null;
  $: populationMode = ruleset === POPULATION_TILE_RULESET;
  let state = createTileTrialState();
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
  if (world) {
    try {
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      const created = lifeMode ? (initialLife ? { success: true as const, value: initialLife } : { success: false as const, error: { message: 'A Character Life session is not available. Reload to try New Game again.' } })
        : npcMode ? createNpcWorldSession(seed) : createWorldSession(seed);
      if (created.success) {
        state = created.value.city; outside = created.value.outside;
        if (npcMode) npcs = (created.value as NpcWorldSessionState).npcs;
        if (lifeMode) ({ player, profiles } = created.value as CharacterLifeSessionState);
      } else error = created.error.message;
    } catch { error = 'Could not start a world session. Reload to try New Game again.'; }
  }
  $: outsideSummary = outside ? summarizeOutside(outside, 'player') : null;
  $: checkpointLocked = locked || (world && !outside) || (npcMode && !npcs) || (lifeMode && !(player && profiles));
  $: settlement = state.world.settlements[state.world.activeSettlementId!];
  $: selected = state.tiles.find(t => t.id === selectedId)!;
  $: definition = selected.building ? TRIAL_BUILDINGS[selected.building.typeId] : null;
  $: assigned = state.tiles.reduce((sum, t) => sum + (t.building?.workers ?? 0), 0);
  $: locked = state.phase === 'report';
  $: chosen = TRIAL_BUILDINGS[typeId];
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
  function revealManagementError(node: HTMLParagraphElement, failure: typeof managementError) {
    const reveal = (current: typeof failure) => { if (current) node.scrollIntoView({ block: 'nearest' }); };
    reveal(failure);
    return { update: reveal };
  }
  function command(type: string, fields: Record<string, unknown> = {}, expectedRevision = state.revision) {
    saveNotice = '';
    workforceError = '';
    managementError = null;
    const action = { type, expectedRevision, ...fields };
    const result = lifeMode ? executeCharacterLifeCommand({ city: state, outside, npcs, player, profiles }, action)
      : npcs && outside ? executeWorldNpcCityCommand({ city: state, outside, npcs }, action) : executeTileTrialCommand(state, action, ruleset);
    if (!result.success) {
      error = '';
      if (type === 'SET_WORKERS') workforceError = result.error.message;
      else if (['BUILD', 'REPLACE', 'UPGRADE', 'SET_ENABLED'].includes(type)) managementError = { action: type, message: result.error.message };
      else error = result.error.message;
      errorLog.record(type === 'END_WEEK' ? 'END_WEEK' : 'RUNTIME', 'INVALID_COMMAND');
      return false;
    }
    if ('next' in result) {
      const next = result.next;
      if (isLiveCharacterLifeSessionState(next)) ({ city: state, outside, npcs, player, profiles } = next);
      else ({ city: state, outside, npcs } = next);
    } else state = result.nextState;
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
        lifeStatus = `Week ${resolvedReport!.week} report ready.`;
      }
    }
  }
  function nextLifeWeek(): void {
    if (state.phase !== 'report') return;
    if (command('NEXT_WEEK')) lifeStatus = `Planning week ${state.world.week}. Previous report retained.`;
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
    if (!lifeMode) { workforceError = ''; managementError = null; }
    errorLog.record('RUNTIME', 'INVALID_COMMAND');
  }
  function exportCheckpoint() {
    const result = lifeMode ? serializeCharacterLifeSave({ city: state, outside, npcs, player, profiles }) : npcMode ? serializeNpcWorldSessionSave({ city: state, outside, npcs }) : world ? serializeWorldSessionSave({ city: state, outside }) : serializeTileTrialSave(state, ruleset);
    if (!result.success) { checkpointError(result.error.message); return; }
    let url: string | undefined; let anchor: HTMLAnchorElement | undefined;
    try {
      url = URL.createObjectURL(new Blob([result.text], { type: 'application/json' }));
      anchor = document.createElement('a'); anchor.href = url; anchor.download = `haven-${lifeMode ? 'world-life' : npcMode ? 'world-npc' : world ? 'world' : populationMode ? 'population' : 'tile'}-week-${state.world.week}.json`;
      document.body.append(anchor); anchor.click(); error = ''; saveNotice = 'Checkpoint download requested.';
    } catch { checkpointError('Could not download the checkpoint. Your game was preserved.'); }
    finally { anchor?.remove(); if (url) URL.revokeObjectURL(url); }
  }
  function loadWorldSession(loaded: unknown, expectedRevision: number, notice: string, invalidateReads = false) {
    if (!outside || (npcMode && !npcs) || (lifeMode && !(player && profiles))) { checkpointError('A world session is not available. Reload to try New Game again.'); return false; }
    const prepared = lifeMode ? prepareCharacterLifeLoad({ city: state, outside, npcs: npcs!, player: player!, profiles: profiles! }, loaded, expectedRevision)
      : npcs ? prepareNpcWorldSessionLoad({ city: state, outside, npcs }, loaded, expectedRevision) : prepareWorldSessionLoad({ city: state, outside }, loaded, expectedRevision);
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
    if (!lifeMode) { workforceError = ''; managementError = null; }
    if (state.phase !== 'planning') { checkpointError('Choose Plan next week before importing.'); return; }
    if (file.size > TILE_SAVE_MAX_BYTES) { checkpointError('Checkpoint exceeds the 1 MiB limit.'); return; }
    try {
      const text = await file.text();
      if (ticket !== importRead) return;
      if (world) {
        const result = lifeMode ? deserializeCharacterLifeSave(text) : npcMode ? deserializeNpcWorldSessionSave(text) : deserializeWorldSessionSave(text);
        if (!result.success) { checkpointError(result.error.message); return; }
        loadWorldSession(result.state, expectedRevision, 'Checkpoint imported. Planning restored.');
        return;
      }
      const result = deserializeTileTrialSave(text, ruleset);
      if (!result.success) { checkpointError(result.error.message); return; }
      if (command('LOAD_TRIAL', { snapshot: result.state }, expectedRevision)) saveNotice = 'Checkpoint imported. Planning restored.';
    } catch { if (ticket === importRead) checkpointError('Could not read the checkpoint file. Your game was preserved.'); }
  }
  function saveLocally() {
    const result = lifeMode ? saveLocalCharacterLife({ city: state, outside, npcs, player, profiles }) : npcMode ? saveLocalNpcWorldSession({ city: state, outside, npcs }) : world ? saveLocalWorldSession({ city: state, outside }) : saveLocalCheckpoint(state, ruleset);
    if (!result.success) { checkpointError(result.message); return; }
    error = ''; saveNotice = result.replaced ? 'Saved in this browser. Replaced the previous local checkpoint.' : 'Saved in this browser.';
  }
  function continueLocally() {
    if (world) {
      const expectedRevision = state.revision;
      const result = lifeMode ? readLocalCharacterLife() : npcMode ? readLocalNpcWorldSession() : readLocalWorldSession();
      if (!result.success) { checkpointError(result.message); return; }
      loadWorldSession(result.state, expectedRevision, 'Local checkpoint loaded. Planning restored.', true);
      return;
    }
    const result = readLocalCheckpoint(ruleset);
    if (!result.success) { checkpointError(result.message); return; }
    // A file read still pending must not overwrite the restored plan or this feedback.
    if (command('LOAD_TRIAL', { snapshot: result.state })) { importRead++; saveNotice = 'Local checkpoint loaded. Planning restored.'; }
  }
</script>

{#if lifeMode && outside && npcs && player && profiles}
  <CharacterLifeShell bind:this={lifeShell} {state} {report} bind:destination bind:activeWindow {error} status={lifeStatus} {unapplied} onendweek={endLifeWeek}>
    {#snippet playerInfo()}
      <p>{player!.character.name}</p><p>Leader of Haven</p>
    {/snippet}
    {#snippet city()}
      <details class="card"><summary>Food requirements</summary>
        <h3>Current inventory</h3>
        <dl><div><dt>Food stock</dt><dd data-testid="trial-stock-food">{units(settlement.inventory.food)}</dd></div></dl>
      </details>
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
    <p>Save locally keeps one checkpoint per mode in this browser profile and site, replacing that mode's previous one; clearing site data removes it. Continue locally restores this mode's checkpoint.</p>
    <p>Export a JSON file as a portable backup; Import replaces the current plan after validation. No autosave or cloud save.</p>
    </details>
    {#if locked}<p>Choose Plan next week before saving, continuing, exporting or importing.</p>{/if}
    <button disabled={checkpointLocked} onclick={saveLocally}>Save locally</button>
    <button disabled={checkpointLocked} onclick={continueLocally}>Continue locally</button>
    <button disabled={checkpointLocked} onclick={exportCheckpoint}>Export checkpoint</button>
    <label for="tile-save-file">Import checkpoint</label>
    <input id="tile-save-file" type="file" accept=".json,application/json" disabled={checkpointLocked} onchange={importCheckpoint} />
    {#if saveNotice}<p role="status">{saveNotice}</p>{/if}
  </section>

      <ErrorLog />
    {/snippet}
    {#snippet help()}
  <details class="card">
    <summary>Getting started</summary>
    <p>Farm and Food Processor start with 2 WF each, feeding 100 residents. Build Logging Camp on forest-1 (2 WF), Iron Mine on ore-1 (1 WF), Goods Workshop on plain-2 (1 WF), and Market on plain-3. Then End Week.{#if populationMode} For immigration, also raise Farm and Food Processor to 3 WF each; stored Food alone does not attract arrivals.{/if}</p>
    <p>Extract first, process second: Farm → Wheat → Food Processor → Food. Logging Camp → Wood and Iron Mine → Iron supply the Workshop; a Market enables Goods service. Assign whole WF from the shared pool.</p>
    <p>Build and replace pay full cost; replacement resets level and workers, with no refund. Upgrades cost base cost × next level. Pause releases workers and avoids upkeep; unfunded buildings idle without debt. Pause buildings to save tax income when Gold is low.</p>
  </details>

<details class="card"><summary>Weekly rules</summary>
    <p>TRIAL: tax {units(B.taxGoldPerResident)} Gold/resident/week; Goods demand {units(B.goodsDemandPerResident)} service/resident/week. Workshop: 1 WF + {units(B.goodsWoodPerBatch)} Wood + {units(B.goodsIronPerBatch)} Iron → {units(B.goodsServicePerBatch)} service. Market: {units(B.marketServicePerLevel)} service/level; raises capacity, not demand. Whole Workshop batches may have unused service; nothing carries over.</p>
    <p>Goods earns {units(B.goldPerServiceMilli)} Gold/service and up to {B.goodsHappinessMax} Happiness at full fulfillment. Food need: {units(B.foodDemandPerResident)} per resident/week. Maintenance is funded in tile order; tax arrives first.</p>
</details>
<details class="card"><summary>About this build</summary>
  <p>Balance and building policies are TRIAL. Character profiles are TRIAL content. Weekly life events and Player interactions are not available yet.</p>
  <p>Immigration is TRIAL. Arrivals join next week. Old tile checkpoints continue in Legacy tile trial.</p>
  <p>Goods is a city Requirement, with no stored Goods. Security, Corruption and Tension are not simulated here.</p>
  <a href="/">Classic Weekly</a> · <a href="/?mode=tiles">Legacy tile trial</a> · <a href="/?mode=population">Play population trial</a> · <a href="/?mode=world">World Session without NPCs</a> · <a href="/?mode=world-npc">World Session with NPCs</a>
</details>
    {/snippet}
  </CharacterLifeShell>
{:else}
<main lang="en">
  <header class="card">
    <p class="eyebrow">HAVEN · WEEKLY PROTOTYPE</p>
    <h1>{lifeMode ? 'Character Life' : world ? 'World Session' : populationMode ? 'Population Trial' : 'Tile Building Trial'}</h1>
    <p>Build a supply chain for your city. Balance and building policies are TRIAL. Reload starts fresh · Continue locally or import a checkpoint to resume.</p>
    <p>Week <strong>{state.world.week}</strong> · {locked ? 'Report' : 'Planning'} · {settlement.cohorts.reduce((n, c) => n + c.count, 0)} residents · {assigned} / {units(weeklyWorkforceMilli(settlement.cohorts))} WF assigned</p>
    <a href="/">Classic Weekly</a> · <a href={populationMode ? '/?mode=tiles' : '/?mode=population'}>{populationMode ? 'Legacy tile trial' : 'Play population trial'}</a>
    {#if populationMode}<p>Immigration is TRIAL. Arrivals join next week. Old tile checkpoints continue in Legacy tile trial.</p>{/if}
  </header>

  {#if world && outsideSummary}
    <section class="card" aria-label="Outside world">
      <h2>Outside world</h2>
      <p>Outside tiles: {outsideSummary.total} · Yours: {outsideSummary.mine} · Held by other factions: {outsideSummary.others} · Neutral: {outsideSummary.neutral} · Explored by you: {outsideSummary.explored}</p>
      <p>Exploration, claiming and extraction are not available yet.</p>
    </section>
  {/if}

  {#if lifeMode && player}
    <section class="card player" aria-label="Player">
      <p class="eyebrow">Player · leader of Haven</p>
      <h2>{player.character.name}</h2>
      <CharacterProfile view={{ character: player.character, profile: player.profile, role: 'player', postBuildingName: null }} />
    </section>
  {/if}

  {#if npcs && outside}
    <WorldNpcPanel session={{ city: state, outside, npcs }} player={lifeMode ? player : null} {profiles} {locked} onapply={next => {
      if (isLiveCharacterLifeSessionState(next)) ({ city: state, outside, npcs, player, profiles } = next);
      else ({ city: state, outside, npcs } = next);
      saveNotice = ''; error = '';
    }} />
  {/if}

  <section class="card" aria-label="Planning checkpoints">
    <h2>Planning checkpoint</h2>
    <p>Save locally keeps one checkpoint per mode in this browser profile and site, replacing that mode's previous one; clearing site data removes it. Continue locally restores this mode's checkpoint.</p>
    <p>Export a JSON file as a portable backup; Import replaces the current plan after validation. No autosave or cloud save.</p>
    {#if locked}<p>Choose Plan next week before saving, continuing, exporting or importing.</p>{/if}
    <button disabled={checkpointLocked} onclick={saveLocally}>Save locally</button>
    <button disabled={checkpointLocked} onclick={continueLocally}>Continue locally</button>
    <button disabled={checkpointLocked} onclick={exportCheckpoint}>Export checkpoint</button>
    <label for="tile-save-file">Import checkpoint</label>
    <input id="tile-save-file" type="file" accept=".json,application/json" disabled={checkpointLocked} onchange={importCheckpoint} />
    {#if saveNotice}<p role="status">{saveNotice}</p>{/if}
    {#if error}<p role="alert">{error}</p>{/if}
  </section>

  <section class="card" aria-label="City stocks" data-testid="trial-stocks">
    <h2>City stocks</h2>
    <dl class="stocks">
      {#each WEEKLY_RESOURCE_KEYS as key}
        <div><dt>{key[0].toUpperCase() + key.slice(1)}</dt><dd data-testid={`trial-stock-${key}`}>{units(settlement.inventory[key])}</dd></div>
      {/each}
    </dl>
    <p>Goods is a city Requirement, with no stored Goods. Happiness: <strong>{state.happiness}</strong> / 100. Security, Corruption and Tension are not simulated here.</p>
  </section>

  <details class="card" open>
    <summary>First supply chain</summary>
    <p>Farm and Food Processor start with 2 WF each, feeding 100 residents. Build Logging Camp on forest-1 (2 WF), Iron Mine on ore-1 (1 WF), Goods Workshop on plain-2 (1 WF), and Market on plain-3. Then End Week.{#if populationMode} For immigration, also raise Farm and Food Processor to 3 WF each; stored Food alone does not attract arrivals.{/if}</p>
    <p>Extract first, process second: Farm → Wheat → Food Processor → Food. Logging Camp → Wood and Iron Mine → Iron supply the Workshop; a Market enables Goods service. Assign whole WF from the shared pool.</p>
    <p>Build and replace pay full cost; replacement resets level and workers, with no refund. Upgrades cost base cost × next level. Pause releases workers and avoids upkeep; unfunded buildings idle without debt. Pause buildings to save tax income when Gold is low.</p>
  </details>

  <div class="layout">
    <section class="card" aria-label="City tiles">
      <h2>City tiles</h2>
      <div class="tiles">
        {#each state.tiles as tile}
          <button class:selected={selectedId === tile.id} class="tile" aria-label={`Select ${tile.id}`} aria-pressed={selectedId === tile.id}
            data-testid={`trial-tile-${tile.id}`} onclick={() => selectTile(tile.id)}>
            <span class="terrain">{tile.terrain}</span><strong>{tile.id}</strong>
            {#if tile.building}
              <span>{TRIAL_BUILDINGS[tile.building.typeId].name}</span>
              <span>Level {tile.building.level} · {tile.building.workers} WF · {tile.building.enabled ? 'Active' : 'Paused'}</span>
            {:else}<span>Empty</span>{/if}
          </button>
        {/each}
      </div>
    </section>

    <section class="card" aria-label="Manage tile">
      <h2>{selected.id} · {selected.terrain}</h2>
      {#if selected.building && definition}
        <h3>{definition.name} · Level {selected.building.level}</h3>
        <p>Upkeep: {units(definition.upkeepMilli * selected.building.level)} Gold/week. Farm batch Gold credits this Farm's upkeep.</p>
        <p id="trial-workers-confirmed">Assigned: <strong>{selected.building.workers} WF</strong>. Kept for future weeks until changed.</p>
        <label for="trial-workers">Assigned workers (WF)</label>
        <input id="trial-workers" type="text" inputmode="numeric" bind:value={workers} oninput={() => { workforceError = ''; }} disabled={locked || !selected.building.enabled}
          aria-invalid={workforceError ? 'true' : 'false'}
          aria-describedby={`trial-workers-confirmed${workers !== String(selected.building.workers) ? ' trial-workers-draft' : ''}${workforceError ? ' trial-workers-error' : ''}`} />
        {#if workforceError}<p id="trial-workers-error" role="alert">{workforceError}</p>{/if}
        {#if workers !== String(selected.building.workers)}<p id="trial-workers-draft">Unapplied draft. Assigned workforce remains {selected.building.workers} WF. Select Assign workers to apply.</p>{/if}
        <p>Capacity: {definition.maxWorkers * selected.building.level} WF.</p>
        <button disabled={locked || !selected.building.enabled} onclick={() => command('SET_WORKERS', { tileId: selectedId, workers: /^\d+$/.test(workers) ? Number(workers) : -1 })}>Assign workers</button>
        <button disabled={locked} aria-describedby={managementError?.action === 'SET_ENABLED' ? 'trial-management-error' : undefined}
          onclick={() => command('SET_ENABLED', { tileId: selectedId, enabled: !selected.building!.enabled })}>{selected.building.enabled ? 'Pause' : 'Resume'}</button>
        {#if managementError?.action === 'SET_ENABLED'}<p id="trial-management-error" role="alert" use:revealManagementError={managementError}>{managementError.message}</p>{/if}
        {#if selected.building.level < definition.maxLevel}
          <p>Upgrade cost: {units(definition.cost.gold * (selected.building.level + 1))} Gold, {units(definition.cost.wood * (selected.building.level + 1))} Wood, {units(definition.cost.iron * (selected.building.level + 1))} Iron.</p>
          <button disabled={locked} aria-describedby={managementError?.action === 'UPGRADE' ? 'trial-management-error' : undefined}
            onclick={() => command('UPGRADE', { tileId: selectedId })}>Upgrade</button>
          {#if managementError?.action === 'UPGRADE'}<p id="trial-management-error" role="alert" use:revealManagementError={managementError}>{managementError.message}</p>{/if}
        {:else}<p>Maximum trial level.</p>{/if}
      {:else}<p>Empty tile. Choose a compatible building.</p>{/if}

      <label for="trial-type">Building type</label>
      <select id="trial-type" bind:value={typeId} disabled={locked}>
        {#each Object.entries(TRIAL_BUILDINGS) as [id, d]}<option value={id}>{d.name}</option>{/each}
      </select>
      <p>Requires {chosen.terrain.join(' or ')} terrain. Cost: {units(chosen.cost.gold)} Gold, {units(chosen.cost.wood)} Wood, {units(chosen.cost.iron)} Iron. Upkeep: {units(chosen.upkeepMilli)} Gold/week at level 1.</p>
      <button disabled={locked} aria-describedby={managementError?.action === 'BUILD' || managementError?.action === 'REPLACE' ? 'trial-management-error' : undefined}
        onclick={() => command(selected.building ? 'REPLACE' : 'BUILD', { tileId: selectedId, typeId })}>{selected.building ? 'Replace' : 'Build'}</button>
      {#if managementError?.action === 'BUILD' || managementError?.action === 'REPLACE'}<p id="trial-management-error" role="alert" use:revealManagementError={managementError}>{managementError.message}</p>{/if}
    </section>
  </div>

  <section class="card">
    <h2>Resolve the week</h2>
    <p>TRIAL: tax {units(B.taxGoldPerResident)} Gold/resident/week; Goods demand {units(B.goodsDemandPerResident)} service/resident/week. Workshop: 1 WF + {units(B.goodsWoodPerBatch)} Wood + {units(B.goodsIronPerBatch)} Iron → {units(B.goodsServicePerBatch)} service. Market: {units(B.marketServicePerLevel)} service/level; raises capacity, not demand. Whole Workshop batches may have unused service; nothing carries over.</p>
    <p>Goods earns {units(B.goldPerServiceMilli)} Gold/service and up to {B.goodsHappinessMax} Happiness at full fulfillment. Food need: {units(B.foodDemandPerResident)} per resident/week. Maintenance is funded in tile order; tax arrives first.</p>
    <button disabled={locked} onclick={() => command('END_WEEK', { expectedWeek: state.world.week })}>End Week</button>
  </section>

  {#if report}
    <section class="card" aria-label="Trial week report" aria-live="polite">
      <h2>Week {report.week} report</h2>
      {#if report.immigration}<p data-testid="trial-immigration">Population: {report.immigration.populationBefore} → {report.immigration.populationAfter} · {report.immigration.arrivals} arrivals · Available next week.</p>{/if}
      {#if !locked}<p>Previous report · Planning is active.</p>{/if}
      <p data-testid="trial-goods">Goods service: {units(report.goods.servedMilli)} / {units(report.goods.demandMilli)} · {report.goods.fulfillmentBps / 100}% {report.goods.demandMilli === 0 ? '(no demand)' : 'fulfilled'}. Materials used once: {units(report.goods.woodUsed)} Wood, {units(report.goods.ironUsed)} Iron. Revenue: {units(report.goods.revenueMilli)} Gold.</p>
      <p>Tax: {units(report.taxMilli)} Gold. Upkeep covered: {units(report.upkeepPaidMilli)} Gold; unfunded: {units(report.unpaidUpkeepMilli)} Gold (no debt). Farm batch payment: {units(report.farmBatchGoldMilli)} Gold; extra Farm upkeep: {units(report.farmExtraUpkeepMilli)} Gold.</p>
      <p>Food consumed: {units(report.foodConsumedMilli)} / {units(report.foodDemandMilli)}. Happiness: {report.happinessBefore} → {report.happinessAfter}.</p>
      <div class="ledger"><table><caption>Weekly stock ledger</caption><thead><tr><th>Stock</th><th>Before</th><th>Net</th><th>After</th></tr></thead><tbody>
        {#each WEEKLY_RESOURCE_KEYS as key}<tr><th>{key}</th><td>{units(report.before[key])}</td><td>{units(report.after[key] - report.before[key])}</td><td>{units(report.after[key])}</td></tr>{/each}
      </tbody></table></div>
      <details><summary>Building activity</summary><ul>{#each report.activities as activity}<li>{activity}</li>{/each}</ul></details>
      <button disabled={!locked} onclick={() => command('NEXT_WEEK')}>Plan next week</button>
    </section>
  {/if}
  <ErrorLog />
</main>
{/if}

<style>
  main { max-width: 1180px; margin: auto; padding: 24px; }
  .card { margin-bottom: 16px; } h1 { font-size: 1.9rem; } h2 { font-size: 1.2rem; margin-bottom: 12px; }
  p { margin: 12px 0; line-height: 1.55; } a { color: var(--accent-green); }
  .eyebrow, .terrain { color: var(--text-muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; }
  .stocks { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; } dd { margin: 4px 0; font-size: 1.6rem; }
  .layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; } .tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .tile { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; text-align: left; background: var(--bg-tertiary); color: var(--text-main); min-height: 125px; }
  .tile.selected { border-color: var(--accent-green); box-shadow: inset 0 0 0 1px var(--accent-green); }
  label { display: block; margin: 16px 0 8px; } input, select, button { font: inherit; border-radius: 6px; padding: 10px; border: 1px solid var(--border-color); }
  input, select { color: var(--text-main); background: var(--bg-tertiary); max-width: 100%; } input { width: 7rem; }
  button { background: var(--accent-green); color: #000; cursor: pointer; margin: 4px 4px 4px 0; } button:disabled { opacity: .5; cursor: default; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; } [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
  #trial-management-error { scroll-margin-block: 1px; }
  .player { overflow-wrap: anywhere; }
  .ledger { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: 8px; text-align: right; border-bottom: 1px solid var(--border-color); } th:first-child { text-align: left; }
  @media(max-width: 750px) { .layout { grid-template-columns: 1fr; } .stocks { grid-template-columns: repeat(3, 1fr); } main { padding: 12px; } }
</style>
