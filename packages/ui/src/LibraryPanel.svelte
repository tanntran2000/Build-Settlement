<script lang="ts">
 import {OUTSIDE_TRIAL,type TileTrialState,type ResearchTopic} from '@haven/core';
 export let state:TileTrialState;export let locked:boolean;export let oncommand:(type:string,fields?:Record<string,unknown>)=>boolean;
 export let managementError:{action:string;message:string}|null;
 let topic:ResearchTopic|''='';
 $: topic=state.society!.research.topic??'';
</script>
<section aria-label="Library"><h3>Library</h3><label for="research-topic">Research topic</label><select id="research-topic" bind:value={topic} disabled={locked}><option value="">None</option><option value="deep-mining" disabled={state.society!.research.completed.includes('deep-mining')}>Deep Mining</option></select>
<button disabled={locked} onclick={()=>oncommand('SET_RESEARCH',{topic:topic||null})}>Set research</button>
<p>Progress {state.society!.research.progressMilli['deep-mining']/1000} / {OUTSIDE_TRIAL.research['deep-mining'].workMilli/1000} worker-weeks</p>
<p>Completed topics: {state.society!.research.completed.includes('deep-mining')?'Deep Mining':'None'}</p>
{#if managementError?.action==='SET_RESEARCH'}<p role="alert">{managementError.message}</p>{/if}</section>
<style>section{min-width:0;margin-bottom:16px}label{display:block}p{margin:8px 0}</style>
