<script lang="ts">
 import { ITEM_CATALOG, ITEM_TRIAL, type TileTrialState } from '@haven/core';
 import { potionShop } from './items-view.js';
 import { formatMilli } from './milli-format.js';
 export let state:TileTrialState;
 export let tileId:string;
 export let locked:boolean;
 export let managementError:{action:string;message:string}|null;
 export let oncommand:(type:string,fields?:Record<string,unknown>)=>boolean;
 $: selling=potionShop(state,tileId);
 $: items=state.society!.items;
</script>
{#if selling}<section aria-label="Potion shop" class="potion-panel"><h4>Potion shop</h4><p>{state.tiles.find(t=>t.id===tileId)!.building!.typeId==='hospital'?'The Hospital is staffed and supplied.':'The Drug Store sells without workers.'}</p>
 <ul>{#each [1,2,3] as tier}{@const key=String(tier) as '1'|'2'|'3'}<li><strong>{ITEM_CATALOG[`heal-potion-${tier}`].name}</strong><span>Restore {ITEM_TRIAL.potionHeal[key]} health · {formatMilli(ITEM_TRIAL.potionPricesMilli[key])} Gold</span><button disabled={locked} onclick={()=>oncommand('BUY_POTION',{tileId,potion:tier})}>Buy {ITEM_CATALOG[`heal-potion-${tier}`].name}</button></li>{/each}</ul>
 {#if managementError?.action==='BUY_POTION'}<p role="alert">{managementError.message}</p>{/if}
</section>{:else if state.tiles.find(t=>t.id===tileId)?.building?.typeId==='hospital'}<p>A Hospital sells potions when enabled, fully staffed, and supplied with Herbs and upkeep.</p>{/if}
{#if items.consumables.length}<section aria-label="Potion inventory" class="potion-panel"><h4>Potion inventory · {items.consumables.length} / {ITEM_TRIAL.consumableCap}</h4><p>Use while Planning to restore the Player's health, up to 100.</p><ul>{#each items.consumables as item (item.id)}<li><strong>{ITEM_CATALOG[item.defId].name}</strong><button disabled={locked} onclick={()=>oncommand('USE_CONSUMABLE',{itemId:item.id})}>Use {ITEM_CATALOG[item.defId].name}</button></li>{/each}</ul>{#if managementError?.action==='USE_CONSUMABLE'}<p role="alert">{managementError.message}</p>{/if}</section>{/if}
<style>
 .potion-panel{min-width:0;border:4px double #6b4f2e;background:#ead8ae;color:#3b2a17;padding:16px;margin:16px 0}h4{font-size:1.3rem;margin:0 0 10px}ul{list-style:none;padding:0;margin:12px 0}li{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:12px 0;border-bottom:1px solid #6b4f2e}li span{flex:1;min-width:140px}button{min-height:44px}p[role='alert']{border:2px solid #8c2a1f;padding:8px}
</style>
