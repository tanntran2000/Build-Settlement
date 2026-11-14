<script lang="ts">
 import { tick } from 'svelte';
 import { ITEM_CATALOG, ITEM_TRIAL, type CharacterLifeSessionState, type ItemInstance, type Slot } from '@haven/core';
 import { executeCharacterLifeCommand } from '@haven/simulation';
 import ItemCard from './ItemCard.svelte';
 import { equipmentSlots, characterTotals, itemPreview, matchesItem, materialRows, itemTitle, itemError } from './items-view.js';
 export let session:CharacterLifeSessionState;
 export let characterId:string;
 export let locked:boolean;
 export let onapply:(next:CharacterLifeSessionState)=>void;
 let view='Inventory',filter='All',slot:Slot='weapon',error='',destroyTarget:ItemInstance|null=null;
 let dialog:HTMLDialogElement,opener:HTMLButtonElement|null=null;
 $: items=session.city.society!.items;
 $: kind=characterId===session.player.character.id?'player' as const:'npc' as const;
 $: totals=characterTotals(session,characterId);
 $: worn=items.equipped[characterId]??{};
 function run(type:string,fields:Record<string,unknown>) {
   const r=executeCharacterLifeCommand(session,{type,expectedRevision:session.city.revision,...fields});
   error=r.success?'':itemError(r.error.code);if(r.success)onapply(r.next);
 }
 async function confirm(item:ItemInstance,event:MouseEvent){destroyTarget=item;opener=event.currentTarget as HTMLButtonElement;await tick();dialog.showModal();}
 function close(){dialog.close();destroyTarget=null;opener?.focus();}
