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
   <svg role="img" aria-label="NPC silhouette" viewBox="0 0 100 200"><g stroke="#d9c499" stroke-width="2" stroke-linejoin="round">
    <path d="M28 128C26 150 33 168 35 193L46 193L48 140Z"/>
    <path d="M72 128C74 150 67 168 65 193L54 193L52 140Z"/>
    <path d="M29 152L47 155M71 152L53 155" fill="none"/>
    <path d="M40 98L60 98C67 106 67 116 60 124L40 124C33 116 33 106 40 98Z"/>
    <circle cx="35" cy="124" r="17"/><circle cx="65" cy="124" r="17"/>
    <path d="M36 44C44 40 56 40 64 44C70 48 70 56 66 64L60 100L40 100L34 64C30 56 30 48 36 44Z"/>
    <circle cx="38.5" cy="71" r="14.5"/><circle cx="61.5" cy="71" r="14.5"/>
    <path d="M64 44C72 46 78 52 82 62L89 80L70 103L64 97L80 80L74 65Z"/>
    <path d="M36 44C28 46 22 52 18 62L11 80L30 103L36 97L20 80L26 65Z"/>
    <path d="M58 14C66 6 75 10 73 20C71 29 64 34 60 30C64 26 66 20 62 16Z" stroke="none"/>
    <rect x="46" y="33" width="8" height="10" stroke="none"/>
    <circle cx="50" cy="24" r="12"/></g></svg>
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
