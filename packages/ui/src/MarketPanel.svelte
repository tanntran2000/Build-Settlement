<script lang="ts">
 import { ITEM_CATALOG, ITEM_TRIAL, type TileTrialState } from '@haven/core';
 import ItemCard from './ItemCard.svelte';
 import { materialRows, parseItemCount } from './items-view.js';
 import { formatMilli } from './milli-format.js';
 export let state:TileTrialState;
 export let locked:boolean;
 export let managementError:{action:string;message:string}|null;
 export let oncommand:(type:string,fields?:Record<string,unknown>)=>boolean;
 let counts:Record<string,string>={},error='';
 $: items=state.society!.items;
 function input(id:string,event:Event){const el=event.currentTarget as HTMLInputElement;if(/^\d*$/.test(el.value))counts={...counts,[id]:el.value};else el.value=counts[id]??'1';}
 function sell(id:string){const count=parseItemCount(counts[id]??'1',items.materials[id]);error=count===null?'Enter a whole count from 1 to the available stack.':'';if(count!==null)oncommand('SELL_MATERIAL',{materialId:id,count});}
 const price=(id:string)=>Math.floor(ITEM_CATALOG[id].basePriceMilli*ITEM_TRIAL.resaleBps/10000);
</script>
<section aria-label="Item Market" class="market-panel">
 <header><h4>Item Market</h4><p>Shared weekly offers · purchases leave the shelf until next week.</p></header>
 {#if error}<p role="alert">{error}</p>{:else if managementError&&['BUY_ITEM','SELL_ITEM','SELL_MATERIAL'].includes(managementError.action)}<p role="alert">{managementError.message}</p>{/if}
 <div role="group" aria-label="Weekly offers"><h5>Weekly offers · {items.market.length} remaining</h5><div class="cards">{#each items.market as offer,index}<ItemCard definition={ITEM_CATALOG[offer.defId]} {locked} priceMilli={offer.priceMilli} onbuy={()=>{error='';oncommand('BUY_ITEM',{offerIndex:index});}} />{:else}<p>No offers remain. Return after End Week.</p>{/each}</div></div>
 <div role="group" aria-label="Sell inventory"><h5>Sell inventory</h5><p>Resale is {ITEM_TRIAL.resaleBps/100}% of base price. Legendary items cannot be sold.</p><div class="cards">{#each [...items.inventory,...items.consumables] as item (item.id)}<ItemCard definition={ITEM_CATALOG[item.defId]} {locked} priceMilli={ITEM_CATALOG[item.defId].rarity==='legendary'?undefined:price(item.defId)} onsell={ITEM_CATALOG[item.defId].rarity==='legendary'?undefined:()=>{error='';oncommand('SELL_ITEM',{itemId:item.id});}} />{:else}<p>No items to sell.</p>{/each}</div></div>
 <h5>Sell materials</h5><div class="material-scroll"><table><caption>Materials for sale</caption><thead><tr><th scope="col">Material</th><th scope="col">Rarity</th><th scope="col">Count</th><th scope="col">Each</th><th scope="col">Sale</th></tr></thead><tbody>{#each materialRows(items) as row}<tr><th scope="row">{row.name}</th><td>{row.rarity}</td><td>{row.count}</td><td>{ITEM_CATALOG[row.id].rarity==='legendary'?'Not for sale':`${formatMilli(price(row.id))} Gold`}</td><td>{#if ITEM_CATALOG[row.id].rarity!=='legendary'}<input type="text" inputmode="numeric" pattern="[0-9]*" aria-label={`Sell ${row.name} count`} value={counts[row.id]??'1'} disabled={locked} oninput={event=>input(row.id,event)} /><button disabled={locked} onclick={()=>sell(row.id)}>Sell material</button>{:else}Legendary · kept{/if}</td></tr>{/each}</tbody></table></div>
</section>
<style>
 .market-panel{min-width:0;padding:16px;margin:16px 0;border:4px double #6b4f2e;background:#ead8ae;color:#3b2a17}h4{font-size:1.4rem;margin:0 0 8px}h5{font-size:1.15rem;margin:18px 0 10px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:14px}table{width:100%;border-collapse:collapse}th,td{padding:8px;text-align:left;border-bottom:1px solid #6b4f2e;overflow-wrap:anywhere}input{width:5rem;min-height:44px}td button{min-height:44px;margin:4px}.material-scroll{overflow-x:auto}p[role='alert']{border:2px solid #8c2a1f;padding:8px}@media(max-width:600px){.market-panel{padding:10px}th,td{padding:5px}input{width:3rem}}
</style>