</script>
<section aria-label="Equipment" class="equipment">
 <header><h4>Equipment</h4><p>Outfit the bearer. Skills take effect at End Week.</p></header>
 {#if error}<p role="alert">{error}</p>{/if}
 <div class="loadout">
  <div class="doll">
   {#if kind==='npc'}
   <svg role="img" aria-label="NPC silhouette" viewBox="0 0 100 200">
    <path fill-rule="evenodd" d="M55.6 20.3C52.8 17.4 50.6 16.9 48.7 16.9C43.7 16.9 40.5 18.4 38.4 21.5C37.1 23.4 37.6 25.3 35.3 28.4C33.3 30.4 31.7 32.2 32.4 35.8C32.8 37.8 34.4 39.4 33.2 41.7C31.1 44 29.9 45.6 30.5 47.7C31.1 50.3 33.2 51.7 35.8 50.5C31.7 51.4 30 53.7 27.8 56.3L16.9 70.8C15.8 72.3 16.4 73.7 17.6 75.3C21.4 81.5 26.3 87.1 30.5 90.8C31.7 91.8 32.8 91.6 34.2 91.5C31.3 95 29.7 99.4 29.7 103.8C29.7 109.3 32.4 114.6 35 121.5C37 126.9 40.4 134.4 40.6 138.2C40.9 142.5 38.7 145.7 39.2 151.8C39.7 157.7 42.4 165.8 43.6 171.9C44.3 176.1 45 179.5 43.8 182C43 183.5 42.3 184.5 42.3 185.3C42.4 186.8 45.8 187.1 48.1 186.9C49.4 186.8 49.9 186.4 49.9 185C49.9 182.1 49 177 48.8 172.7C48.6 166.7 48.3 163.2 49 158.7C49.8 153.2 49.5 148.2 48.8 143.4C48.4 140.8 48.7 138.7 48.9 136.2C49.5 131.9 49 127.1 49 122.1C49 115 48.9 110.7 49.3 108.8C49.5 108 49.7 107.9 49.9 107.8C50.9 109.5 50.9 113.7 50.8 119.1C50.7 125.5 50.9 131.5 51.2 136.2C51.4 139.5 51.3 141.9 51 144.1C50.4 149.6 50.2 152.5 50.2 156.1C50.4 161.5 50.8 164.6 50.9 168.4C51 175.7 49.9 181.4 50.2 185.5C50.3 187.1 53.9 187.1 56.6 186.5C58.5 186.1 57.9 184.8 57.3 183.9C55.6 181.9 55.3 179.4 55.4 177.1C55.8 171.9 56.5 167.3 58.1 161.8C59.9 156 61.1 152.3 60.8 148.5C60.6 144 58.9 141.2 59.2 137.2C59.7 131.2 62.4 124.7 64.7 119C68.1 111.6 70.1 107.7 70.1 103.5C70.1 99.4 68.4 95.1 65.9 91.6C67.7 91.9 69 91.2 70.2 90C74.7 85.7 79.9 79.3 82.9 74.4C83.9 72.9 83.5 71.7 82.5 70.3L71 56.7C68.2 53.4 66.6 51.6 63.8 51C65.8 51.3 67.1 51.3 68.3 49.7C70.2 47 68.1 44 66.6 42.3C65.1 40 65.6 38.8 66.3 36.9C67.5 32.4 64.6 31.4 63.4 29.1C62 26.3 62.6 23.1 59.6 21.3C58.3 20.5 56.9 20.2 55.6 20.3Z
     M38 54C36.9 58 34.5 59.6 33.8 63C32.8 67.6 34.5 70.7 38.9 72.8C40.8 75.4 41.7 78.6 41.4 80.6C41.2 82.5 40.1 84.1 38.7 85.3C36.5 84.6 34.5 85.8 33 86.5L23.7 72.3L33.5 61.6C35.6 58.9 37 56.6 38 54Z
     M65.1 61.2L76.2 72.2L67 86.5C65.3 86.3 63.3 84.5 61.1 85.1C59.3 83 58.2 81.8 58.2 79.5C58.2 77.2 59.3 74.7 60.5 73.2C65.8 70.8 66.8 67.2 65.1 61.2Z"/>
    <path fill="#d9c499" d="M52.3 23.3C55 24.1 57 26.4 58.4 29.7C59.4 32.1 61.8 32.6 62.9 35.1C64.1 37.9 62.9 40 62.2 41.3C63.6 39.9 64.7 36.3 63.2 34C61.7 31.5 59.7 31.7 58.9 28.6C57.5 25.3 55.5 23.7 52.3 23.3Z
     M39.1 28.7C38.5 31.1 34.6 32.5 35 36.8C34 33.5 35.9 31.2 37.4 30.2C38.2 29.7 38.7 29.2 39.1 28.7Z
     M37 41.2C36.9 44.6 33.7 46.2 35.1 49.2L36.8 50.7C34.4 50.5 33.8 48.4 34.7 46.7C35.8 44.7 36.6 43.9 37 41.2Z"/>
    <path fill="none" stroke="#d9c499" stroke-width=".7" stroke-linecap="round" d="M39.3 34.5C39.3 39.7 42.2 43.4 45.3 45.2C46.3 49.2 42.7 50.2 39.7 50.8M60 35C59.1 40.2 57.5 43 54.2 45.2C53.7 48.5 55.6 50 57.6 50.8"/>
   </svg>
   {:else}
   <svg role="img" aria-label="Character silhouette" viewBox="0 0 100 200"><circle cx="50" cy="24" r="17"/><path d="M34 47H66L83 100L72 105L61 72L63 125L69 188H54L50 139L46 188H31L37 125L39 72L28 105L17 100Z"/></svg>
   {/if}
   <div class="slots">{#each equipmentSlots(kind) as entry}
    <button data-item-slot={entry.id} data-locked={entry.locked?'true':undefined} disabled={entry.locked} aria-pressed={slot===entry.id} onclick={()=>{slot=entry.id;filter='This slot';view='Inventory';}}>
     <strong>{entry.label}</strong><span>{entry.locked?'Locked':worn[entry.id]?ITEM_CATALOG[worn[entry.id]!.defId].name:['top','bottom','shoes'].includes(entry.id)&&worn.set?ITEM_CATALOG[worn.set.defId].name:'Empty'}</span>
    </button>
   {/each}</div>
  </div>
  <section aria-label="Effective skills" class="totals"><h5>Effective skills</h5>{#each totals.skills as row}<p>{row.skill} {row.value} ({row.bonus>=0?'+':''}{row.bonus})</p>{/each}{#if totals.regen!==null}<p>Regen +{totals.regen}/week</p>{/if}
   {#each Object.entries(worn) as [wornSlot,item]}<button disabled={locked} onclick={()=>run('UNEQUIP_ITEM',{characterId,slot:wornSlot})}>Unequip {itemTitle(wornSlot)} · {ITEM_CATALOG[item.defId].name}</button>{/each}
  </section>
 </div>
 <div class="switches" role="group" aria-label="Item sections">{#each ['Inventory','Materials','Temporary storage'] as name}<button aria-pressed={view===name} onclick={()=>view=name}>{name}</button>{/each}</div>
 {#if view==='Inventory'}
  <h5>Inventory {items.inventory.length} / {ITEM_TRIAL.inventoryCap}</h5>
  <div class="switches" role="group" aria-label="Inventory filters">{#each ['All','Player','NPC','This slot','Equipment','Accessory','Outfit'] as name}<button aria-pressed={filter===name} onclick={()=>filter=name}>{name}</button>{/each}</div>
  <div class="cards">{#each items.inventory.filter(i=>matchesItem(ITEM_CATALOG[i.defId],filter,slot)) as item (item.id)}
   {@const d=ITEM_CATALOG[item.defId]}
   <ItemCard definition={d} {locked} preview={d.kind===kind?itemPreview(session,characterId,d):[]} onequip={d.kind===kind?()=>run('EQUIP_ITEM',{characterId,itemId:item.id}):undefined} ondestroy={()=>{void confirm(item,{currentTarget:document.activeElement} as unknown as MouseEvent);}} />
  {:else}<p>No items match this view.</p>{/each}</div>
 {:else if view==='Materials'}
  <h5>Materials</h5><table><caption>Material stacks</caption><thead><tr><th scope="col">Material</th><th scope="col">Rarity</th><th scope="col">Count</th></tr></thead><tbody>{#each materialRows(items) as row}<tr><th scope="row">{row.name}</th><td>{row.rarity}</td><td>{row.count}</td></tr>{/each}</tbody></table>
  {#if !Object.keys(items.materials).length}<p>No materials collected yet.</p>{/if}
 {:else}
  <h5>Temporary storage {items.storage.length} / {ITEM_TRIAL.storageCap}</h5><p>Claim items before they expire. Space is shared by all characters.</p>
  <div class="cards">{#each items.storage as entry (entry.item.id)}<div><p>Expires after week {entry.expiresWeek}</p><ItemCard definition={ITEM_CATALOG[entry.item.defId]} {locked} onclaim={()=>run('CLAIM_STORED_ITEM',{itemId:entry.item.id})} /></div>{:else}<p>Temporary storage is empty.</p>{/each}</div>
 {/if}
 <dialog bind:this={dialog} aria-labelledby="destroy-item-heading" oncancel={()=>destroyTarget=null} onclose={()=>{destroyTarget=null;opener?.focus();}}><h4 id="destroy-item-heading">Destroy item?</h4><p>{destroyTarget?ITEM_CATALOG[destroyTarget.defId].name:''} will be lost permanently.</p><button onclick={close}>Cancel</button><button disabled={locked} onclick={()=>{if(destroyTarget)run('DESTROY_ITEM',{itemId:destroyTarget.id});close();}}>Destroy</button></dialog>
</section>
<style>
 .equipment{min-width:0}h4{font-size:1.3rem;margin:8px 0}h5{font-size:1.1rem;margin:12px 0}.loadout{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px}.doll{--focus:var(--ink);position:relative;min-height:330px;background:#d9c499;border:3px double #6b4f2e;padding:12px}.doll svg{position:absolute;width:110px;height:260px;left:50%;top:30px;transform:translateX(-50%);fill:#756248;opacity:.65;pointer-events:none}.slots{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px 75px}.slots button{display:flex;flex-direction:column;text-align:left;min-height:60px;min-width:0;padding:8px;overflow-wrap:anywhere;background:#f5f0e3;color:#3b2a17;border:2px solid #6b4f2e}.slots span{font-size:.9rem}.totals{min-width:0}.totals button{display:block;margin:8px 0;width:100%;overflow-wrap:anywhere}.switches{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}button{min-height:44px}button[aria-pressed='true']{font-weight:700;outline:2px solid #6b4f2e;outline-offset:1px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:14px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:8px;border-bottom:1px solid #6b4f2e}dialog{max-width:min(90vw,420px);background:#ead8ae;color:#3b2a17;border:4px double #6b4f2e;padding:24px}dialog button{margin:8px}dialog::backdrop{background:#21140ccc}@media(max-width:600px){.loadout{grid-template-columns:1fr}.slots{gap:8px 50px}.doll{padding:8px}}
</style>
