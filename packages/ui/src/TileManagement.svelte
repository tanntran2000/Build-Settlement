<script lang="ts">
  import { createTileTrialState, weeklyWorkforceMilli, WEEKLY_RESOURCE_KEYS, TRIAL_BUILDINGS, TILE_TRIAL_BALANCE as B, type TileTrialReport } from '@haven/core';
  import { executeTileTrialCommand } from '@haven/simulation';
  import { serializeTileTrialSave, deserializeTileTrialSave, TILE_SAVE_MAX_BYTES } from '@haven/persistence';
  import ErrorLog from './ErrorLog.svelte';
  import { errorLog } from './error-log.js';

  let state = createTileTrialState();
  let selectedId = 'forest-1';
  let typeId = 'logging';
  let workers = '0';
  let error = '';
  let saveNotice = '';
  let importRead = 0;
  let report: Readonly<TileTrialReport> | null = null;
  const units = (n: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(n / 1000);
  $: settlement = state.world.settlements[state.world.activeSettlementId!];
  $: selected = state.tiles.find(t => t.id === selectedId)!;
  $: definition = selected.building ? TRIAL_BUILDINGS[selected.building.typeId] : null;
  $: assigned = state.tiles.reduce((sum, t) => sum + (t.building?.workers ?? 0), 0);
  $: locked = state.phase === 'report';
  $: chosen = TRIAL_BUILDINGS[typeId];
  errorLog.setContext('weekly', { week: state.world.week });

  function selectTile(id: string) {
    selectedId = id;
    workers = String(state.tiles.find(t => t.id === id)!.building?.workers ?? 0);
    error = '';
  }
  function command(type: string, fields: Record<string, unknown> = {}, expectedRevision = state.revision) {
    saveNotice = '';
    const result = executeTileTrialCommand(state, { type, expectedRevision, ...fields });
    if (!result.success) {
      error = result.error.message;
      errorLog.record(type === 'END_WEEK' ? 'END_WEEK' : 'RUNTIME', 'INVALID_COMMAND');
      return false;
    }
    state = result.nextState;
    if (result.report) report = result.report;
    // Keep the last report mounted so a repeated pointer click cannot fall onto End Week.
    if (type === 'LOAD_TRIAL') report = null;
    workers = String(state.tiles.find(t => t.id === selectedId)!.building?.workers ?? 0);
    errorLog.setContext('weekly', { week: state.world.week });
    error = '';
    return true;
  }
  function checkpointError(message: string) {
    error = message; saveNotice = '';
    errorLog.record('RUNTIME', 'INVALID_COMMAND');
  }
  function exportCheckpoint() {
    const result = serializeTileTrialSave(state);
    if (!result.success) { checkpointError(result.error.message); return; }
    let url: string | undefined; let anchor: HTMLAnchorElement | undefined;
    try {
      url = URL.createObjectURL(new Blob([result.text], { type: 'application/json' }));
      anchor = document.createElement('a'); anchor.href = url; anchor.download = `haven-tile-week-${state.world.week}.json`;
      document.body.append(anchor); anchor.click(); error = ''; saveNotice = 'Checkpoint download requested.';
    } catch { checkpointError('Could not download the checkpoint. Your game was preserved.'); }
    finally { anchor?.remove(); if (url) URL.revokeObjectURL(url); }
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
      const result = deserializeTileTrialSave(text);
      if (!result.success) { checkpointError(result.error.message); return; }
      if (command('LOAD_TRIAL', { snapshot: result.state }, expectedRevision)) saveNotice = 'Checkpoint imported. Planning restored.';
    } catch { if (ticket === importRead) checkpointError('Could not read the checkpoint file. Your game was preserved.'); }
  }
</script>

<main lang="en">
  <header class="card">
    <p class="eyebrow">HAVEN · WEEKLY PROTOTYPE</p>
    <h1>Tile Building Trial</h1>
    <p>Build a supply chain for your city. Balance and building policies are TRIAL. Reload starts fresh · Import a checkpoint to resume.</p>
    <p>Week <strong>{state.world.week}</strong> · {locked ? 'Report' : 'Planning'} · {settlement.cohorts.reduce((n, c) => n + c.count, 0)} residents · {assigned} / {units(weeklyWorkforceMilli(settlement.cohorts))} WF assigned</p>
    <a href="/">Classic Weekly</a>
  </header>

  <section class="card" aria-label="Planning checkpoints">
    <h2>Planning checkpoint</h2>
    <p>Export a JSON file to keep this plan. Import replaces the current plan after validation. No autosave or cloud save.</p>
    {#if locked}<p>Choose Plan next week before exporting or importing.</p>{/if}
    <button disabled={locked} onclick={exportCheckpoint}>Export checkpoint</button>
    <label for="tile-save-file">Import checkpoint</label>
    <input id="tile-save-file" type="file" accept=".json,application/json" disabled={locked} onchange={importCheckpoint} />
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
    <p>Farm and Food Processor start with 2 WF each, feeding 100 residents. Build Logging Camp on forest-1 (2 WF), Iron Mine on ore-1 (1 WF), Goods Workshop on plain-2 (1 WF), and Market on plain-3. Then End Week.</p>
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
        <label for="trial-workers">Assigned workers (WF)</label>
        <input id="trial-workers" type="text" inputmode="numeric" bind:value={workers} disabled={locked || !selected.building.enabled} />
        <p>Capacity: {definition.maxWorkers * selected.building.level} WF.</p>
        <button disabled={locked || !selected.building.enabled} onclick={() => command('SET_WORKERS', { tileId: selectedId, workers: /^\d+$/.test(workers) ? Number(workers) : -1 })}>Assign workers</button>
        <button disabled={locked} onclick={() => command('SET_ENABLED', { tileId: selectedId, enabled: !selected.building!.enabled })}>{selected.building.enabled ? 'Pause' : 'Resume'}</button>
        {#if selected.building.level < definition.maxLevel}
          <p>Upgrade cost: {units(definition.cost.gold * (selected.building.level + 1))} Gold, {units(definition.cost.wood * (selected.building.level + 1))} Wood, {units(definition.cost.iron * (selected.building.level + 1))} Iron.</p>
          <button disabled={locked} onclick={() => command('UPGRADE', { tileId: selectedId })}>Upgrade</button>
        {:else}<p>Maximum trial level.</p>{/if}
      {:else}<p>Empty tile. Choose a compatible building.</p>{/if}

      <label for="trial-type">Building type</label>
      <select id="trial-type" bind:value={typeId} disabled={locked}>
        {#each Object.entries(TRIAL_BUILDINGS) as [id, d]}<option value={id}>{d.name}</option>{/each}
      </select>
      <p>Requires {chosen.terrain.join(' or ')} terrain. Cost: {units(chosen.cost.gold)} Gold, {units(chosen.cost.wood)} Wood, {units(chosen.cost.iron)} Iron. Upkeep: {units(chosen.upkeepMilli)} Gold/week at level 1.</p>
      <button disabled={locked} onclick={() => command(selected.building ? 'REPLACE' : 'BUILD', { tileId: selectedId, typeId })}>{selected.building ? 'Replace' : 'Build'}</button>
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
  .ledger { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: 8px; text-align: right; border-bottom: 1px solid var(--border-color); } th:first-child { text-align: left; }
  @media(max-width: 750px) { .layout { grid-template-columns: 1fr; } .stocks { grid-template-columns: repeat(3, 1fr); } main { padding: 12px; } }
</style>
