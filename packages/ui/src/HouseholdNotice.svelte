<script lang="ts">
  import { tick } from 'svelte';
  import type { TileTrialState, WorldNpc } from '@haven/core';
  import { departureReason } from './acquisition-view.js';

  let { city, npc, locked, onanswer, onanswered }: {
    city: TileTrialState; npc: WorldNpc; locked: boolean;
    onanswer: (choice: string) => boolean; onanswered: () => void;
  } = $props();
  const id = $props.id();
  const notice = $derived(npc.household.notice);
  const choices = $derived(notice === 'renewal'
    ? [{ value: 'renew', label: 'Renew contract' }, { value: 'release', label: 'Let her go' }]
    : [{ value: 'accept', label: 'Accept lifelong service' }, { value: 'decline', label: 'Decline lifelong service' }]);
  const phaseReason = $derived(locked ? 'Plan next week to answer notices.' : '');
  const releaseReason = $derived(departureReason(city, npc, false, false));

  async function answer(choice: string, reason: string) {
    if (reason || !onanswer(choice)) return;
    await tick();
    onanswered();
  }
</script>

{#if notice}
  <div role="group" aria-label={'Notice for ' + npc.character.name} class="notice" data-household-notice={notice}>
    <p><strong>{notice === 'renewal' ? 'Renewal notice' : 'Lifelong service offer'}</strong></p>
    {#if notice === 'renewal' && releaseReason}
      <p>If she leaves at End Week, she takes equipped gear that cannot be stored together.</p>
    {/if}
    {#each choices as choice (choice.value)}
      {@const reason = phaseReason || (choice.value === 'release' ? releaseReason : '')}
      <button type="button" data-notice-choice={choice.value} aria-disabled={!!reason}
        aria-describedby={reason ? id + '-' + choice.value : undefined}
        onclick={() => void answer(choice.value, reason)}>{choice.label}</button>
      {#if reason}<p id={id + '-' + choice.value}>{reason}</p>{/if}
    {/each}
  </div>
{/if}

<style>
  .notice { min-width: 0; overflow-wrap: anywhere; }
  button { max-width: 100%; min-height: 44px; margin: 4px 4px 4px 0; font: inherit; white-space: normal; }
  button[aria-disabled='true'] { opacity: .65; }
  button:focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
</style>
