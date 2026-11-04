<script lang="ts">
 import { crisisOptions, societyPopulation, CRISIS_TRIAL, type TileTrialState, type CardOption } from '@haven/core';
 import { CRISIS_CARD_COPY } from './society-view.js';
 import { formatMilli } from './milli-format.js';
 export let state:TileTrialState;
 export let onchoose:(cardId:string,option:CardOption)=>void;
 $: card=state.society!.pendingCard;
 $: options=card?crisisOptions(card.kind,{population:societyPopulation(state.society!),goldMilli:state.world.settlements[state.world.activeSettlementId!].inventory.gold,security:state.society!.order.security,promisePending:state.society!.crisis.promise!==null}):[];
</script>
{#if card}
<section class="card" data-testid="crisis-card" aria-label={CRISIS_CARD_COPY[card.kind].title}>
 <div class="image-slot" aria-hidden="true"></div>
 <h3>{CRISIS_CARD_COPY[card.kind].title}</h3><p>{CRISIS_CARD_COPY[card.kind].text}</p>
 {#each options as option}
 <div><button data-card-option={option.option} disabled={!option.available} onclick={()=>onchoose(card!.id,option.option)}>{option.option[0].toUpperCase()+option.option.slice(1)}</button>
 <p>{#if option.option==='pay'}−{formatMilli(option.goldMilli)} Gold, Tension −{Math.abs(option.tensionDelta)}.
 {:else if option.option==='promise'}Keep the city fed for {CRISIS_TRIAL.promise.weeks} weeks: Tension −{Math.abs(CRISIS_TRIAL.promise.kept[card.kind])}, Authority +{CRISIS_TRIAL.promise.keptAuthority}. Hunger breaks the promise: Tension +{CRISIS_TRIAL.promise.brokenTension}, Authority −{Math.abs(CRISIS_TRIAL.promise.brokenAuthority)}.
 {:else if option.option==='force'}Tension −{Math.abs(option.tensionDelta)}, Authority +{CRISIS_TRIAL.force.authority}, Crime +{CRISIS_TRIAL.force.crime}, every class's satisfaction −{Math.abs(CRISIS_TRIAL.force.satisfaction)}.
 {:else}Tension +{option.tensionDelta}.{/if}</p>
 {#if option.reason}<p>{option.reason}</p>{/if}</div>
 {/each}
</section>
{/if}
<style>.image-slot{min-height:120px}section{min-width:0;overflow-wrap:anywhere}button{font:inherit;min-height:44px;padding:10px;cursor:pointer}p{margin:8px 0}section>div{margin-bottom:12px}</style>
