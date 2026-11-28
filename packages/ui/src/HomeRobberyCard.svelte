<script lang="ts">
  import type { HomeRobberyOption, MansionPurseTerms, PlayerCharacter } from '@haven/core';
  import { formatMilli } from './milli-format.js';
  import { homeRobberyOptions } from './purse-view.js';

  export let purse: PlayerCharacter['purse'];
  export let security: number;
  export let locked: boolean;
  export let mansion: MansionPurseTerms | undefined = undefined;
  export let onanswer: (option: HomeRobberyOption) => void;

  $: options = homeRobberyOptions(purse, security, locked, mansion);
</script>

<section class="card urgent-letter" data-testid="home-robbery-card" aria-labelledby="home-robbery-title">
  <p aria-hidden="true">Urgent letter</p>
  <p class="ledger-seal urgent-seal">Answer before End Week</p>
  <div class="image-slot" aria-hidden="true"></div>
  <h3 id="home-robbery-title" tabindex="-1">Robbers at the Mansion</h3>
  {#each options as option (option.option)}
    <div>
      <button type="button" class="ledger-plaque" data-robbery-option={option.option}
        aria-disabled={!!option.reason}
        aria-describedby={'home-robbery-' + option.option + '-amount' + (option.reason ? ' home-robbery-' + option.option + '-reason' : '')}
        onclick={() => { if (!option.reason) onanswer(option.option); }}>{option.label}</button>
      <p id={'home-robbery-' + option.option + '-amount'}>
        {option.option === 'chase' ? 'Success: lose 0 Money. Failure: lose ' : 'Lose '}{formatMilli(option.lossMilli)} Money.
      </p>
      {#if option.reason}<p id={'home-robbery-' + option.option + '-reason'}>{option.reason}</p>{/if}
    </div>
  {/each}
</section>

<style>
  .urgent-letter {
    background: var(--wood-dark);
    color: var(--wax-text);
    --text-main: var(--wax-text);
    --text-muted: var(--wax-text);
    border: calc(2 * var(--px)) solid var(--wax);
    padding: 16px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .urgent-seal { display: inline-block; padding: 8px; }
  .image-slot { min-height: 120px; }
  button { font: inherit; min-height: 44px; max-width: 100%; padding: 10px; }
  p { margin: 8px 0; }
  section > div { margin-bottom: 12px; }
</style>
