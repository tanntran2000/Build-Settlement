<script lang="ts">
 import { LAW_IDS, LAW_CATALOG, previewLawVote, lawVoteWeights, type LawId, type LobbyOption, type SocietyClassKey, type TileTrialState } from '@haven/core';
 import { GROUP_LABELS, lawEffectLine } from './society-view.js';
 import { formatMilli } from './milli-format.js';
 export let state:TileTrialState;
 export let locked:boolean;
 export let oncommand:(type:string,fields?:Record<string,unknown>)=>boolean;
 export let managementError:{action:string;message:string}|null;
 let selected:LawId='poor-relief';
 let lobby:Partial<Record<SocietyClassKey,LobbyOption>>={};
 $: preview=previewLawVote(state,selected,lobby);
 $: weights=lawVoteWeights(state.society!);
 const groups=Object.keys(GROUP_LABELS) as SocietyClassKey[];
 function choose(id:LawId){selected=id;lobby={};}
 function change(group:SocietyClassKey,value:string){const next={...lobby};if(value)next[group]=value as LobbyOption;else delete next[group];lobby=next;}
</script>
<section aria-label="Council">
 <h3>Council</h3>
 {#each LAW_IDS as id}
 <article>
  <button data-testid={`council-law-${id}`} aria-pressed={selected===id} disabled={locked} onclick={()=>choose(id)}>{LAW_CATALOG[id].name}</button>
  {#if LAW_CATALOG[id].tag}<span>{LAW_CATALOG[id].tag==='light'?'Light':'Dark'}</span>{/if}
  <p>{lawEffectLine(id)}</p>
  <div class="stances">{#each groups as group}<span style={`color: var(--class-${group})`}>{GROUP_LABELS[group]}: {LAW_CATALOG[id].stances[group]==='for'?'For':LAW_CATALOG[id].stances[group]==='against'?'Against':'Neutral'}</span>{/each}</div>
  {#if state.society!.laws.active.includes(id)}<p>In force</p><p>Authority −5; cannot return for 4 weeks.</p><button data-testid={`council-repeal-${id}`} disabled={locked} onclick={()=>oncommand('REPEAL_LAW',{lawId:id})}>Repeal {LAW_CATALOG[id].name}</button>{/if}
  {#if (state.society!.laws.repealedUntil[id]??0)>state.world.week}<p>Returns in week {state.society!.laws.repealedUntil[id]}.</p>{/if}
 </article>
 {/each}
 <h4>{LAW_CATALOG[selected].name}</h4>
 {#each groups as group}{#if weights[group]>0 && LAW_CATALOG[selected].stances[group]!=='for'}
 <label>{GROUP_LABELS[group]} <select data-testid={`council-lobby-${group}`} value={lobby[group]??''} disabled={locked} onchange={event=>change(group,event.currentTarget.value)}><option value="">No lobbying</option><option value="pay">Pay</option><option value="promise">Promise</option><option value="force">Force</option></select></label>
 {/if}{/each}
 <p data-testid="council-tally">For {preview.forWeight} · Against {preview.againstWeight}</p>
 <p>Total Gold cost: {formatMilli(preview.goldMilli)} Gold.</p>
 <button data-testid="council-call-vote" disabled={locked || !!preview.refusal} aria-describedby={preview.refusal?'council-refusal':undefined} onclick={()=>oncommand('ENACT_LAW',{lawId:selected,lobby})}>Call the vote</button>
 {#if preview.refusal}<p id="council-refusal">{preview.refusal.message}</p>{/if}
 {#if managementError && ['ENACT_LAW','REPEAL_LAW'].includes(managementError.action)}<p role="alert">{managementError.message}</p>{/if}
</section>
<style>
 section,article {min-width:0;overflow-wrap:anywhere;} article {border-bottom:1px solid var(--border-color);padding:8px 0;} p {margin:8px 0;} .stances {display:flex;flex-wrap:wrap;gap:8px;} label {display:block;margin:8px 0;} button,select {font:inherit;max-width:100%;white-space:normal;min-height:44px;padding:8px;background:var(--bg-tertiary);color:var(--text-main);border:1px solid var(--life-control-border);border-radius:6px;} button {cursor:pointer;} button:disabled {opacity:.5;cursor:default;} :focus-visible {outline:3px solid var(--accent-blue);outline-offset:3px;}
</style>
