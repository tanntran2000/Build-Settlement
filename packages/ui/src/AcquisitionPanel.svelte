<script lang="ts">
  import { tick } from 'svelte';
  import { AUCTION_TRIAL, type AcquisitionSource, type TileTrialState, type WorldNpc } from '@haven/core';
  import { ACQUISITION_MESSAGES, isAcquisitionCommand } from '@haven/simulation';
  import { acquisitionView, departureReason, goldLabel, recruitReason, saleGold, sourceLabel, type cardFor } from './acquisition-view.js';

  export let state: TileTrialState;
  export let npcs: readonly WorldNpc[];
  export let source: AcquisitionSource;
  export let tileId: string;
  export let locked: boolean;
  export let managementError: { action: string; message: string } | null;
  export let oncommand: (type: string, fields?: Record<string, unknown>) => boolean;

  type Tab = 'sale' | 'auction';
  let active: Tab = 'sale';
  let tabButtons: Partial<Record<Tab, HTMLButtonElement>> = {};
  let heading: HTMLHeadingElement;
  let choices: Record<string, string> = {};
  $: view = acquisitionView(state, npcs, source);
  $: tabs = (source === 'guild' ? ['sale'] : ['sale', 'auction']) as Tab[];
  $: defaultHome = view.homes.find(home => home.free > 0)?.id ?? view.homes[0]?.id ?? '';
  $: recruit = source === 'guild' ? 'Hire' : 'Buy';

  function focusTab(event: KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    active = event.key === 'Home' ? 'sale' : event.key === 'End' ? tabs[tabs.length - 1] :
      tabs[(tabs.indexOf(active) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    tabButtons[active]?.focus();
  }

  async function sell(npcId: string, reason: string) {
    if (reason || !oncommand('SELL_NPC', { npcId })) return;
    await tick();
    heading.focus();
  }
</script>

{#snippet cardDetails(card: ReturnType<typeof cardFor>)}
  <p>Age {card.age} · {card.title} · {card.origin}</p>
  <p>{card.source} · {card.status}</p>
  <p>{card.skills.map(skill => `${skill.label} ${skill.value}`).join(' · ')}</p>
  <p>Beauty {card.beauty} · Mind {card.mind} · Obedience {card.obedience}</p>
{/snippet}

{#snippet homePicker(key: string, label: string, homeTileId: string)}
  <label for={`acq-${key}-home`}>Home for {label}</label>
  <select id={`acq-${key}-home`} value={homeTileId} onchange={event => { choices = { ...choices, [key]: event.currentTarget.value }; }}>
    {#each view.homes as home (home.id)}
      <option value={home.id}>{home.label} · {home.free} free</option>
    {/each}
  </select>
{/snippet}

<section class="card acquisition" aria-labelledby={`acquisition-panel-${tileId}`} data-acquisition-panel={source}>
  <h4 id={`acquisition-panel-${tileId}`} tabindex="-1" bind:this={heading}>{sourceLabel(source)} acquisitions</h4>
  <div role="tablist" aria-label="Acquisition listings">
    {#each tabs as tab (tab)}
      <button type="button" role="tab" bind:this={tabButtons[tab]} id={`acq-${tileId}-${tab}`}
        aria-selected={active === tab} aria-controls={`acq-${tileId}-${tab}-panel`} tabindex={active === tab ? 0 : -1}
        onclick={() => { active = tab; }} onkeydown={focusTab}>{tab === 'sale' ? 'For sale' : 'Auction'}</button>
    {/each}
  </div>
  <div role="tabpanel" id={`acq-${tileId}-sale-panel`} aria-labelledby={`acq-${tileId}-sale`} hidden={active !== 'sale'}>
    <div class="listings">
      {#each view.stock as { offer, card } (offer.slot)}
        {@const key = `${tileId}-${offer.slot}`}
        {@const home = choices[key] ?? defaultHome}
        {@const reason = recruitReason(locked, offer.status === 'open', view.goldMilli, card.priceMilli,
          view.homes.some(entry => entry.id === home && entry.free > 0), npcs.length)}
        <article data-acquisition-offer={offer.slot}>
          <h5>{card.name}</h5>
          {@render cardDetails(card)}
          <p>{offer.status === 'bought' ? (source === 'guild' ? 'Hired' : 'Bought') : goldLabel(card.priceMilli)}
            {#if card.wageMilli !== undefined} · {goldLabel(card.wageMilli)}/week{/if}</p>
          {@render homePicker(key, card.name, home)}
          <button type="button" data-acquisition-action="BUY_NPC" aria-disabled={!!reason}
            aria-describedby={reason ? `acq-${key}-reason` : undefined}
            onclick={() => { if (!reason) oncommand('BUY_NPC', { source, slot: offer.slot, homeTileId: home }); }}>{recruit}</button>
          {#if reason}<p id={`acq-${key}-reason`}>{reason}</p>{/if}
        </article>
      {:else}<p>No offers this week.</p>{/each}
    </div>
    {#if source === 'slave-market' && npcs.length}
      <section aria-label="Sell an NPC">
        <h5>Sell an NPC</h5>
        <ul>
          {#each npcs as npc (npc.character.id)}
            {@const reason = departureReason(state, npc, locked, true)}
            <li><span>{npc.character.name}{npc.household.status === 'slave' ? ` · ${saleGold(npc)}` : ''}</span>
              <button type="button" data-acquisition-action="SELL_NPC" aria-label={`Sell ${npc.character.name}`} aria-disabled={!!reason}
                aria-describedby={reason ? `acq-sell-${npc.character.id}-reason` : undefined}
                onclick={() => sell(npc.character.id, reason)}>Sell</button>
              {#if reason}<span id={`acq-sell-${npc.character.id}-reason`}>{reason}</span>{/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
  {#if source !== 'guild'}
    <div role="tabpanel" id={`acq-${tileId}-auction-panel`} aria-labelledby={`acq-${tileId}-auction`} hidden={active !== 'auction'}>
      {#if view.auction}
        {@const { card, lot, opening, leader, rivals, log } = view.auction}
        {@const home = choices[tileId + '-lot'] ?? defaultHome}
        {@const withdrawReason = locked ? 'Plan next week to make changes.' : lot.status !== 'open' ? ACQUISITION_MESSAGES.OFFER_GONE : ''}
        <article>
          <h5>{card.name}</h5>
          {@render cardDetails(card)}
          <p>Opening {goldLabel(opening)} · Current {goldLabel(lot.priceMilli)} · Leader {leader}</p>
          <ul aria-label="Rival bidders">
            {#each rivals as rival (rival.name)}
              <li>{rival.name} · {rival.hint} · {rival.out ? 'Out' : 'In'}</li>
            {/each}
          </ul>
          {@render homePicker(tileId + '-lot', card.name, home)}
          <div class="bid-controls">
            {#each AUCTION_TRIAL.playerRaisesMilli as raise}
              {@const reason = recruitReason(locked, lot.status === 'open', view.goldMilli, lot.priceMilli + raise,
                view.homes.some(entry => entry.id === home && entry.free > 0), npcs.length)}
              <div>
                <button type="button" data-acquisition-action="BID_NPC" aria-disabled={!!reason}
                  aria-describedby={reason ? `acq-${tileId}-bid-${raise}-reason` : undefined}
                  onclick={() => { if (!reason) oncommand('BID_NPC', { source, raise, homeTileId: home }); }}>+{goldLabel(raise)}</button>
                {#if reason}<p id={`acq-${tileId}-bid-${raise}-reason`}>{reason}</p>{/if}
              </div>
            {/each}
            <div>
              <button type="button" data-acquisition-action="WITHDRAW_BID" aria-disabled={!!withdrawReason}
                aria-describedby={withdrawReason ? `acq-${tileId}-withdraw-reason` : undefined}
                onclick={() => { if (!withdrawReason) oncommand('WITHDRAW_BID', { source }); }}>Withdraw</button>
              {#if withdrawReason}<p id={`acq-${tileId}-withdraw-reason`}>{withdrawReason}</p>{/if}
            </div>
          </div>
          <h5>Bid log</h5>
          {#if !log.length}<p>No bids yet.</p>{/if}
          <ol aria-label="Bid log" aria-live="polite" aria-relevant="additions">
            {#each log as line}<li>{line}</li>{/each}
          </ol>
        </article>
      {:else}<p>No lot this week.</p>{/if}
    </div>
  {/if}
  {#if managementError && isAcquisitionCommand(managementError.action)}<p role="alert">{managementError.message}</p>{/if}
</section>

<style>
  .acquisition, article { min-width: 0; overflow-wrap: anywhere; }
  .listings { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: 1rem; }
  article { padding: 0.75rem; border: 1px solid currentColor; }
  label, select { display: block; max-width: 100%; }
  .bid-controls, [role="tablist"] { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block: 0.5rem; }
  button[aria-selected="true"] { text-decoration: underline; text-underline-offset: 0.2em; }
  button[aria-disabled="true"] { cursor: not-allowed; }
</style>
