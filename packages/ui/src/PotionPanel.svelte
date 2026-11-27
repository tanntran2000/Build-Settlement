<script lang="ts">
 import { canSpendMoney, ITEM_CATALOG, ITEM_TRIAL, type PlayerCharacter, type TileTrialState, type WorldNpc } from '@haven/core';
 import { potionShop } from './items-view.js';
 import { heldMoneyNotice } from './purse-view.js';
 import { formatMilli } from './milli-format.js';
 import WorkshopPanel from './WorkshopPanel.svelte';
 export let purse:PlayerCharacter['purse'];
 export let state:TileTrialState;
 export let npcs:WorldNpc[]=[];
 export let tileId:string;
 export let locked:boolean;
 export let managementError:{action:string;message:string}|null;
 export let oncommand:(type:string,fields?:Record<string,unknown>)=>boolean;
 $: selling=potionShop(state,tileId);
 $: holdNotice=heldMoneyNotice(purse);
 $: items=state.society!.items;
 $: building=state.tiles.find(t=>t.id===tileId)?.building;
 let active:'Buy'|'Brew'='Buy';
 let lastWorkshop='';
 let tabs:HTMLDivElement;
 $: if(lastWorkshop!==`${tileId}:${building?.typeId}`){lastWorkshop=`${tileId}:${building?.typeId}`;active='Buy';}
 function tabKey(event:KeyboardEvent) {
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();active=event.key==='Home'?'Buy':event.key==='End'?'Brew':active==='Buy'?'Brew':'Buy';
  tabs.querySelector<HTMLButtonElement>(`[data-potion-tab="${active}"]`)?.focus();
 }
</script>
{#if building&&['hospital','drug-store'].includes(building.typeId)}
<section class="potion-services" aria-label="Potion services">
 <div bind:this={tabs} role="tablist" aria-label="Potion services">
  {#each ['Buy','Brew'] as name}<button role="tab" data-potion-tab={name} id={`potion-${tileId}-${name}`} aria-selected={active===name} aria-controls={`potion-panel-${tileId}-${name}`} tabindex={active===name?0:-1} onclick={()=>active=name as 'Buy'|'Brew'} onkeydown={tabKey}>{name}</button>{/each}
 </div>
 {#if active==='Buy'}<div role="tabpanel" id={`potion-panel-${tileId}-Buy`} aria-labelledby={`potion-${tileId}-Buy`}>
{#if selling}<section aria-label="Potion shop" class="potion-panel"><h4>Potion shop</h4><p>{state.tiles.find(t=>t.id===tileId)!.building!.typeId==='hospital'?'The Hospital is staffed and supplied.':'The Drug Store sells without workers.'}</p>
 {#if holdNotice}<p id="potion-robbery-hold">{holdNotice}</p>{/if}
 <ul>{#each [1,2,3] as tier}{@const key=String(tier) as '1'|'2'|'3'}{@const held=!!holdNotice&&!canSpendMoney(purse,ITEM_TRIAL.potionPricesMilli[key])}<li><strong>{ITEM_CATALOG[`heal-potion-${tier}`].name}</strong><span>Restore {ITEM_TRIAL.potionHeal[key]} health · {formatMilli(ITEM_TRIAL.potionPricesMilli[key])} Money</span><button disabled={locked} aria-disabled={held?true:undefined} aria-describedby={held?'potion-robbery-hold':undefined}
   onclick={()=>{if(!held)oncommand('BUY_POTION',{tileId,potion:tier});}}>Buy {ITEM_CATALOG[`heal-potion-${tier}`].name}</button></li>{/each}</ul>
 {#if managementError?.action==='BUY_POTION'}<p role="alert">{managementError.message}</p>{/if}
</section>{:else if state.tiles.find(t=>t.id===tileId)?.building?.typeId==='hospital'}<p>A Hospital sells potions when enabled, fully staffed, and supplied with Herbs and upkeep.</p>{/if}
 </div>{:else}<div role="tabpanel" id={`potion-panel-${tileId}-Brew`} aria-labelledby={`potion-${tileId}-Brew`}><WorkshopPanel {state} {npcs} {purse} {tileId} {locked} {managementError} {oncommand} /></div>{/if}
</section>
{/if}
{#if items.consumables.length}<section aria-label="Potion inventory" class="potion-panel"><h4>Potion inventory · {items.consumables.length} / {ITEM_TRIAL.consumableCap}</h4><p>Use while Planning to restore the Player's health, up to 100.</p><ul>{#each items.consumables as item (item.id)}<li><strong>{ITEM_CATALOG[item.defId].name}</strong><button disabled={locked} onclick={()=>oncommand('USE_CONSUMABLE',{itemId:item.id})}>Use {ITEM_CATALOG[item.defId].name}</button></li>{/each}</ul>{#if managementError?.action==='USE_CONSUMABLE'}<p role="alert">{managementError.message}</p>{/if}</section>{/if}
<style>
 .potion-panel{min-width:0;border:4px double #6b4f2e;background:#ead8ae;color:#3b2a17;padding:16px;margin:16px 0}h4{font-size:1.3rem;margin:0 0 10px}ul{list-style:none;padding:0;margin:12px 0}li{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:12px 0;border-bottom:1px solid #6b4f2e}li span{flex:1;min-width:140px}button{min-height:44px}p[role='alert']{border:2px solid #8c2a1f;padding:8px}
 .potion-services{min-width:0;margin:16px 0}[role='tablist']{display:flex;flex-wrap:wrap;gap:8px}[role='tab']{font:inherit;min-width:44px;padding:10px 18px;border:2px solid #6b4f2e;background:#ead8ae;color:#3b2a17}[role='tab'][aria-selected='true']{background:#3b2a17;color:#fff2d5;text-decoration:underline;text-underline-offset:4px}[role='tabpanel']{min-width:0}[role='tab']:focus-visible{outline:3px solid #79b8ff;outline-offset:3px;scroll-margin-block:12px}
</style>
