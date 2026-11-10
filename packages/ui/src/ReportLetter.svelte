<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ReportLetterView } from './report-letters.js';
  export let letter: ReportLetterView;
  export let details: Snippet;
</script>

<section class="ledger-parchment report-letter" aria-label={letter.sender} data-letter={letter.id}>
  <p class="sender"><span class="icon-slot" aria-hidden="true"></span>{letter.sender}</p>
  <span class="letter-seal" class:bad={letter.seal === 'Bad'} class:watch={letter.seal === 'Watch'}>{letter.seal}</span>
  <h3>{letter.headline}</h3>
  <dl class="letter-rows">
    {#each letter.rows as row}
      <div data-tone={row.tone} data-sentence={row.value === '' ? '' : undefined}>
        <dt>{row.label}</dt>{#if row.value !== ''}<dd>{row.value}</dd>{/if}
      </div>
    {/each}
  </dl>
  <details><summary>Details</summary>{@render details()}</details>
</section>

<style>
  .report-letter { min-width: 0; padding: 16px; overflow-wrap: anywhere; }
  .sender { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-weight: bold; }
  .icon-slot { flex: 0 0 12px; height: 12px; border: var(--px) solid var(--brass-edge); background: var(--brass); }
  .letter-seal { display: inline-block; border: calc(2 * var(--px)) solid var(--brass-edge); background: var(--brass); color: var(--ink); padding: 4px 8px; }
  .letter-seal.bad { background: var(--wax); color: var(--wax-text); }
  .letter-seal.watch { background: var(--oak); color: var(--oak-text); }
  h3 { margin-block: 12px; font-weight: bold; }
  .letter-rows { font-variant-numeric: tabular-nums; margin-block: 12px; }
  .letter-rows > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; padding-block: 8px; border-bottom: var(--px) solid var(--brass-edge); }
  .letter-rows > div[data-sentence] { display: block; }
  [data-tone='gain'] { color: var(--ink-gain); }
  [data-tone='loss'] { color: var(--ink-loss); }
  [data-tone='muted'] { color: var(--ink-muted); }
  dd { margin: 0; text-align: right; }
  details { min-width: 0; }
  .report-letter > details > summary { cursor: pointer; min-width: 44px; min-height: 44px; padding-block: 10px; }
</style>
