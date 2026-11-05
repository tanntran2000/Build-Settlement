<script lang="ts">
  import { buildingWorkerCap, managerSlotTileIds, summarizeOutside, TRIAL_BUILDINGS, type TileTrialState, type WorldNpc, type OutsideWorldState } from '@haven/core';
  import {workerDigits,assignBuildingWorkers} from './clearing-workers.js';
  import OutsideCity from './OutsideCity.svelte';
  import CouncilPanel from './CouncilPanel.svelte';
  import LibraryPanel from './LibraryPanel.svelte';
  import InsideCity from './InsideCity.svelte';
  import { buildOptions } from './society-view.js';
  import { formatMilli as units } from './milli-format.js';

  export let state: TileTrialState;
  export let npcs: WorldNpc[];
  export let selectedId: string;
  export let typeId: string;
  export let workers: string;
  export let workforceError: string;
  export let managementError: { action: string; message: string } | null;
  export let outside: OutsideWorldState;
  export let onselect: (id: string) => void;
  export let onworkersinput: () => void;
  export let onworkersinvalid: () => void = () => {};
  export let oncommand: (type: string, fields?: Record<string, unknown>) => boolean;
  let managementHeading: HTMLHeadingElement | undefined;
  $: selected = state.tiles.find(tile => tile.id === selectedId)!;
  $: definition = selected.building ? TRIAL_BUILDINGS[selected.building.typeId] : null;
  $: options = buildOptions(state,selectedId);
  $: if (!options.some(o=>o.typeId===typeId&&o.available)) typeId=options.find(o=>o.available)?.typeId??'';
  $: chosen = TRIAL_BUILDINGS[typeId];
  $: locked = state.phase === 'report';
  $: slots = managerSlotTileIds(state);
  $: outsideSummary = summarizeOutside(outside, 'player');

  function assignWorkers():void {
    const message=assignBuildingWorkers(workers,selectedId,oncommand);
    if(message){workforceError=message;onworkersinvalid();}
  }
  export function focusManage(): void { managementHeading?.focus(); }
  function revealManagementError(node: HTMLParagraphElement, failure: typeof managementError) {
    const reveal = (current: typeof failure) => { if (current) node.scrollIntoView({ block: 'nearest' }); };
    reveal(failure);
    return { update: reveal };
  }
