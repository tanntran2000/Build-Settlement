<script lang="ts">
 import './ledger-theme.css';
 import { END_SCREEN_COPY } from './society-view.js';
 export let fallCause:'rebellion'|'assassination';
 export let weeks:number;
 export let onnewgame:()=>void;
</script>
<main class="ledger-shell fallen-desk" lang="en"><section class="card ledger-parchment fallen-letter" data-fallen-letter><span class="ledger-seal fallen-seal" data-fallen-seal aria-hidden="true"></span><h1>{END_SCREEN_COPY[fallCause].title}</h1><p>{END_SCREEN_COPY[fallCause].text} You ruled for {weeks} weeks.</p><button class="ledger-wax" onclick={onnewgame}>New Game</button></section></main>
<style>
 main { min-height:100dvh; display:grid; place-items:center; padding:24px; }
 .fallen-letter { width:min(100%,42rem); min-width:0; padding:24px; overflow-wrap:anywhere; }
 .fallen-seal { display:block; width:calc(12 * var(--px)); height:calc(12 * var(--px)); margin-bottom:16px; }
 h1 { font-size:28px; } p { margin:16px 0; font-size:16px; }
 button { font:inherit; padding:10px; min-height:44px; min-width:44px; max-width:100%; cursor:pointer; }
</style>
