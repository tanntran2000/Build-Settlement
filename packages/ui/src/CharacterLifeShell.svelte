<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import { type TileTrialState, type TileTrialReport } from '@haven/core';
  import SocietyPopulation from './SocietyPopulation.svelte';
  import { formatMilli } from './milli-format.js';
  import { formatLifeWeek } from './life-calendar.js';
  import type { LifeDestination, LifeWindow } from './character-life-navigation.js';

  export let state: TileTrialState;
  export let report: Readonly<TileTrialReport> | null;
  export let destination: LifeDestination;
  export let activeWindow: LifeWindow;
  export let error: string;
  export let status: string;
  export let unapplied: { id: string; label: string; onopen: () => void }[];
  export let onendweek: (opener: HTMLButtonElement) => void;
  export let playerInfo: Snippet;
  export let city: Snippet;
  export let characters: Snippet;
  export let reports: Snippet;
  export let session: Snippet;
  export let help: Snippet;
  let dialog: HTMLDialogElement;
  let opener: HTMLElement | null = null;
  let contentDestination: LifeDestination = destination === 'reports' ? 'city' : destination;
  const windowNames = { information: 'Information', report: 'Report', player: 'Player', population: 'Population' } as const;
  export async function openWindow(next: Exclude<LifeWindow, null>, source: HTMLElement): Promise<void> {
    opener = source;
    activeWindow = next;
    await tick();
    if (activeWindow !== next) return;
    if (!dialog.open) dialog.showModal();
    await tick();
  }
  export function closeWindow(): void {
    if (dialog.open) dialog.close();
    activeWindow = null;
    const source = opener;
    opener = null;
    source?.focus();
  }
  // Legacy destinations still open the same Report host without replacing the content view.
  $: if (destination === 'reports') {
    destination = contentDestination;
    void openWindow('report', document.getElementById('life-nav-report')!);
  } else contentDestination = destination;
  $: settlement = state.world.settlements[state.world.activeSettlementId!];
  $: locked = state.phase === 'report';
  $: views = [
    { id: 'city' as const, label: 'City', content: city },
    { id: 'characters' as const, label: 'Characters', content: characters },
    { id: 'session' as const, label: 'Session', content: session },
    { id: 'help' as const, label: 'Help', content: help },
  ];
</script>

