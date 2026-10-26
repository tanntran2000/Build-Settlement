<script lang="ts">
  import { managerSlotTileIds, summarizeOutside, TRIAL_BUILDINGS, type TileTrialState, type WorldNpc, type OutsideWorldState } from '@haven/core';
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
  export let oncommand: (type: string, fields?: Record<string, unknown>) => boolean;
  let managementHeading: HTMLHeadingElement | undefined;
  $: selected = state.tiles.find(tile => tile.id === selectedId)!;
  $: definition = selected.building ? TRIAL_BUILDINGS[selected.building.typeId] : null;
  $: chosen = TRIAL_BUILDINGS[typeId];
  $: locked = state.phase === 'report';
  $: slots = managerSlotTileIds(state);
  $: outsideSummary = summarizeOutside(outside, 'player');

  export function focusManage(): void { managementHeading?.focus(); }
  function revealManagementError(node: HTMLParagraphElement, failure: typeof managementError) {
    const reveal = (current: typeof failure) => { if (current) node.scrollIntoView({ block: 'nearest' }); };
    reveal(failure);
    return { update: reveal };
  }
</script>

<p>Enabled is a planning setting, not proof of operation last week. Assigned workforce and capacity are planning values, not work completed.</p>
  <div class="layout">
    <section class="card" aria-label="City tiles">
      <h2>City tiles</h2>
      <div class="tiles">
        {#each state.tiles as tile}
          <button class:selected={selectedId === tile.id} class="tile" aria-label={`Select ${tile.id}`} aria-pressed={selectedId === tile.id}
            data-testid={`trial-tile-${tile.id}`} onclick={() => onselect(tile.id)}>
            <span class="terrain">{tile.terrain}</span><strong>{tile.id}</strong>
            {#if tile.building}
              <span>{TRIAL_BUILDINGS[tile.building.typeId].name}</span>
              <span>Level {tile.building.level} · {tile.building.workers} WF · {tile.building.enabled ? 'Enabled' : 'Paused'}</span>
            {:else}<span>Empty</span>{/if}
            <span>{slots.includes(tile.id) ? npcs.find(npc => npc.postTileId === tile.id)?.character.name ?? 'Unassigned' : 'No manager post'}</span>
          </button>
        {/each}
      </div>
    </section>

    <section class="card" aria-label="Manage tile">
      <h3 bind:this={managementHeading} tabindex="-1">{selected.id} · {selected.terrain}</h3>
      {#if selected.building && definition}
        <h3>{definition.name} · Level {selected.building.level}</h3>
        <p>Upkeep: {units(definition.upkeepMilli * selected.building.level)} Gold/week. Farm batch Gold credits this Farm's upkeep.</p>
        <p id="trial-workers-confirmed">Assigned: <strong>{selected.building.workers} WF</strong>. Kept for future weeks until changed.</p>
        <label for="trial-workers">Assigned workers (WF)</label>
        <input id="trial-workers" type="text" inputmode="numeric" bind:value={workers} oninput={onworkersinput} disabled={locked || !selected.building.enabled}
          aria-invalid={workforceError ? 'true' : 'false'}
          aria-describedby={`trial-workers-confirmed${workers !== String(selected.building.workers) ? ' trial-workers-draft' : ''}${workforceError ? ' trial-workers-error' : ''}`} />
        {#if workforceError}<p id="trial-workers-error" role="alert">{workforceError}</p>{/if}
        {#if workers !== String(selected.building.workers)}<p id="trial-workers-draft">Unapplied draft. Assigned workforce remains {selected.building.workers} WF. Select Assign workers to apply.</p>{/if}
        <p>Capacity: {definition.maxWorkers * selected.building.level} WF.</p>
        <p>Maximum level: {definition.maxLevel}.</p>
        <button disabled={locked || !selected.building.enabled} onclick={() => oncommand('SET_WORKERS', { tileId: selectedId, workers: /^\d+$/.test(workers) ? Number(workers) : -1 })}>Assign workers</button>
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

      <p>Replace pays full cost and resets level and workers; no refund</p>
      <label for="trial-type">Building type</label>
      <select id="trial-type" bind:value={typeId} disabled={locked}>
        {#each Object.entries(TRIAL_BUILDINGS) as [id, d]}<option value={id}>{d.name}</option>{/each}
      </select>
      <p>Requires {chosen.terrain.join(' or ')} terrain. Cost: {units(chosen.cost.gold)} Gold, {units(chosen.cost.wood)} Wood, {units(chosen.cost.iron)} Iron. Upkeep: {units(chosen.upkeepMilli)} Gold/week at level 1.</p>
      <button disabled={locked} aria-describedby={managementError?.action === 'BUILD' || managementError?.action === 'REPLACE' ? 'trial-management-error' : undefined}
        onclick={() => oncommand(selected.building ? 'REPLACE' : 'BUILD', { tileId: selectedId, typeId })}>{selected.building ? 'Replace' : 'Build'}</button>
      {#if managementError?.action === 'BUILD' || managementError?.action === 'REPLACE'}<p id="trial-management-error" role="alert" use:revealManagementError={managementError}>{managementError.message}</p>{/if}
    </section>
  </div>

<section class="card" aria-label="Outside world">
  <details>
    <summary>Outside world</summary>
    <p>Outside tiles: {outsideSummary.total} · Yours: {outsideSummary.mine} · Held by other factions: {outsideSummary.others} · Neutral: {outsideSummary.neutral} · Explored by you: {outsideSummary.explored}</p>
    <p>Exploration is not available yet.</p>
  </details>
</section>
<style>
  section { min-width: 0; overflow-wrap: anywhere; }
  .card { margin-bottom: 16px; } h2, h3 { font-size: 1.2rem; margin-bottom: 12px; }
  p { margin: 8px 0; line-height: 1.5; }
  .terrain { color: var(--text-muted); font-size: .875rem; text-transform: uppercase; }
  .layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 16px; }
  .tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .tile { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; text-align: left; background: var(--bg-tertiary); color: var(--text-main); min-height: 125px; min-width: 0; overflow-wrap: anywhere; }
  .tile.selected { border: 3px solid var(--accent-green); }
  label { display: block; margin: 16px 0 8px; } input, select, button { font: inherit; border-radius: 6px; padding: 10px; border: 1px solid var(--border-color); }
  input, select { color: var(--text-main); background: var(--bg-tertiary); max-width: 100%; } input { width: 7rem; }
  button { background: var(--accent-green); color: #000; cursor: pointer; margin: 4px 4px 4px 0; } button:disabled { opacity: .5; cursor: default; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; } [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
  #trial-management-error { scroll-margin-block: 1px; }
  @media(max-width: 750px) { .layout { grid-template-columns: minmax(0, 1fr); } }
</style>
