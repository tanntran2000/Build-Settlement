<script lang="ts">
  import { ITEM_TRIAL, type ItemDefinition } from '@haven/core';
  import { itemPresentation, itemTitle } from './items-view.js';
  import { formatMilli } from './milli-format.js';
  export let definition:ItemDefinition;
  export let preview:{skill:string;before:number;after:number}[]=[];
  export let locked=false;
  export let onequip:(()=>void)|undefined=undefined;
  export let ondestroy:(()=>void)|undefined=undefined;
  export let onclaim:(()=>void)|undefined=undefined;
  export let onsell:(()=>void)|undefined=undefined;
  export let onbuy:(()=>void)|undefined=undefined;
  export let priceMilli:number|undefined=undefined;
  $: look=itemPresentation(definition);
</script>
<article aria-label={definition.name} data-rarity={definition.rarity} class="item-card">
  <header><span class="rarity">{look.rarity} · {itemTitle(definition.category)}</span><h5 style:color={look.colour}>{definition.name}</h5></header>
  {#if definition.kind}<p>{itemTitle(definition.kind)} · {itemTitle(definition.slot??'')}</p>{/if}
  {#if look.exclusive}<p>{look.exclusive}</p>{/if}
  {#if definition.mainStat}<p>{itemTitle(definition.mainStat)} +{ITEM_TRIAL.bonuses[definition.rarity].main*(definition.slot==='set'?ITEM_TRIAL.setMultiplier:1)}{#if definition.secondaryStat} · {itemTitle(definition.secondaryStat)} +{ITEM_TRIAL.bonuses[definition.rarity].secondary*(definition.slot==='set'?ITEM_TRIAL.setMultiplier:1)}{/if}</p>{/if}
  {#if definition.regen}<p>Regen +{definition.regen*(definition.slot==='set'?ITEM_TRIAL.setMultiplier:1)}/week</p>{/if}
  {#if definition.slot==='set'}<p>Covers Top, Bottom and Shoes.</p>{/if}
  {#if definition.trait}<p>While worn: {({warden:`Watch House Security +${ITEM_TRIAL.effects.wardenSecurity}`,crown:`Authority +${ITEM_TRIAL.effects.crownAuthority}`,ironhide:`Wound damage −${ITEM_TRIAL.effects.ironhideWoundReduction}`,ledger:`Post output +${ITEM_TRIAL.effects.ledgerOutputPercent}%`} as Record<string,string>)[definition.trait]??itemTitle(definition.trait)}.</p>{/if}
  {#if preview.length}<p>Before → After</p><dl>{#each preview as row}<div><dt>{itemTitle(row.skill)}</dt><dd>{row.before} → {row.after}</dd></div>{/each}</dl>{/if}
  {#if priceMilli!==undefined}<p>{formatMilli(priceMilli)} Gold</p>{/if}
  <div class="actions">
    {#if onequip}<button disabled={locked} onclick={onequip}>Equip</button>{/if}
    {#if onclaim}<button disabled={locked} onclick={onclaim}>Claim</button>{/if}
    {#if onbuy}<button disabled={locked} onclick={onbuy}>Buy</button>{/if}
    {#if onsell}<button disabled={locked} onclick={onsell}>Sell</button>{/if}
    {#if ondestroy}<button disabled={locked} onclick={ondestroy}>Destroy</button>{/if}
  </div>
</article>
<style>
 .item-card{min-width:0;padding:16px;background:#21140c;color:#f5ead4;border:3px solid #b78149;box-shadow:inset 0 0 0 2px #120a03;overflow-wrap:anywhere}
 .item-card[data-rarity='rare']{border-color:#b7c9cf}.item-card[data-rarity='epic']{border-color:#b58cdd}.item-card[data-rarity='legendary']{border-color:#ff9c70;box-shadow:0 0 9px #a44625,inset 0 0 0 2px #120a03}
 h5{font-size:1.15rem;margin:6px 0}.rarity{font-size:.9rem}p{margin:6px 0}dl{margin:8px 0}dl>div{display:flex;justify-content:space-between;gap:12px}dd{margin:0}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.item-card .actions button,.item-card .actions button:hover{min-height:44px;padding:8px 12px;background:#ead8ae;color:#3b2a17;border:2px solid #b78149}
</style>
