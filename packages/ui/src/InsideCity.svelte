<script lang="ts">
 import MarketPanel from './MarketPanel.svelte';
 import AcquisitionPanel from './AcquisitionPanel.svelte';
 import PotionPanel from './PotionPanel.svelte';
 import WorkshopPanel from './WorkshopPanel.svelte';
 import { TRIAL_BUILDINGS, isAcquisitionSource, societyStaff, type TileTrialState, type SocietyGroupKey, type WorldNpc } from '@haven/core';
 import { insideTiers, wallStatus, TOWN_PLOT_COUNT, buildingColour, effectLine, CLASS_LABELS } from './society-view.js';
 export let state:TileTrialState;
 export let purseMoneyMilli:number;
 export let npcs:WorldNpc[]=[];
 export let selectedId:string;
 export let uiEpoch:number;
 export let locked:boolean;
 export let managementError:{action:string;message:string}|null;
 export let onselect:(id:string)=>void;
 export let oncommand:(type:string,fields?:Record<string,unknown>)=>boolean;
 let target:SocietyGroupKey|''='';
 $: target=state.society!.training.target??'';
 $: wall=wallStatus(state);
 $: selectedBuilding=state.tiles.find(tile=>tile.id===selectedId)?.building;
 $: source=selectedBuilding?.enabled && isAcquisitionSource(selectedBuilding.typeId) ? selectedBuilding.typeId : null;
</script>
<section aria-label="Inside City">
 <h3>Inside City</h3>
 <p>Wall: Ring {wall.ring} of 4 · {wall.openPlots} / {TOWN_PLOT_COUNT} plots open</p>
 {#if wall.next}
  <button disabled={locked} aria-describedby={locked?'trial-wall-report-lock':'trial-wall-prerequisite'} onclick={()=>oncommand('EXTEND_WALL')}>Extend wall to Ring {wall.next.ring}</button>
  <p id="trial-wall-prerequisite">{wall.next.text}</p>
  {#if locked}<p id="trial-wall-report-lock">Plan next week to extend the wall.</p>{/if}
 {:else}<p>All wall rings are open.</p>{/if}
 {#if managementError?.action==='EXTEND_WALL'}<p role="alert">{managementError.message}</p>{/if}
 <label for="training-target">Training target</label>
 <select id="training-target" bind:value={target} disabled={locked}><option value="">None</option>{#each ['makers','luminaries','merchants'] as id}<option value={id}>{CLASS_LABELS[id as SocietyGroupKey]}</option>{/each}</select>
 <button disabled={locked} onclick={()=>oncommand('SET_TRAINING',{target:target||null})}>Set training</button>
 <p>Current target: {state.society!.training.target?CLASS_LABELS[state.society!.training.target]:'None'}. Each operating Academy level trains up to 2 Free residents per week for 1 Gold each, while the target has housing room.</p>
 {#if managementError?.action==='SET_TRAINING'}<p role="alert">{managementError.message}</p>{/if}
 {#each insideTiers(state) as tier}
  <section aria-label={tier.label}><h4>{tier.label}</h4><div class="plots">
  {#each tier.plots as plot}
   {@const b=state.tiles.find(t=>t.id===plot.tileId)?.building}
   {#if plot.locked}<div class="card" data-inside-plot={plot.tileId}><strong>{plot.tileId}</strong><p>Locked · opens with Ring {plot.ring}</p></div>
   {:else}
    <button class="class-mark" class:selected={selectedId===plot.tileId} style={`--class-colour:var(--class-${b?buildingColour(b.typeId):'none'})`} data-testid={`trial-tile-${plot.tileId}`} aria-label={`Select ${plot.tileId}`} aria-pressed={selectedId===plot.tileId} aria-describedby={b?`trial-building-name-${plot.tileId}`:undefined} onclick={()=>onselect(plot.tileId)}>
     <strong>{plot.tileId}</strong>
     {#if b}
      {@const staff=societyStaff(b.typeId)}
      <span id={`trial-building-name-${plot.tileId}`}><span class="class-swatch" aria-hidden="true"></span>{TRIAL_BUILDINGS[b.typeId].name}</span>
      <span>Level {b.level} · {b.workers} WF · {staff==='basic'?'Basic':staff?CLASS_LABELS[staff]:'No staff'}</span>
      <span>{b.enabled?'Enabled':'Paused'}</span><span>{effectLine(b.typeId,b.level)}</span>
     {:else}<span>Empty</span>{/if}
    </button>
   {/if}
  {/each}</div></section>
 {/each}
 {#if state.tiles.find(t=>t.id===selectedId)?.building?.typeId==='town-market'&&state.tiles.find(t=>t.id===selectedId)?.building?.enabled}
  <MarketPanel {state} {locked} {managementError} {oncommand} />
 {/if}
 {#if state.tiles.find(t=>t.id===selectedId)?.building?.typeId==='smithy'}<WorkshopPanel {state} {npcs} {purseMoneyMilli} tileId={selectedId} {locked} {managementError} {oncommand} />{/if}
 {#if source}
  {#key `${selectedId}:${uiEpoch}`}
   <AcquisitionPanel {state} {npcs} {source} tileId={selectedId} {locked} {managementError} {oncommand} />
  {/key}
 {/if}
 <PotionPanel {state} {npcs} {purseMoneyMilli} tileId={selectedId} {locked} {managementError} {oncommand} />
</section>
<style>
 section{min-width:0;margin-bottom:16px}p{margin:8px 0}.plots{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:12px;margin:12px 0}.plots button{display:flex;flex-direction:column;align-items:flex-start;gap:8px;text-align:left;padding:12px;background:var(--bg-secondary)}.selected{outline:2px solid var(--accent-green)}.plots>*{min-width:0;overflow-wrap:anywhere}label{display:block;margin-top:12px}
</style>
