<script lang="ts">
  import { WEEKLY_RESOURCE_KEYS, TILE_TRIAL_BALANCE as B, type TileTrialReport } from '@haven/core';
  import { formatFulfillment, formatMilli } from './milli-format.js';
  import { formatLifeWeek } from './life-calendar.js';

  export let report: Readonly<TileTrialReport> | null;
  export let planningWeek: number;
  export let locked: boolean;
  export let onnextweek: () => void;

</script>

<section class="card" aria-label="Weekly city report">
  <button aria-disabled={!locked} onclick={onnextweek}>Plan next week</button>
  {#if report}
    <h2>{formatLifeWeek(report.week)} report</h2>
    {#if !locked}<p>Previous report · Planning is active.</p><p>Planning {formatLifeWeek(planningWeek)}.</p>{/if}
    <section>
      <h3>Needs and services</h3>
      <p>Food consumed: {formatMilli(report.foodConsumedMilli)} / {formatMilli(report.foodDemandMilli)} · {formatFulfillment(report.foodConsumedMilli, report.foodDemandMilli)}.</p>
      <p>Food unmet: {formatMilli(report.foodDemandMilli - report.foodConsumedMilli)}.</p>
      <p data-testid="trial-goods">Goods service: {formatMilli(report.goods.servedMilli)} / {formatMilli(report.goods.demandMilli)} · {formatFulfillment(report.goods.servedMilli, report.goods.demandMilli)}. Materials used once: {formatMilli(report.goods.woodUsed)} Wood, {formatMilli(report.goods.ironUsed)} Iron. Revenue: {formatMilli(report.goods.revenueMilli)} Gold.</p>
      {#if report.goodsStock}<p data-testid="goods-stock-flow">Goods stock: opening {formatMilli(report.goodsStock.openingMilli)} · produced {formatMilli(report.goodsStock.producedMilli)} · distributed {formatMilli(report.goodsStock.distributedMilli)} · closing {formatMilli(report.goodsStock.closingMilli)}. Demand {formatMilli(report.goodsStock.demandMilli)}; unmet {formatMilli(report.goodsStock.unmetMilli)}; capacity {formatMilli(report.goodsStock.capacityMilli)}; limited by {report.goodsStock.limitedBy}.</p>{/if}
      <p>Goods unmet: {formatMilli(report.goods.demandMilli - report.goods.servedMilli)}.</p>
    </section>
    <section>
      <h3>Gold and upkeep</h3>
      <p>Tax: {formatMilli(report.taxMilli)} Gold. Upkeep covered: {formatMilli(report.upkeepPaidMilli)} Gold; unfunded: {formatMilli(report.unpaidUpkeepMilli)} Gold (no debt). Farm batch payment: {formatMilli(report.farmBatchGoldMilli)} Gold; extra Farm upkeep: {formatMilli(report.farmExtraUpkeepMilli)} Gold.</p>
    </section>
    <section>
      <h3>Population and happiness</h3>
      {#if report.immigration}<p data-testid="trial-immigration">Population: {report.immigration.populationBefore} → {report.immigration.populationAfter} · {report.immigration.arrivals} arrivals · Available next week.</p>{/if}
      <p>Happiness: {report.happinessBefore} → {report.happinessAfter}.</p>
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
    <details>
      <summary>How this is calculated</summary>
      <p>Stock change is closing stock minus opening stock for this resolved week. It is not gross production or a forecast.</p>
      {#if report.goodsStock}<p>IMPLEMENTATION TRIAL: 1 Workshop WF + 2 Wood → 2 stored Goods per funded batch; no Iron. Funded Markets distribute up to 2 Goods per level weekly, limited by stock and demand of 0.02 per resident. Unused stock carries over. Only distribution earns 1 Gold per Goods, once. Stored Goods is not recurring income; actual sale Gold remains cash.</p>
      {:else}<p>TRIAL: tax {formatMilli(B.taxGoldPerResident)} Gold/resident/week; Goods demand {formatMilli(B.goodsDemandPerResident)} service/resident/week. Workshop: 1 WF + {formatMilli(B.goodsWoodPerBatch)} Wood + {formatMilli(B.goodsIronPerBatch)} Iron → {formatMilli(B.goodsServicePerBatch)} service. Market: {formatMilli(B.marketServicePerLevel)} service/level; raises capacity, not demand. Whole Workshop batches may have unused service; nothing carries over.</p>{/if}
      <p>Goods earns {formatMilli(B.goldPerServiceMilli)} Gold/service and up to {B.goodsHappinessMax} Happiness at full fulfillment. Food need: {formatMilli(B.foodDemandPerResident)} per resident/week. Maintenance is funded in tile order; tax arrives first.</p>
      {#if report.immigration}<p>Immigration target: {report.immigration.target}. Useful worker slots: {report.immigration.usefulWorkerSlots}. Renewable Food: {formatMilli(report.immigration.renewableFoodMilli)}. Reason: {report.immigration.reason}.</p>{/if}
    </details>
  {:else}
    <p>No resolved week yet</p>
  {/if}
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
  details { margin: 8px 0; } summary { cursor: pointer; min-height: 24px; }
  ul { padding-left: 1.5rem; }
  button { font: inherit; padding: 10px; min-height: 44px; min-width: 44px; max-width: 100%; white-space: normal; border-radius: 6px; border: 1px solid var(--accent-green); background: var(--accent-green); color: #000; cursor: pointer; }
  button[aria-disabled='true'] { opacity: .5; cursor: default; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; scroll-margin-block: 8px; }
</style>
