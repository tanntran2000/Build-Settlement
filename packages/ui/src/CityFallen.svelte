<script lang="ts">
 import { END_SCREEN_COPY } from './society-view.js';
 export let fallCause:'rebellion'|'assassination';
 export let weeks:number;
 export let onnewgame:()=>void;
</script>
<main lang="en"><section class="card"><h1>{END_SCREEN_COPY[fallCause].title}</h1><p>{END_SCREEN_COPY[fallCause].text} You ruled for {weeks} weeks.</p><button onclick={onnewgame}>New Game</button></section></main>
<style>main{max-width:1180px;margin:auto;padding:24px}p{margin:16px 0}button{font:inherit;padding:10px;min-height:44px;cursor:pointer}</style>
