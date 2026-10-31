<script lang="ts">
 import { societyPopulation, type TileTrialState, type SocietyGroupKey } from '@haven/core';
 import { CITY_DESIGN } from '@haven/content';
 import { CLASS_LABELS, plannedHousing, workforceSummary, type ClassId } from './society-view.js';
 export let state:TileTrialState;
 $: s=state.society!;
 $: housing=plannedHousing(state);
 $: total=societyPopulation(s);
 $: bound=Object.values(s.classes.bound).reduce((a,b)=>a+b,0);
 $: elites=(['makers','luminaries','merchants'] as const).reduce((n,id)=>n+s.classes[id].elite,0);
</script>
<p>{total} residents · {workforceSummary(state)}</p>
<p>Named NPCs are separate from resident cohorts and these workforce pools.</p>
{#each Object.keys(CLASS_LABELS) as key}
 {@const id=key as ClassId}
 {@const group=CITY_DESIGN.groups.find(g=>g.label===CLASS_LABELS[id])}
 {@const count=id==='free'?s.classes.free:id==='bound'?bound:s.classes[id].common}
 <section class="class-mark" style={`--class-colour:var(--class-${id})`} data-testid={`society-class-${id}`}>
  <h3><span class="class-swatch" aria-hidden="true"></span>{CLASS_LABELS[id]}</h3>
  {#if group}<p>{group.name}</p><p>{group.duties}</p>{/if}
  {#if id==='free'||id==='bound'}<p>Count: {count}</p>{:else}<p>Count: {count} common · {s.classes[id as SocietyGroupKey].elite} Elite</p>{/if}
  <p>Satisfaction: {s.satisfaction[id]} / 100</p>
  <p>Housing (planned): {count} / {housing[id]}</p>
  {#if id!=='free'&&id!=='bound'}<p>Elite housing (planned): {elites} / {housing.elite}</p>{/if}
  {#if id==='bound'}<p>Desperation: {s.desperation} / 100 · Share of residents: {total?Math.round(bound/total*100):0}%</p>{/if}
 </section>
{/each}
<style>section{padding:12px;margin:12px 0;background:var(--bg-secondary);min-width:0}p{margin:8px 0}</style>
