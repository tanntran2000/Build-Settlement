<script lang="ts">
  import { WEEKLY_RESOURCE_KEYS, type TileTrialReport } from '@haven/core';
  import { garrisonReportLine, lawReportLines, crimeReportLine, crisisReportLines, outsideReportLines, orderReportLines, ORDER_GOODS } from './society-view.js';
  import ReportLetter from './ReportLetter.svelte';
  import { reportLetters, reportStamps } from './report-letters.js';
  import SocietyReport from './SocietyReport.svelte';
  import { formatFulfillment, formatMilli } from './milli-format.js';
  import { formatLifeWeek } from './life-calendar.js';

  export let report: Readonly<TileTrialReport> | null;
  export let planningWeek: number;
  export let locked: boolean;
  export let onnextweek: () => void;

</script>

<section class="card weekly-report" aria-label="Weekly city report">
  {#if report}
    {@const letters = reportLetters(report)}
    {#snippet lawsDetails()}
    {#if report.laws}<section aria-label="Laws" data-laws-in-force={JSON.stringify(report.laws.inForce)} data-laws-costs={JSON.stringify(report.laws.costs)} data-laws-unfunded={JSON.stringify(report.laws.unfunded)} data-laws-income-milli={report.laws.incomeMilli} data-laws-promise={JSON.stringify(report.laws.promise)}><h3>Laws</h3>{#each lawReportLines(report) as line}<p>{line}</p>{/each}</section>{/if}
    {/snippet}
    <header class="report-heading">
      <div><h2>{formatLifeWeek(report.week)} report</h2><p aria-hidden="true">To the Lord of Haven</p></div>
      <div class="report-stamps">{#each reportStamps(report) as stamp}<span data-report-stamp={stamp.label}>{stamp.label} {stamp.value}</span>{/each}</div>
    </header>
    {#if !locked}<p>Previous report · Planning is active.</p><p>Planning {formatLifeWeek(planningWeek)}.</p>{/if}
    <div class="letters-grid">
      {#each letters as letter (letter.id)}
        <ReportLetter {letter}>
          {#snippet details()}
            {#if letter.id === 'steward'}
    <section>
      <h3>Gold and upkeep</h3>
      <p>Tax: {formatMilli(report.taxMilli)} Gold. Upkeep covered: {formatMilli(report.upkeepPaidMilli)} Gold; unfunded: {formatMilli(report.unpaidUpkeepMilli)} Gold (no debt). Farm batch payment: {formatMilli(report.farmBatchGoldMilli)} Gold; extra Farm upkeep: {formatMilli(report.farmExtraUpkeepMilli)} Gold.</p>
    </section>
    <details>
      <summary>How this is calculated</summary>
      <p>Stock change is closing stock minus opening stock for this resolved week. It is not gross production or a forecast.</p>
      <p>TRIAL: each class eats and uses Goods separately; the Bound eat last. Missing Food, Goods or housing lowers that class's satisfaction and stops its arrivals. Each class supplies 1 WF per 10 residents; Elites do not work.</p>
      {#if report.immigration}<p>Immigration target: {report.immigration.target}. Useful worker slots: {report.immigration.usefulWorkerSlots}. Renewable Food: {formatMilli(report.immigration.renewableFoodMilli)}. Reason: {report.immigration.reason}.</p>{/if}
    </details>
              {#if !letters.some(item => item.id === 'council')}{@render lawsDetails()}{/if}
            {:else if letter.id === 'quartermaster'}
    <section>
      <h3>Needs and services</h3>
      <p>Food consumed: {formatMilli(report.foodConsumedMilli)} / {formatMilli(report.foodDemandMilli)} · {formatFulfillment(report.foodConsumedMilli, report.foodDemandMilli)}.</p>
      <p>Food unmet: {formatMilli(report.foodDemandMilli - report.foodConsumedMilli)}.</p>
      <p data-testid="trial-goods">Goods service: {formatMilli(report.goods.servedMilli)} / {formatMilli(report.goods.demandMilli)} · {formatFulfillment(report.goods.servedMilli, report.goods.demandMilli)}. Materials used once: {formatMilli(report.goods.woodUsed)} Wood, {formatMilli(report.goods.ironUsed)} Iron. Revenue: {formatMilli(report.goods.revenueMilli)} Gold.</p>
      {#if report.goodsStock}<p data-testid="goods-stock-flow">Goods stock: opening {formatMilli(report.goodsStock.openingMilli)} · produced {formatMilli(report.goodsStock.producedMilli)} · distributed {formatMilli(report.goodsStock.distributedMilli)} · closing {formatMilli(report.goodsStock.closingMilli)}. Demand {formatMilli(report.goodsStock.demandMilli)}; unmet {formatMilli(report.goodsStock.unmetMilli)}; capacity {formatMilli(report.goodsStock.capacityMilli)}; limited by {report.goodsStock.limitedBy}.</p>{/if}
      <p>Goods unmet: {formatMilli(report.goods.demandMilli - report.goods.servedMilli)}.</p>
    </section>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users must be able to scroll the table.) -->
    <div class="ledger" role="region" aria-label="Weekly stock ledger scroll area" tabindex="0">
      <table>
        <caption>Weekly stock ledger</caption>
        <thead><tr>{#each ['Stock', 'Before', 'Stock change', 'After'] as column}<th scope="col">{column}</th>{/each}</tr></thead>
        <tbody>
          {#each WEEKLY_RESOURCE_KEYS as key}<tr><th scope="row">{key}</th><td>{formatMilli(report.before[key])}</td><td>{formatMilli(report.after[key] - report.before[key])}</td><td>{formatMilli(report.after[key])}</td></tr>{/each}
        </tbody>
      </table>
    </div>
    <details>
      <summary>Building activity</summary>
      {#if report.activities.length}<ul>{#each report.activities as activity}<li>{activity}</li>{/each}</ul>
      {:else}<p>No building activity recorded.</p>{/if}
    </details>
    {#if report.outside}<section aria-label="Outside report"><h3>Outside</h3>
      {#each outsideReportLines(report) as line}<p>{line}</p>{/each}
      <dl>{#each Object.entries(report.outside.producedMilli) as [good,amount]}<div><dt>{good} produced</dt><dd data-outside-produced={good}>{formatMilli(amount)}</dd></div>{/each}
      {#each Object.entries(report.outside.stocksBefore) as [good,amount]}<div><dt>{good} stock before / after</dt><dd data-outside-stock={good}>{formatMilli(amount)} / {formatMilli(report.outside.stocksAfter[good as keyof typeof report.outside.stocksAfter])}</dd></div>{/each}</dl>
    </section>{/if}
            {:else if letter.id === 'census'}
    <section>
      <h3>Population and happiness</h3>
      {#if report.immigration}<p data-testid="trial-immigration">Population: {report.immigration.populationBefore} → {report.immigration.populationAfter} · {report.immigration.arrivals} arrivals · Available next week.</p>{/if}
      <p>Happiness: {report.happinessBefore} → {report.happinessAfter}.</p>
    </section>
    {#if report.society}<SocietyReport {report} />{/if}
            {:else if letter.id === 'captain'}
    {#if report.order}<section aria-label="Order" data-order-soldiers={report.order.soldiers} data-order-garrison-security={report.order.garrisonSecurity}><h3>Order</h3>
      <p>{garrisonReportLine(report)}</p>
      {#each orderReportLines(report) as line,i}<p data-order-value={i<3?['security','crime','authority'][i]:undefined}>{line}</p>{/each}
      <details><summary>Order calculation</summary><dl>
      {#each ORDER_GOODS as good}{#if report.order.theftMilli[good]}<div><dt>{good} stolen</dt><dd data-order-theft={good}>{formatMilli(report.order.theftMilli[good]!)}</dd></div>{/if}{/each}
      {#each ['taxModifierBps','taxDeltaMilli','arrivalsBudgetBefore','arrivalsBudgetAfter','tensionAdded','satisfactionLost'] as key}<div><dt>{key}</dt><dd data-order-detail={key}>{report.order[key as 'taxModifierBps']}</dd></div>{/each}
      </dl></details></section>{/if}
    {#if report.crimeEvent}<section aria-label="Crime" data-crime-standing-before={report.crimeEvent.standingBefore} data-crime-standing-after={report.crimeEvent.standingAfter} data-crime-chance-percent={report.crimeEvent.chancePercent} data-crime-lord-health-loss={report.crimeEvent.lordHealthLoss} data-crime-kind={report.crimeEvent.event?.kind ?? ''} data-crime-severity={report.crimeEvent.event?.severity ?? ''} data-crime-target={report.crimeEvent.event?.target ?? ''} data-crime-loss-milli={report.crimeEvent.event?.lossMilli ?? ''} data-crime-soldiers-killed={report.crimeEvent.event?.soldiersKilled ?? ''} data-crime-outcome={report.crimeEvent.event?.outcome ?? ''} data-crime-standing-loss={report.crimeEvent.event?.standingLoss ?? ''} data-crime-authority-loss={report.crimeEvent.event?.authorityLoss ?? ''}><h3>Crime</h3><p>{crimeReportLine(report)}</p></section>{/if}
            {:else if letter.id === 'council'}
              {@render lawsDetails()}
            {:else if letter.id === 'streets'}
    {#if report.crisis}<section aria-label="Crisis" data-crisis-stage-before={report.crisis.stageBefore} data-crisis-stage-after={report.crisis.stageAfter} data-crisis-hungry={report.crisis.hungry} data-crisis-hunger-streak={report.crisis.hungerStreak} data-crisis-calm-streak={report.crisis.calmStreak} data-crisis-weeks-in-stage={report.crisis.weeksInStage} data-crisis-card-opened={report.crisis.cardOpened ?? ''} data-crisis-tension-before={report.crisis.tensionBefore} data-crisis-tension-after={report.crisis.tensionAfter}>
      <h3>Crisis</h3>{#each crisisReportLines(report) as line}<p>{line}</p>{/each}
      {#if report.crisis.promise}<p data-crisis-promise data-crisis-stage={report.crisis.promise.stage} data-crisis-result={report.crisis.promise.result} data-crisis-tension={report.crisis.promise.tensionDelta} data-crisis-authority={report.crisis.promise.authorityDelta}>Promise: {report.crisis.promise.result}</p>{/if}
      {#if report.crisis.lastChoice}<p data-crisis-choice data-crisis-stage={report.crisis.lastChoice.stage} data-crisis-option={report.crisis.lastChoice.option} data-crisis-gold={report.crisis.lastChoice.goldMilli}>Answer: {report.crisis.lastChoice.option}</p>{/if}
    </section>{/if}
            {/if}
          {/snippet}
        </ReportLetter>
      {/each}
    </div>
    <p aria-hidden="true" class="signature">Your steward</p>
  {:else}
    <p>No resolved week yet</p>
  {/if}
  <button class="ledger-wax" aria-disabled={!locked} onclick={event => { if (event.detail < 2) onnextweek(); }}>Plan next week</button>
</section>

<style>
  section { min-width: 0; overflow-wrap: anywhere; }
  .card { margin-bottom: 16px; }
  h2 { font-size: 1.2rem; margin-bottom: 12px; } h3 { font-size: 1.1rem; margin-top: 16px; }
  p { margin: 8px 0; line-height: 1.4; }
  .ledger { overflow-x: auto; padding: 8px; }
  table { width: 100%; border-collapse: collapse; }
  caption { text-align: left; font-weight: bold; margin-bottom: 12px; }
  th, td { padding: 8px; text-align: right; border-bottom: 1px solid var(--border-color); min-width: 6rem; max-width: 10rem; }
  th:first-child { text-align: left; }
  details { margin: 8px 0; } .weekly-report summary { cursor: pointer; min-width: 44px; min-height: 44px; padding-block: 10px; }
  ul { padding-left: 1.5rem; }
  button { font: inherit; padding: 10px; min-height: 44px; min-width: 44px; max-width: 100%; white-space: normal; border-radius: 6px; border: 1px solid var(--accent-green); background: var(--accent-green); color: #000; cursor: pointer; }
  button[aria-disabled='true'] { cursor: default; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; scroll-margin-block: 8px; }
  .report-heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; align-items: start; }
  .report-stamps { display: flex; flex-wrap: wrap; gap: 8px; font-variant-numeric: tabular-nums; }
  .report-stamps span { border: calc(2 * var(--px)) solid var(--brass-edge); padding: 8px; }
  .letters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 16px; margin-block: 16px; }
  .signature { text-align: right; }
  @media (max-width: 750px) { .letters-grid { grid-template-columns: minmax(0, 1fr); } .report-heading { display: block; } }
</style>