<script lang="ts">
  import { createWeeklyState, weeklyWorkforceMilli, WEEKLY_RESOURCE_KEYS, SOCIAL_RESOURCE_SCALE, type WeeklyReport } from '@haven/core';
  import { executeWeeklyCommand, PRODUCTION_BATCH_WORKFORCE_MILLI, FARM_MAX_BATCHES, PROCESSOR_MAX_BATCHES, FARM_GOLD_PER_BATCH_MILLI, FARM_WHEAT_PER_BATCH_MILLI, PROCESSOR_WHEAT_PER_BATCH_MILLI, PROCESSOR_FOOD_PER_BATCH_MILLI } from '@haven/simulation';
  import { CITY_DESIGN } from '@haven/content';
  import ErrorLog from './ErrorLog.svelte';
  import { errorLog } from './error-log.js';

  // shortcut: canonical new world in RAM, add persistence only under an approved save/load WP.
  let state = createWeeklyState();
  errorLog.setContext('weekly', { week: state.week });
  $: settlement = state.activeSettlementId === null ? null : state.settlements[state.activeSettlementId];
  $: workforceMilli = settlement ? weeklyWorkforceMilli(settlement.cohorts) : 0;
  $: headcount = settlement ? settlement.cohorts.reduce((total, cohort) => total + cohort.count, 0) : 0;
  let farmDraft = '0';
  let processorDraft = '0';
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
    errorLog.setContext('weekly', { week: state.week });
    const farm = farmDraft.trim();
    const processor = processorDraft.trim();
    const farmWF = Number(farm);
    const processorWF = Number(processor);
    if (!/^(?:0|[1-9]\d*)$/.test(farm) || !/^(?:0|[1-9]\d*)$/.test(processor) ||
        !Number.isSafeInteger(farmWF) || !Number.isSafeInteger(processorWF)) {
      errorLog.record('END_WEEK', 'INVALID_WORKFORCE_INPUT');
      error = `Enter whole WF: Farm 0–${FARM_MAX_BATCHES}, Processor 0–${PROCESSOR_MAX_BATCHES}; together use at most ${display(workforceMilli)} WF.`;
      return;
    }
    try {
      const result = executeWeeklyCommand(state, { type: 'END_WEEK', expectedWeek: state.week, farmWorkforceMilli: farmWF * SOCIAL_RESOURCE_SCALE, processorWorkforceMilli: processorWF * SOCIAL_RESOURCE_SCALE });
      if (!result.success) {
        error = errorLog.record('END_WEEK', result.error.code);
        return;
      }
      state = result.nextState;
      report = result.report;
      errorLog.setContext('weekly', { week: state.week });
      error = '';
    } catch {
      error = errorLog.record('END_WEEK', 'UNEXPECTED_ACTION_ERROR');
    }
  }

  function planNextWeek() {
    report = null;
    farmDraft = '0';
    processorDraft = '0';
    error = '';
  }
</script>