</script>

  <InsideCity {state} {selectedId} {locked} {managementError} {onselect} {oncommand} />
  <LibraryPanel {state} {locked} {managementError} {oncommand} />
  <div class="layout">
    <OutsideCity {state} {npcs} {selectedId} {locked} {managementError} {onselect} {oncommand} />

    <section class="card" aria-label="Manage tile">
      <h3 bind:this={managementHeading} tabindex="-1">{selected.id} · {selected.terrain}</h3>
      {#if selected.building && definition}
        <h3>{definition.name} · Level {selected.building.level}</h3>
        <p>Upkeep: {units(definition.upkeepMilli * selected.building.level)} Gold/week. Farm batch Gold credits this Farm's upkeep.</p>
        <p id="trial-workers-confirmed">Assigned: <strong>{selected.building.workers} WF</strong>. Kept for future weeks until changed.</p>
        <label for="trial-workers">Assigned workers (WF)</label>
        <input id="trial-workers" type="text" inputmode="numeric" pattern="[0-9]*" bind:value={workers} oninput={event=>{workers=workerDigits(event.currentTarget.value);event.currentTarget.value=workers;workforceError='';onworkersinput();}} disabled={locked || !selected.building.enabled}
          aria-invalid={workforceError ? 'true' : 'false'}
          aria-describedby={`trial-workers-confirmed${workers !== String(selected.building.workers) ? ' trial-workers-draft' : ''}${workforceError ? ' trial-workers-error' : ''}`} />
        {#if workforceError}<p id="trial-workers-error" role="alert">{workforceError}</p>{/if}
        {#if workers !== String(selected.building.workers)}<p id="trial-workers-draft">Unapplied draft. Assigned workforce remains {selected.building.workers} WF. Select Assign workers to apply.</p>{/if}
        <p>Capacity: {buildingWorkerCap(selected.building.typeId, selected.building.level)} WF.</p>
        <details><summary>Building limits</summary><p>Maximum level: {definition.maxLevel}.</p></details>
        <button disabled={locked || !selected.building.enabled} onclick={assignWorkers}>Assign workers</button>
        <button disabled={locked} aria-describedby={managementError?.action === 'SET_ENABLED' ? 'trial-management-error' : undefined}
          onclick={() => oncommand('SET_ENABLED', { tileId: selectedId, enabled: !selected.building!.enabled })}>{selected.building.enabled ? 'Pause' : 'Resume'}</button>
        {#if managementError?.action === 'SET_ENABLED'}<p id="trial-management-error" role="alert" use:revealManagementError={managementError}>{managementError.message}</p>{/if}
        {#if selected.building.level < definition.maxLevel}
          <p>Upgrade cost: {units(definition.cost.gold * (selected.building.level + 1))} Gold, {units(definition.cost.wood * (selected.building.level + 1))} Wood, {units(definition.cost.iron * (selected.building.level + 1))} Iron.</p>
          <button disabled={locked} aria-describedby={managementError?.action === 'UPGRADE' ? 'trial-management-error' : undefined}
            onclick={() => oncommand('UPGRADE', { tileId: selectedId })}>Upgrade</button>
          {#if managementError?.action === 'UPGRADE'}<p id="trial-management-error" role="alert" use:revealManagementError={managementError}>{managementError.message}</p>{/if}
        {:else}<p>Maximum trial level.</p>{/if}
      {:else}<p>Empty tile. Choose a compatible building.</p>{/if}

      {#if selected.building?.typeId === 'town-hall'}<CouncilPanel {state} {locked} {oncommand} {managementError} />{/if}
      <p>Replace pays full cost and resets level and workers; no refund</p>
      <label for="trial-type">Building type</label>
      <select id="trial-type" bind:value={typeId} disabled={locked}>
        {#each options as option}<option value={option.typeId} disabled={!option.available}>{option.label}</option>{/each}
      </select>
      {#if chosen}<p>Requires {chosen.terrain.join(' or ')} terrain. Cost: {units(chosen.cost.gold)} Gold, {units(chosen.cost.wood)} Wood, {units(chosen.cost.iron)} Iron. Upkeep: {units(chosen.upkeepMilli)} Gold/week at level 1.</p>{/if}
      <button disabled={locked || !chosen || !options.some(o=>o.typeId===typeId&&o.available)} aria-describedby={managementError?.action === 'BUILD' || managementError?.action === 'REPLACE' ? 'trial-management-error' : undefined}
        onclick={() => oncommand(selected.building ? 'REPLACE' : 'BUILD', { tileId: selectedId, typeId })}>{selected.building ? 'Replace' : 'Build'}</button>
      {#if managementError?.action === 'BUILD' || managementError?.action === 'REPLACE'}<p id="trial-management-error" role="alert" use:revealManagementError={managementError}>{managementError.message}</p>{/if}
    </section>
  </div>

<details class="planning-notes"><summary>Planning settings</summary>
  <p>Enabled is a planning setting, not proof of operation last week. Assigned workforce and capacity are planning values, not work completed.</p>
</details>
<section class="card" aria-label="Outside world">
  <details>
    <summary>Outside world</summary>
    <p>Outside tiles: {outsideSummary.total} · Yours: {outsideSummary.mine} · Held by other factions: {outsideSummary.others} · Neutral: {outsideSummary.neutral} · Explored by you: {outsideSummary.explored}</p>
    <p>Exploration is not available yet.</p>
  </details>
</section>
<style>
  section { min-width: 0; overflow-wrap: anywhere; }
  .card { margin-bottom: 16px; background: var(--bg-tertiary); padding: 20px; } h3 { font-size: var(--life-card-heading); margin-bottom: 12px; }
  p { margin: 8px 0; line-height: 1.5; }
  .layout { display: grid; grid-template-columns: minmax(0, 1.66fr) minmax(0, 1fr); gap: 22px; align-items: start; }
  label { display: block; margin: 12px 0 8px; } input, select, button { font: inherit; border-radius: 8px; padding: 10px; border: 1px solid var(--life-control-border); }
  input, select { color: var(--text-main); background: transparent; max-width: 100%; } input { width: 7rem; }
  button { background: transparent; color: var(--text-main); cursor: pointer; margin: 4px 4px 4px 0; } button:disabled { cursor: default; }
  .planning-notes { margin: 4px 0 16px; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; } [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
  #trial-management-error { scroll-margin-block: 1px; }
  @media(min-width: 1440px) { .card { padding: 24px; } }
  @media(max-width: 1100px) { .layout { grid-template-columns: minmax(0, 1fr); } }
  @media(max-width: 500px) { .card { padding: 16px; } }
</style>
