<script lang="ts">
  import { createWeeklyState, weeklyWorkforceMilli, WEEKLY_RESOURCE_KEYS, SOCIAL_RESOURCE_SCALE, type WeeklyReport } from '@haven/core';
  import { executeWeeklyCommand, FARM_FIELD_CAPACITY_MILLI, FARM_GOLD_PER_WF, FARM_FOOD_PER_WF } from '@haven/simulation';

  // shortcut: canonical new world in RAM, add persistence only under an approved save/load WP.
  let state = createWeeklyState();
  $: settlement = state.activeSettlementId === null ? null : state.settlements[state.activeSettlementId];
  $: workforceMilli = settlement ? weeklyWorkforceMilli(settlement.cohorts) : 0;
  $: headcount = settlement ? settlement.cohorts.reduce((total, cohort) => total + cohort.count, 0) : 0;
  let draft = '0';
  let report: WeeklyReport | null = null;
  let error = '';
  const display = (milli: number) => {
    const digits = String(Math.abs(milli)).padStart(4, '0');
    const fraction = digits.slice(-3).replace(/0+$/, '');
    return `${milli < 0 ? '-' : ''}${digits.slice(0, -3)}${fraction ? '.' + fraction : ''}`;
  };
  const label = (key: string) => key[0].toUpperCase() + key.slice(1);

  function endWeek(event: SubmitEvent) {
    event.preventDefault();
    if (report) return;
    const value = draft.trim();
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/.test(value)) {
      error = `Enter 0–${display(FARM_FIELD_CAPACITY_MILLI)} WF with at most three decimal places.`;
      return;
    }
    const [whole, fraction = ''] = value.split('.');
    const foodWorkforceMilli = Number(whole) * SOCIAL_RESOURCE_SCALE + Number(fraction.padEnd(3, '0'));
    const result = executeWeeklyCommand(state, { type: 'END_WEEK', expectedWeek: state.week, foodWorkforceMilli });
    if (!result.success) {
      error = result.error.message;
      return;
    }
    state = result.nextState;
    report = result.report;
    error = '';
  }

  function planNextWeek() {
    report = null;
    draft = '0';
    error = '';
  }
</script>

<main lang="en">
  <header class="card">
    <h1>Weekly Management</h1>
    <p>Experimental Farm Field slice · Resets on reload · No save/load</p>
    {#if settlement}<h2>{settlement.name}</h2>{/if}
    <p><span data-testid="weekly-population">{headcount} residents</span> · <span data-testid="weekly-workforce">{display(workforceMilli)} WF</span> · Week <strong data-testid="weekly-week">{state.week}</strong> · {report ? 'Report' : 'Planning'}</p>
  </header>

  <section class="card" aria-label="Stocks">
    <h2>Stocks</h2>
    {#if settlement}
    <dl class="stocks">
      {#each WEEKLY_RESOURCE_KEYS as key}
        <div><dt>{label(key)}</dt><dd data-testid={`weekly-stock-${key}`}>{display(settlement.inventory[key])}</dd></div>
      {/each}
    </dl>
    {:else}<p>No active settlement. End Week is unavailable.</p>{/if}
  </section>

  <form class="card" onsubmit={endWeek} novalidate>
    <h2>Farm Field</h2>
    <p id="farm-help">Capacity: {display(FARM_FIELD_CAPACITY_MILLI)} WF/week. Each funded WF costs {FARM_GOLD_PER_WF} Gold and produces {FARM_FOOD_PER_WF} Food. No Food consumption or Gold income.</p>
    <label for="farm-workforce">Farm Field workforce (WF)</label>
    <input id="farm-workforce" type="text" inputmode="decimal" bind:value={draft}
      disabled={report !== null || settlement === null} aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? 'farm-help weekly-error' : 'farm-help'} />
    <button type="submit" disabled={report !== null || settlement === null}>End Week</button>
    {#if error}<p id="weekly-error" role="alert">{error}</p>{/if}
  </form>

  {#if report}
    <section class="card" aria-label="Week report" aria-live="polite">
      <h2>Week {report.week} report</h2>
      <p>Assigned: {display(report.workforce.assignedMilli)} WF · Funded: {display(report.workforce.fundedMilli)} WF</p>
      <p>Unfunded assigned: {display(report.workforce.unfundedMilli)} WF · Unassigned: {display(report.workforce.availableMilli)} WF</p>
      <div class="ledger">
        <table>
          <caption>Resource ledger (units)</caption>
          <thead><tr><th scope="col">Stock</th><th scope="col">Before</th><th scope="col">Net</th><th scope="col">After</th><th scope="col">Requested outflow</th><th scope="col">Actual outflow</th><th scope="col">Deficit</th></tr></thead>
          <tbody>
            {#each WEEKLY_RESOURCE_KEYS as key}
              <tr><th scope="row">{label(key)}</th><td>{display(report.before[key])}</td><td>{display(report.net[key])}</td><td>{display(report.after[key])}</td><td>{display(report.flows[key].requestedOutflow)}</td><td>{display(report.flows[key].actualOutflow)}</td><td>{display(report.flows[key].deficit)}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
      <details open><summary>WHY</summary><p>{report.why}</p></details>
    </section>
    <button type="button" onclick={planNextWeek}>Plan next week</button>
  {/if}
</main>

<style>
  main { max-width: 960px; margin: 0 auto; padding: 24px; }
  .card { margin-bottom: 16px; }
  h1 { font-size: 1.6rem; } h2 { font-size: 1.2rem; margin-bottom: 8px; }
  p { margin: 8px 0; }
  .stocks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  dd { margin: 0; font-size: 1.5rem; }
  label { display: block; margin-top: 16px; }
  input, button { font: inherit; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; }
  input { width: 8rem; color: var(--text-main); background: var(--bg-tertiary); margin: 8px 8px 8px 0; }
  button { background: var(--accent-green); color: #000; cursor: pointer; }
  button:disabled { opacity: 0.6; cursor: default; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
  [role='alert'] { border-left: 3px solid currentColor; padding-left: 12px; }
  .ledger { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 8px; text-align: right; border-bottom: 1px solid var(--border-color); }
  th:first-child { text-align: left; }
  summary { cursor: pointer; }
</style>