<main lang="en">
  <header class="card">
    <h1>Weekly Management</h1>
    <p><a href="/?mode=tiles">Play tile building trial</a> · Build, upgrade and supply the city (TRIAL)</p>
    <p>Experimental Wheat → Food chain · Resets on reload · No save/load</p>
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
    <h2>Wheat → Food production</h2>
    <p id="shared-help">Whole WF only. Both buildings share {display(workforceMilli)} WF; assigned but idle WF is not reassigned. Harvest runs before processing in the same week.</p>
    <h3>Farm Field</h3>
    <p id="farm-help">Available. {display(PRODUCTION_BATCH_WORKFORCE_MILLI)} WF + {display(FARM_GOLD_PER_BATCH_MILLI)} Gold → {display(FARM_WHEAT_PER_BATCH_MILLI)} Wheat per batch. Maximum {FARM_MAX_BATCHES} batches/week.</p>
    <label for="farm-workforce">Farm Field workforce (WF)</label>
    <input id="farm-workforce" type="text" inputmode="numeric" bind:value={farmDraft}
      disabled={report !== null || settlement === null} aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? 'farm-help shared-help weekly-error' : 'farm-help shared-help'} />
    <h3>Food Processor</h3>
    <p id="processor-help">{settlement?.foodProcessorOperational ? 'Food Processor operational' : 'Food Processor unavailable'}</p>
    <p>{display(PRODUCTION_BATCH_WORKFORCE_MILLI)} WF + {display(PROCESSOR_WHEAT_PER_BATCH_MILLI)} Wheat → {display(PROCESSOR_FOOD_PER_BATCH_MILLI)} Food per batch. Maximum {PROCESSOR_MAX_BATCHES} batches/week. Only complete batches run; unused inputs stay in stock.</p>
    <label for="processor-workforce">Food Processor workforce (WF)</label>
    <input id="processor-workforce" type="text" inputmode="numeric" bind:value={processorDraft}
      disabled={report !== null || settlement === null || !settlement.foodProcessorOperational} aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? 'processor-help shared-help weekly-error' : 'processor-help shared-help'} />
    <p>No Food consumption or Gold income.</p>
    <button type="submit" disabled={report !== null || settlement === null}>End Week</button>
    {#if error}<p id="weekly-error" role="alert">{error}</p>{/if}
  </form>

  {#if report}
    <section class="card" aria-label="Week report" aria-live="polite">
      <h2>Week {report.week} report</h2>
      <p>Assigned: {display(report.workforce.assignedMilli)} WF · Fulfilled: {display(report.workforce.fulfilledMilli)} WF</p>
      <p>Farm batches: {report.production.farm.plannedBatches} planned / {report.production.farm.completedBatches} completed / {report.production.farm.blockedBatches} blocked</p>
      <p>Processor batches: {report.production.processor.plannedBatches} planned / {report.production.processor.completedBatches} completed / {report.production.processor.blockedBatches} blocked</p>
      <p>Assigned but idle: {display(report.workforce.idleAssignedMilli)} WF · Unassigned: {display(report.workforce.availableMilli)} WF</p>
      <div class="ledger">
        <table>
          <caption>Resource ledger (units)</caption>
          <thead><tr><th scope="col">Stock</th><th scope="col">Before</th><th scope="col">In</th><th scope="col">Used</th><th scope="col">Net</th><th scope="col">After</th></tr></thead>
          <tbody>
            {#each WEEKLY_RESOURCE_KEYS as key}
              <tr><th scope="row">{label(key)}</th><td>{display(report.before[key])}</td><td>{display(report.flows[key].inflow)}</td><td>{display(report.flows[key].actualOutflow)}</td><td>{display(report.net[key])}</td><td>{display(report.after[key])}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
      <details open><summary>WHY</summary><p>{report.why}</p></details>
    </section>
    <button type="button" onclick={planNextWeek}>Plan next week</button>
  {/if}
  <section class="card planned" aria-labelledby="planned-city-title">
    <h2 id="planned-city-title">Planned city systems</h2>
    <p>Classic preview · Groups, Requirements and Status are not simulated in classic. Wheat/Food production is active above; the separate tile trial simulates Food/Goods demand and Happiness.</p>
    <h3>Social groups · Proposed names</h3>
    <div class="planned-groups">
      {#each CITY_DESIGN.groups as group}
        <article aria-label={group.label}>
          <h4>{group.label}</h4>
          <p>{group.name}</p>
          <p>{group.duties}</p>
        </article>
      {/each}
    </div>
    <p>{CITY_DESIGN.groupInfluence}</p>

    <section aria-labelledby="planned-inventory-title">
      <h3 id="planned-inventory-title">Physical inventory</h3>
      <p>Five live physical stocks: Gold, Wheat, Food, Wood and Iron. Goods is a city-wide Requirement, with no stored Goods.</p>
      <dl>
        <div><dt>Inputs</dt><dd>{CITY_DESIGN.inventory.inputs.join(', ')}</dd></div>
        <div><dt>Finished inventory</dt><dd>{CITY_DESIGN.inventory.finished.join(', ')}</dd></div>
      </dl>
      <p>Food is finished inventory. In the tile trial, Goods buildings provide weekly service without stored Goods.</p>
      <p>Wheat harvested this week may be processed into Food in the same week, only through a building.</p>
    </section>
    <section aria-labelledby="planned-requirements-title">
      <h3 id="planned-requirements-title">City-wide Requirements</h3>
      <p>{CITY_DESIGN.requirements.join(', ')}</p>
      <p>City-wide demand. Food demand is separate from Food inventory. Goods has no physical inventory.</p>
    </section>
    <section aria-labelledby="planned-status-title">
      <h3 id="planned-status-title">City Status</h3>
      <ul>{#each CITY_DESIGN.statuses as status}<li>{status}</li>{/each}</ul>
      <p>Design range: 0–100. Values are not simulated.</p>
    </section>
    <p>Law is deferred; its integration boundary is pending.</p>
  </section>
  <ErrorLog />
</main>

<style>
  main { max-width: 960px; margin: 0 auto; padding: 24px; }
  .card { margin-bottom: 16px; }
  h1 { font-size: 1.6rem; } h2 { font-size: 1.2rem; margin-bottom: 8px; }
  .planned h3 { margin: 16px 0 8px; }
  .planned h4 { margin: 0; }
  .planned-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
  p { margin: 8px 0; }
  .stocks { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
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
