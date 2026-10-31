<script lang="ts">
 import type { TileTrialReport } from '@haven/core';
 import type { SocietyNote } from '@haven/simulation';
 import { CLASS_LABELS,noteSentence,type ClassId } from './society-view.js';
 export let report:Readonly<TileTrialReport>;
 $: society=report.society!;
</script>
<section aria-label="Society this week">
 <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard scrolling for the class table.) -->
 <div class="table-scroll" role="region" aria-label="Classes this week scroll area" tabindex="0">
 <table><caption>Classes this week</caption><thead><tr>{#each ['Class','Food','Goods','Luxury','Satisfaction','Arrivals','Trained','Enslaved'] as heading}<th scope="col">{heading}</th>{/each}</tr></thead>
 <tbody>{#each Object.keys(CLASS_LABELS) as key}{@const id=key as ClassId}{@const row=society.classes[id]}
 <tr data-testid={`society-report-${id}`}><th scope="row">{CLASS_LABELS[id]}</th><td>{row.foodBps/100}%</td><td>{row.goodsBps/100}%</td><td>{row.luxuryBps===null?'?':`${row.luxuryBps/100}%`}</td><td>{row.satisfactionBefore} ? {row.satisfactionAfter}</td><td>{row.arrivals}</td><td>{row.trained}</td><td>{row.enslaved}</td></tr>
 {/each}</tbody></table></div>
 <ul data-testid="society-why">{#each Object.keys(CLASS_LABELS) as key}{@const id=key as ClassId}{#each society.classes[id].notes as note}<li>{noteSentence(id,note as SocietyNote,society.classes[id].enslaved)}</li>{/each}{/each}</ul>
 {#if society.eliteArrived}<p>Elite arrival: one {CLASS_LABELS[society.eliteArrived]} Elite arrived.</p>{/if}
 <p>Bound Desperation: {society.desperationBefore} ? {society.desperationAfter}</p>
 <p>Luxury imported: {(report.luxuryImportedMilli??0)/1000}. Training cost: {(report.trainingGoldMilli??0)/1000} Gold.</p>
</section>
<style>section{min-width:0}.table-scroll{overflow-x:auto;max-width:100%;padding:6px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid var(--border-color);text-align:right;white-space:nowrap}th:first-child{text-align:left}caption{text-align:left;font-weight:bold}ul{padding-left:24px}p{margin:8px 0}</style>