<main lang="en" data-testid="life-shell" data-revision={state.revision}>
  <aside aria-label="Life status and navigation">
    <nav aria-label="Main">
      <div class="card" data-life-nav-zone="top">
    <h1>Character Life</h1>
    <p>{formatLifeWeek(state.world.week)} · {locked ? 'Report' : 'Planning'}</p>
    <button data-testid="life-end-week" aria-disabled={locked} onclick={event => onendweek(event.currentTarget)}>{locked ? 'Report open — Plan next week in Report' : 'End Week'}</button>
    {#if unapplied.length}
      <p>Unapplied changes ({unapplied.length})</p>
      {#each unapplied as entry (entry.id)}<button onclick={entry.onopen}>{entry.label}</button>{/each}
      <p>End Week uses applied settings only. Unapplied changes are not applied, and workforce input resets after the week.</p>
    {/if}
    {#if locked}<p>{report ? `${formatLifeWeek(report.week)} report open. ` : ''}Choose Plan next week in Report before changing the plan.</p>{/if}
    <p role={activeWindow ? undefined : 'status'} aria-live={activeWindow ? undefined : 'polite'} aria-atomic="true">{status}</p>
    {#if error}<p data-life-error role={activeWindow ? undefined : 'alert'} aria-hidden={activeWindow ? true : undefined}>{error}</p>{/if}
        {#each ['information', 'report'] as id}
          <button id={`life-nav-${id}`} aria-haspopup="dialog" onclick={event => { void openWindow(id as 'information' | 'report', event.currentTarget); }}>{windowNames[id as 'information' | 'report']}</button>
        {/each}
      </div>
      <div class="card" data-life-nav-zone="middle">
        {#each ['player', 'population'] as id}
          <button id={`life-nav-${id}`} aria-haspopup="dialog" onclick={event => { void openWindow(id as 'player' | 'population', event.currentTarget); }}>{windowNames[id as 'player' | 'population']}</button>
        {/each}
      </div>
      <div class="card" data-life-nav-zone="bottom">
        {#each views.slice(2) as view}
          <button id={`life-nav-${view.id}`} aria-current={destination === view.id ? 'page' : undefined} onclick={() => { destination = view.id; }}>{view.label}</button>
        {/each}
      </div>
    </nav>
  </aside>
  <div class="content">
    <header class="content-header">
      {#each views as view (view.id)}
        <h2 id={`life-${view.id}-heading`} hidden={destination !== view.id}>{view.label}</h2>
      {/each}
      <nav aria-label="Views">
        {#each views.slice(0, 2) as view}
          <button id={`life-nav-${view.id}`} aria-current={destination === view.id ? 'page' : undefined} onclick={() => { destination = view.id; }}>{view.label}</button>
        {/each}
      </nav>
    </header>
    {#each views as view (view.id)}
      <section data-life-view={view.id} hidden={destination !== view.id} aria-labelledby={`life-${view.id}-heading`}>
        {@render view.content()}
      </section>
    {/each}
  </div>
  <dialog class="card" bind:this={dialog} aria-labelledby="life-window-heading"
    oncancel={event => { event.preventDefault(); closeWindow(); }} onclose={() => { if (!dialog.open) closeWindow(); }}>
    <header><h2 id="life-window-heading">{activeWindow ? windowNames[activeWindow] : ''}</h2><button onclick={closeWindow}>Close</button></header>
    {#if error && activeWindow}<p data-life-error role="alert">{error}</p>{/if}
    <section hidden={activeWindow !== 'information'} aria-label="City stocks" data-testid="trial-stocks">
      <div class="information-columns">
      <div><h3>Resources</h3><dl class="stocks">
        {#each ['gold', 'wheat', 'wood', 'iron'] as key}
          <div><dt>{key[0].toUpperCase() + key.slice(1)}</dt><dd data-testid={`trial-stock-${key}`}>{formatMilli(settlement.inventory[key as 'gold' | 'wheat' | 'wood' | 'iron'])}</dd></div>
        {/each}
      <div><dt>Luxury</dt><dd data-testid="trial-stock-luxury">{formatMilli(state.society!.luxuryStockMilli)}</dd></div></dl></div>
      <div class="city-status"><h3>City status</h3>
      <p>Happiness: <strong>{state.happiness}</strong> / 100</p>
      <p>Security: Not simulated</p><p>Corruption: {state.society!.corruption} / 100 (TRIAL)</p>
      </div>
      </div>
    </section>
    <section hidden={activeWindow !== 'report'} data-life-window="report">
      {#if report}
        {#if report.foodDemandMilli > report.foodConsumedMilli}<p>Last week: Food unmet {formatMilli(report.foodDemandMilli - report.foodConsumedMilli)}</p>{/if}
        {#if report.goods.demandMilli > report.goods.servedMilli}<p>Last week: Goods unmet {formatMilli(report.goods.demandMilli - report.goods.servedMilli)}</p>{/if}
        {#if report.unpaidUpkeepMilli}<p>Last week: Unfunded upkeep {formatMilli(report.unpaidUpkeepMilli)}</p>{/if}
      {/if}
      {@render reports()}
    </section>
    <section hidden={activeWindow !== 'player'}>{@render playerInfo()}</section>
    <section hidden={activeWindow !== 'population'}>
      <SocietyPopulation {state} />
    </section>
    <!-- Announcements follow actions so changing text cannot move a repeated-click target. -->
    <p id="life-modal-status" role={activeWindow ? 'status' : undefined} aria-live={activeWindow ? 'polite' : undefined} aria-atomic="true">{status}</p>
  </dialog>
</main>

<style>
  main {
    --bg-primary: #111b21; --bg-secondary: #1b2930; --bg-tertiary: #21322f;
    --border-color: #3a4c52; --text-main: #eef3ed; --text-muted: #b0c0bf;
    --accent-green: #b6d5b6; --accent-blue: #b6d5b6; --accent-gold: #e3c68e; --accent-red: #e3c68e;
    --life-control-border: #78918b; --life-body-size: 16px; --life-card-heading: 20px;
    --life-sidebar-width: 280px; --life-gap: 24px;
    width: 100%; min-height: 100dvh; padding-right: 24px; display: grid;
    grid-template-columns: var(--life-sidebar-width) minmax(0, 1fr); gap: var(--life-gap);
    background: var(--bg-primary); color: var(--text-main); font-size: 16px; line-height: 1.4;
  }
  aside { position: sticky; top: 0; height: 100dvh; overflow-y: auto; align-self: start; padding: 18px 16px; background: #17242a; scroll-padding: 8px; }
  .content { max-height: 100dvh; overflow-y: auto; margin-inline: -8px; padding: 18px 8px; scroll-padding: 8px; }
  aside, .content, section { min-width: 0; overflow-wrap: anywhere; font-size: var(--life-body-size); }
  [hidden] { display: none !important; }
  h1 { font-size: 22px; } h2 { font-size: 26px; }
  p { margin: 0; line-height: 1.5; }
  .content-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; min-height: 42px; margin-bottom: 20px; }
  .content-header h2 { margin: 0; line-height: 42px; }
  nav[aria-label='Views'] { display: flex; flex-wrap: wrap; gap: 8px; }
  nav[aria-label='Main'] { display: flex; flex-direction: column; gap: 20px; min-height: calc(100dvh - 36px); }
  [data-life-nav-zone] { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
  [data-life-nav-zone='bottom'] { margin-top: auto; }
  [data-life-nav-zone] p:empty:not([aria-live]) { display: none; }
  [data-life-nav-zone] button { text-align: left; }
  [data-life-nav-zone] p { font-size: var(--life-body-size); }
  dialog { --life-dialog-top: 12px; position: fixed; inset: var(--life-dialog-top) 0 auto; margin: 0 auto; width: min(1020px, calc(100% - 24px)); max-height: calc(100dvh - var(--life-dialog-top) - 12px); overflow: auto; color: var(--text-main); background: var(--bg-tertiary); border-radius: 14px; padding: 24px; scroll-padding: 12px; font-size: var(--life-body-size); }
  dialog::backdrop { background: rgb(9 17 20 / .8); }
  dialog header { display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  dialog h2 { margin: 0; font-size: 26px; }
  dialog header button { min-width: 126px; }
  .information-columns { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 32px; }
  .information-columns > div { min-width: 0; }
  .information-columns h3 { margin-bottom: 16px; }
  .stocks > div { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: 16px; min-height: 52px; border-bottom: 1px solid var(--border-color); }
  dt { color: var(--text-muted); } dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
  .city-status p { padding-block: 10px; border-bottom: 1px solid var(--border-color); }
  [aria-current='page'] { font-weight: 700; text-decoration: underline; text-underline-offset: 5px; }
  [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
  /* Inherited tokens and scoped controls keep other game modes unchanged. */
  main :global(.card) { border-color: var(--border-color); border-radius: 12px; box-shadow: none; }
  main dialog.card { border-radius: 14px; }
  main :global(button), main :global(input), main :global(select) { font: inherit; min-height: 44px; min-width: 24px; max-width: 100%; border: 1px solid var(--life-control-border); border-radius: 8px; padding: 8px 12px; color: var(--text-main); background: transparent; }
  main :global(button) { white-space: normal; overflow-wrap: anywhere; cursor: pointer; }
  main :global(button:hover:not(:disabled):not([aria-disabled='true'])) { background: var(--bg-tertiary); color: var(--text-main); }
  main :global(button:disabled), main :global(input:disabled), main :global(select:disabled), main :global(button[aria-disabled='true']) { opacity: 1; color: var(--text-muted); background: transparent; border-style: dashed; cursor: default; }
  main :global([data-testid='life-end-week']) { background: #a8cda5; color: #14231c; font-weight: 700; }
  main :global([data-testid='life-end-week']:hover:not([aria-disabled='true'])) { background: #b6d5b6; color: #14231c; }
  main :global(button:disabled), main :global(button[aria-disabled='true']) { opacity: .5; color: #fff; background: transparent; border-color: #fff; }
  main :global(input[type='file']) { width: 100%; }
  main :global(input[type='file']::file-selector-button) { font: inherit; color: var(--text-main); background: transparent; border: 1px solid var(--life-control-border); border-radius: 8px; padding: 8px; }
  main :global(summary) { cursor: pointer; min-height: 24px; padding-block: 4px; }
  main :global(a) { display: inline-block; min-height: 24px; color: var(--accent-blue); }
  main :global(p) { margin-block: 8px; }
  main :global(h3), main :global(h4) { font-size: var(--life-card-heading); }
  main :global(:focus-visible) { outline: 3px solid var(--life-control-border); outline-offset: 3px; scroll-margin: 8px; }
  main :global(button[aria-disabled='true']:focus-visible) { outline-color: #fff; }
  @media(min-width: 751px) {
    dialog { left: calc(var(--life-sidebar-width) + var(--life-gap)); right: 24px; width: min(1020px, calc(100% - var(--life-sidebar-width) - var(--life-gap) - 48px)); }
  }
  @media(min-width: 1440px) {
    main { --life-sidebar-width: 316px; --life-gap: 28px; --life-body-size: 19px; --life-card-heading: 24px; padding-right: 32px; }
    h1 { font-size: 25px; } .content-header h2 { font-size: 34px; }
    [data-life-nav-zone] { padding: 20px; }
    [data-life-nav-zone='top'] { min-height: 360px; }
    [data-life-nav-zone='middle'] { min-height: 152px; justify-content: center; }
    [data-life-nav-zone='bottom'] { min-height: 140px; justify-content: center; }
    nav button { font-size: 21px; line-height: 1.2; }
    dialog { right: 32px; padding: 34px; }
    dialog h2 { font-size: 30px; }
    .stocks > div { min-height: 64px; }
  }
  @media(min-width: 1200px) and (min-height: 900px) {
    dialog { --life-dialog-top: 280px; }
  }
  @media(min-width: 1440px) and (min-height: 900px) {
    dialog { min-height: 556px; }
  }
  /* Let the document scroll on narrow screens while status changes retain the content anchor. */
  @media(max-width: 750px) {
    main { padding: 0; grid-template-columns: minmax(0, 1fr); gap: 0; }
    aside { position: static; height: auto; overflow: visible; overflow-anchor: none; padding: 12px; }
    .content { max-height: none; overflow: visible; margin: 0; padding: 16px 12px; }
    nav[aria-label='Main'] { flex-direction: row; flex-wrap: wrap; min-height: 0; gap: 12px; }
    [data-life-nav-zone] { flex: 1 1 100%; padding: 12px; }
    [data-life-nav-zone='bottom'] { margin-top: 0; }
    dialog { padding: 18px; }
    .information-columns { grid-template-columns: minmax(0, 1fr); gap: 24px; }
  }
</style>
