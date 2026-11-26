<script lang="ts">
  import type { DifficultyId, PlayerCharacter } from '@haven/core';
  import { formatMilli } from './milli-format.js';
  import { purseControls } from './purse-view.js';

  export let purse: PlayerCharacter['purse'];
  export let locked: boolean;
  export let difficulty: DifficultyId;
  export let oncommand: (type: 'SET_LEVY' | 'DONATE_MONEY', fields: Record<string, unknown>) => boolean;

  let input = '';
  $: controls = purseControls(purse, input, locked, difficulty);

  function donate(event: SubmitEvent) {
    event.preventDefault();
    const { donateReason, amountMilli } = purseControls(purse, input, locked, difficulty);
    if (!donateReason && oncommand('DONATE_MONEY', { amountMilli })) input = '';
  }
</script>

<section aria-labelledby="purse-title" class="card">
  <h3 id="purse-title">Purse</h3>
  <p>Money {formatMilli(purse.moneyMilli)}</p>
  <div class="levy" role="group" aria-label="Weekly levy">
    <button type="button" aria-label="Decrease weekly levy" aria-disabled={!!controls.decreaseReason}
      aria-describedby={controls.decreaseReason ? 'levy-decrease-reason' : undefined}
      onclick={() => { if (!controls.decreaseReason) oncommand('SET_LEVY', { percent: purse.levyPercent - 1 }); }}>−</button>
    <span aria-live="polite">{purse.levyPercent} %</span>
    <button type="button" aria-label="Increase weekly levy" aria-disabled={!!controls.increaseReason}
      aria-describedby={controls.increaseReason ? (controls.increaseReason === controls.decreaseReason ? 'levy-decrease-reason' : 'levy-increase-reason') : undefined}
      onclick={() => { if (!controls.increaseReason) oncommand('SET_LEVY', { percent: purse.levyPercent + 1 }); }}>+</button>
  </div>
  {#if controls.decreaseReason}<p id="levy-decrease-reason">{controls.decreaseReason}</p>{/if}
  {#if controls.increaseReason && controls.increaseReason !== controls.decreaseReason}<p id="levy-increase-reason">{controls.increaseReason}</p>{/if}
  <p>
    Happiness cost: {controls.happinessCost ? '−' : ''}{controls.happinessCost} a week{controls.donationOffset
      ? ` (levy −${controls.levyCost}, donation +${controls.donationOffset})` : ''}
  </p>
  <p>Safe amount — · At risk —</p>
  <form onsubmit={donate}>
    <label for="purse-donate-amount">Donation amount in Money</label>
    <input id="purse-donate-amount" type="text" inputmode="numeric" bind:value={input}
      disabled={locked} aria-describedby={controls.donateReason ? 'purse-donate-reason' : undefined} />
    <button type="submit" aria-disabled={!!controls.donateReason}
      aria-describedby={controls.donateReason ? 'purse-donate-reason' : undefined}>Donate</button>
    {#if controls.donateReason}<p id="purse-donate-reason">{controls.donateReason}</p>
    {:else if controls.amountMilli !== null && controls.goldMilli !== null}
      <p>{formatMilli(controls.amountMilli)} Money → {formatMilli(controls.goldMilli)} Gold</p>
    {/if}
  </form>
</section>

<style>
  section { padding: 16px; }
  .levy { display: flex; align-items: center; gap: 12px; }
  label { display: block; }
  input { width: min(12em, 100%); }
</style>
