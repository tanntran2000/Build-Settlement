<script lang="ts">
  import type { Snippet } from 'svelte';
  import { weeklyWorkforceMilli, WEEKLY_RESOURCE_KEYS, type TileTrialState, type TileTrialReport } from '@haven/core';
  import { formatMilli } from './milli-format.js';
  import type { LifeDestination } from './character-life-navigation.js';

  export let state: TileTrialState;
  export let report: Readonly<TileTrialReport> | null;
  export let destination: LifeDestination;
  export let error: string;
  export let status: string;
  export let unapplied: { id: string; label: string; onopen: () => void }[];
  export let onendweek: () => void;
  export let city: Snippet;
  export let characters: Snippet;
  export let reports: Snippet;
  export let session: Snippet;
  export let help: Snippet;
  $: settlement = state.world.settlements[state.world.activeSettlementId!];
  $: assigned = state.tiles.reduce((sum, tile) => sum + (tile.building?.workers ?? 0), 0);
  $: locked = state.phase === 'report';
  $: views = [
    { id: 'city' as const, label: 'City', content: city },
    { id: 'characters' as const, label: 'Characters', content: characters },
    { id: 'reports' as const, label: 'Reports', content: reports },
    { id: 'session' as const, label: 'Session', content: session },
    { id: 'help' as const, label: 'Help', content: help },
  ];
</script>

<main lang="en" data-testid="life-shell" data-revision={state.revision}>
  <aside class="card" aria-label="Life status and navigation">
    <h1>Character Life</h1>
    <p>Week {state.world.week} · {locked ? 'Report' : 'Planning'}</p>
    <section aria-label="City stocks" data-testid="trial-stocks">
      <h2>City stocks</h2>
      <dl class="stocks">
        {#each WEEKLY_RESOURCE_KEYS as key}
          <div><dt>{key[0].toUpperCase() + key.slice(1)}</dt><dd data-testid={`trial-stock-${key}`}>{formatMilli(settlement.inventory[key])}</dd></div>
        {/each}
      </dl>
      <p>Happiness: <strong>{state.happiness}</strong> / 100</p>
    </section>
    <p>{settlement.cohorts.reduce((sum, cohort) => sum + cohort.count, 0)} residents · Workforce {assigned} / {formatMilli(weeklyWorkforceMilli(settlement.cohorts))} assigned / available</p>
    {#if unapplied.length}
      <p>Unapplied changes ({unapplied.length})</p>
      {#each unapplied as entry (entry.id)}<button onclick={entry.onopen}>{entry.label}</button>{/each}
      <p>End Week uses applied settings only. Unapplied changes are not applied, and workforce input resets after the week.</p>
    {/if}
    <button data-testid="life-end-week" aria-disabled={locked} onclick={onendweek}>{locked ? 'Report open — Plan next week in Reports' : 'End Week'}</button>
    {#if locked}<p>{report ? `Week ${report.week} report open. ` : ''}Choose Plan next week in Reports before changing the plan.</p>{/if}
    <p role="status" aria-live="polite" aria-atomic="true">{status}</p>
    {#if error}<p role="alert">{error}</p>{/if}
    <nav aria-label="Main">
      {#each views as view}
        <button aria-current={destination === view.id ? 'page' : undefined} onclick={() => { destination = view.id; }}>{view.label}</button>
      {/each}
    </nav>
  </aside>
  <div class="content">
    {#each views as view (view.id)}
      <section data-life-view={view.id} hidden={destination !== view.id} aria-labelledby={`life-${view.id}-heading`}>
        <h2 id={`life-${view.id}-heading`}>{view.label}</h2>
        {@render view.content()}
      </section>
    {/each}
  </div>
</main>

<style>
  main { max-width: 1440px; margin: auto; padding: 24px; display: grid; grid-template-columns: 18rem minmax(0, 1fr); gap: 16px; }
  aside { position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow-y: auto; align-self: start; }
  aside, .content, section { min-width: 0; overflow-wrap: anywhere; }
  [hidden] { display: none !important; }
  h1 { font-size: 1.5rem; } h2 { font-size: 1.2rem; margin-bottom: 12px; }
  p { margin: 8px 0; line-height: 1.5; }
  .stocks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } dd { margin: 4px 0; font-size: 1.2rem; }
  nav { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  button { font: inherit; border-radius: 6px; padding: 10px; min-height: 44px; border: 1px solid var(--border-color); background: var(--accent-green); color: #000; cursor: pointer; }
  [aria-current='page'] { font-weight: bold; border: 3px solid var(--text-main); }
  [aria-disabled='true'] { background: var(--bg-tertiary); color: var(--text-main); cursor: default; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
  [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
  @media(max-width: 750px) { main { padding: 12px; grid-template-columns: minmax(0, 1fr); } aside { position: static; max-height: none; overflow: visible; } nav { flex-direction: row; flex-wrap: wrap; } }
</style>
