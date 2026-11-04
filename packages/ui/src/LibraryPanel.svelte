<script lang="ts">
 import {OUTSIDE_TRIAL,RESEARCH_TOPICS,type TileTrialState,type ResearchTopic} from '@haven/core';
 import {RESEARCH_LABELS} from './society-view.js';
 export let state:TileTrialState;export let locked:boolean;export let oncommand:(type:string,fields?:Record<string,unknown>)=>boolean;
 export let managementError:{action:string;message:string}|null;
 let topic:ResearchTopic|''='';
 $: topic=state.society!.research.topic??'';
</script>
<section aria-label="Library"><h3>Library</h3><label for="research-topic">Research topic</label><select id="research-topic" bind:value={topic} disabled={locked}><option value="">None</option>{#each RESEARCH_TOPICS as id}<option value={id} disabled={state.society!.research.completed.includes(id)}>{RESEARCH_LABELS[id]}</option>{/each}</select>
<button disabled={locked} onclick={()=>oncommand('SET_RESEARCH',{topic:topic||null})}>Set research</button>
{#if topic}<p>Progress {state.society!.research.progressMilli[topic]/1000} / {OUTSIDE_TRIAL.research[topic].workMilli/1000} worker-weeks</p>{/if}
<p>Completed topics: {state.society!.research.completed.map(id=>RESEARCH_LABELS[id]).join(', ')||'None'}</p>
{#if managementError?.action==='SET_RESEARCH'}<p role="alert">{managementError.message}</p>{/if}</section>
<style>section{min-width:0;margin-bottom:16px}label{display:block}p{margin:8px 0}</style>
