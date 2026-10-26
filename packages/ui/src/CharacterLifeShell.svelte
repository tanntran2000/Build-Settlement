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
    <button data-testid="life-end-week" aria-disabled={locked} onclick={onendweek}>{locked ? 'Report open — Plan next week in Reports' : 'End Week'}</button>
    {#if report}
      {#if report.foodDemandMilli > report.foodConsumedMilli}<p>Last week: Food unmet {formatMilli(report.foodDemandMilli - report.foodConsumedMilli)}</p>{/if}
      {#if report.goods.demandMilli > report.goods.servedMilli}<p>Last week: Goods unmet {formatMilli(report.goods.demandMilli - report.goods.servedMilli)}</p>{/if}
      {#if report.unpaidUpkeepMilli}<p>Last week: Unfunded upkeep {formatMilli(report.unpaidUpkeepMilli)}</p>{/if}
    {/if}
    {#if unapplied.length}
      <p>Unapplied changes ({unapplied.length})</p>
      {#each unapplied as entry (entry.id)}<button onclick={entry.onopen}>{entry.label}</button>{/each}
      <p>End Week uses applied settings only. Unapplied changes are not applied, and workforce input resets after the week.</p>
    {/if}
    {#if locked}<p>{report ? `Week ${report.week} report open. ` : ''}Choose Plan next week in Reports before changing the plan.</p>{/if}
    <p role="status" aria-live="polite" aria-atomic="true">{status}</p>
    {#if error}<p role="alert">{error}</p>{/if}
    <nav aria-label="Main">
      {#each views as view}
        <button id={`life-nav-${view.id}`} aria-current={destination === view.id ? 'page' : undefined} onclick={() => { destination = view.id; }}>{view.label}</button>
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
  main { --border-color: var(--text-muted); max-width: 1440px; margin: auto; padding: 24px; display: grid; grid-template-columns: 18rem minmax(0, 1fr); gap: 16px; font-size: 1rem; line-height: 1.4; }
  aside { position: sticky; top: 24px; max-height: calc(100dvh - 48px); overflow-y: auto; align-self: start; scroll-padding: 8px; }
  .content { max-height: calc(100dvh - 48px); overflow-y: auto; padding: 8px; scroll-padding: 8px; }
  aside, .content, section { min-width: 0; overflow-wrap: anywhere; }
  [hidden] { display: none !important; }
  h1 { font-size: 1.25rem; } h2 { font-size: 1.2rem; margin-bottom: 12px; }
  p { margin: 8px 0; line-height: 1.5; }
  .stocks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } dd { margin: 4px 0; font-size: 1.2rem; }
  nav { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  button { font: inherit; border-radius: 6px; padding: 10px; min-height: 44px; border: 1px solid var(--border-color); background: var(--accent-green); color: #000; cursor: pointer; }
  [aria-current='page'] { font-weight: bold; border: 3px solid var(--text-main); }
  [aria-disabled='true'] { background: var(--bg-tertiary); color: var(--text-main); cursor: default; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
  [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
  /* Snippets include the unchanged checkpoint/Error log components; scope their presentation to Life. */
  main :global(button), main :global(input), main :global(select) { font: inherit; min-height: 24px; min-width: 24px; max-width: 100%; border: 1px solid var(--border-color); }
  main :global(button) { white-space: normal; overflow-wrap: anywhere; }
  main :global(button:disabled), main :global(button[aria-disabled='true']) { color: #fff; background: var(--bg-tertiary); border-color: #fff; }
  main :global(input[type='file']) { width: 100%; }
  main :global(summary) { cursor: pointer; min-height: 24px; padding-block: 4px; }
  main :global(a) { display: inline-block; min-height: 24px; color: var(--accent-blue); }
  main :global(p) { margin-block: 8px; }
  main :global(h3), main :global(h4) { font-size: 1.125rem; }
  main :global(:focus-visible) { outline: 3px solid var(--accent-blue); outline-offset: 3px; scroll-margin: 8px; }
  main :global(button[aria-disabled='true']:focus-visible) { outline-color: #fff; }
  /* Anchor narrow-page scrolling in the main view when the status block changes height. */
  @media(max-width: 750px) { main { padding: 12px; grid-template-columns: minmax(0, 1fr); } aside { position: static; max-height: none; overflow: visible; overflow-anchor: none; } .content { max-height: none; overflow: visible; padding: 0; } nav { flex-direction: row; flex-wrap: wrap; } }
</style>
