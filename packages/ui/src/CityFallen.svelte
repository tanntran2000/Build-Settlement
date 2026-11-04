<script lang="ts">
 export let weeks:number;
 export let onnewgame:()=>void;
</script>
<main lang="en"><section class="card"><h1>The City Has Fallen</h1><p>Hunger turned Haven against you. You ruled for {weeks} weeks.</p><button onclick={onnewgame}>New Game</button></section></main>
<style>main{max-width:1180px;margin:auto;padding:24px}p{margin:16px 0}button{font:inherit;padding:10px;min-height:44px;cursor:pointer}</style>
