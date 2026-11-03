<script lang="ts">
 import {TRIAL_BUILDINGS,type TileTrialState,type WorldNpc} from '@haven/core';
 import {clearOutsideWorkers} from './clearing-workers.js';
 import {outsideRings,buildingColour} from './society-view.js';
 export let state:TileTrialState;export let npcs:WorldNpc[];export let selectedId:string;export let locked:boolean;
 export let onselect:(id:string)=>void;export let oncommand:(type:string,fields?:Record<string,unknown>)=>boolean;
 export let managementError:{action:string;message:string}|null;
 let drafts:Record<string,string>={};
 let clearingErrors:Record<string,string>={};
 function clear(tileId:string):void {
  clearingErrors={...clearingErrors,[tileId]:clearOutsideWorkers(drafts[tileId]??String(state.society!.outside[tileId].clearWorkers),tileId,oncommand)};
 }
</script>
<section aria-label="Outside tiles"><h3>Outside tiles</h3>
 {#each outsideRings(state) as ring}
 <section aria-label={`Outside Ring ${ring.ring}`}><h4>Ring {ring.ring}</h4><div class="tiles">
 {#each ring.plots as plot}
 {@const b=state.tiles.find(t=>t.id===plot.tileId)!.building}
 <div class="plot" data-outside-plot={plot.tileId}>
 {#if ring.locked}<strong>{plot.tileId}</strong><p>{plot.terrain}</p><p>Locked · opens with Ring {ring.ring}</p>
 {:else}
 <button class:selected={selectedId===plot.tileId} class="class-mark" style={`--class-colour:var(--class-${b?buildingColour(b.typeId):'none'})`} data-testid={`trial-tile-${plot.tileId}`} aria-label={`Select ${plot.tileId}`} aria-pressed={selectedId===plot.tileId} onclick={()=>onselect(plot.tileId)}>
 <span class="terrain">{plot.terrain}</span><strong>{plot.tileId}</strong>
 {#if b}<span class="building-name">{TRIAL_BUILDINGS[b.typeId].name}</span><span>Level {b.level} · {b.workers} WF · {b.enabled?'Enabled':'Paused'}</span>{:else}<span>Empty</span>{/if}
 <span>{b?npcs.find(n=>n.postTileId===plot.tileId)?.character.name??'Unassigned':'No manager post'}</span>
 </button>
 {#if plot.clear}<p>Clearing {plot.clear.progress} / {plot.clear.work}</p><label for={`clear-${plot.tileId}`}>Clearing workers (WF)</label><input id={`clear-${plot.tileId}`} type="number" min="0" step="1" value={drafts[plot.tileId]??String(state.society!.outside[plot.tileId].clearWorkers)} disabled={locked} aria-invalid={clearingErrors[plot.tileId]?'true':undefined} aria-describedby={clearingErrors[plot.tileId]?`clear-error-${plot.tileId}`:undefined} oninput={e=>{drafts={...drafts,[plot.tileId]:e.currentTarget.value};clearingErrors={...clearingErrors,[plot.tileId]:''};}} /><button disabled={locked} onclick={()=>clear(plot.tileId)}>Clear</button>{#if clearingErrors[plot.tileId]}<p id={`clear-error-${plot.tileId}`} role="alert">{clearingErrors[plot.tileId]}</p>{/if}{/if}
 {#if plot.deposit}<p>{plot.deposit.good} {plot.deposit.remaining} / {plot.deposit.cap}</p>{/if}
 {#if plot.deepShaftAllowed}<button disabled={locked} onclick={()=>oncommand('BUILD_DEEP_SHAFT',{tileId:plot.tileId})}>Build Deep Shaft</button>{/if}
 {/if}
 </div>
 {/each}</div></section>
 {/each}
 {#if managementError&&['CLEAR','BUILD_DEEP_SHAFT'].includes(managementError.action)}<p role="alert">{managementError.message}</p>{/if}
</section>
<style>
 section,.plot{min-width:0;overflow-wrap:anywhere}.terrain{color:var(--text-muted);font-size:max(14px,calc(var(--life-body-size) - 1px));text-transform:uppercase}.building-name{font-size:var(--life-card-heading);font-weight:600}.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.plot{background:var(--bg-secondary);padding:12px;border-radius:12px}button.class-mark{display:flex;flex-direction:column;gap:10px;align-items:flex-start;text-align:left;width:100%;min-height:180px;padding:12px}.selected{outline:2px solid var(--accent-green);font-weight:600}input{width:6rem}label{display:block}p{margin:8px 0}h4{margin:12px 0}
</style>
