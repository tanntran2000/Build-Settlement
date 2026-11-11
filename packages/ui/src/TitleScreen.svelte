<script lang="ts">
  import { onMount, tick } from 'svelte';
  import OptionsDialog from './OptionsDialog.svelte';
  import { OLD_CHECKPOINT_MESSAGE } from './character-life-session.js';
  import { platform, setQuitHandler } from './platform.js';
  import { APP_VERSION, RELEASE_STAGE, versionLabel } from './version.js';
  export let checkpoint: 'playable' | 'none' | 'old';
  export let error: string;
  export let oncontinue: () => void;
  export let onnewgame: () => void;
  export let onload: (file: File) => void;
  let menu: HTMLElement;
  let input: HTMLInputElement;
  let open = false;
  let active = checkpoint === 'playable' ? 0 : 1;
  let quit = false;
  let art = true;
  let scale = 1;
  const resize = () => { scale = Math.max(1, Math.ceil(innerWidth / 960), Math.ceil(innerHeight / 540)); };
  async function focusMenu() { await tick(); menu?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus(); }
  onMount(() => { resize(); setQuitHandler(() => { quit = true; }); void focusMenu(); return () => setQuitHandler(() => {}); });
  function keyboard(event: KeyboardEvent) {
    if (!menu?.contains(event.target as Node)) return;
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const buttons = [...menu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length]?.focus();
  }
</script>
<svelte:window onresize={resize} onkeydown={keyboard} />
<main class="ledger-shell title-screen" lang="en">
  {#if quit}
    <section class="ledger-parchment"><p>You can close this tab now.</p><button onclick={() => { quit = false; void focusMenu(); }}>Back to title</button></section>
  {:else}
    {#if art}<img src="./title-art.webp" alt="" decoding="async" style:width={`${960 * scale}px`} style:height={`${540 * scale}px`} onerror={() => art = false}>{/if}
    <div class="title-content"><h1>HAVEN</h1><p>Sovereign Frontier</p>
      <section aria-label="Start" class="ledger-board" bind:this={menu}>
        <button class="ledger-plaque" tabindex={active === 0 ? 0 : -1} onfocus={() => active = 0} disabled={checkpoint !== 'playable'} onclick={oncontinue}>Continue</button>
        {#if checkpoint !== 'playable'}<p>{checkpoint === 'old' ? OLD_CHECKPOINT_MESSAGE : 'No local checkpoint'}</p>{/if}
        <button class="ledger-plaque" tabindex={active === 1 ? 0 : -1} onfocus={() => active = 1} onclick={onnewgame}>New Game</button>
        <button class="ledger-plaque" tabindex={active === 2 ? 0 : -1} onfocus={() => active = 2} onclick={() => input.click()}>Load checkpoint</button>
        <button class="ledger-plaque" tabindex={active === 3 ? 0 : -1} onfocus={() => active = 3} onclick={() => open = true}>Options</button>
        <button class="ledger-plaque" tabindex={active === 4 ? 0 : -1} onfocus={() => active = 4} onclick={() => platform.quit()}>Quit</button>
        <input hidden bind:this={input} id="life-save-file" aria-label="Import checkpoint" type="file" accept=".json,application/json" onchange={() => { const file = input.files?.[0]; input.value = ''; if (file) onload(file); }}>
        {#if error}<p role="alert">{error}</p>{/if}
      </section>
    </div>
    <p class="version">{versionLabel(APP_VERSION, RELEASE_STAGE)}</p>
    <OptionsDialog {open} onclose={() => open = false} />
  {/if}
</main>
<style>
  .title-screen { box-sizing: border-box; position: relative; isolation: isolate; min-height: 100dvh; display: flex; flex-direction: column; padding: 32px; background: var(--wood-dark); color: var(--wax-text); overflow: clip; }
  img { position: absolute; z-index: -1; left: 50%; top: 50%; transform: translate(-50%, -50%); image-rendering: pixelated; animation: fade .5s; }
  .title-content { width: min(100%, 360px); } h1 { font-size: 3em; margin: 0; } .ledger-board { padding: 16px; }
  button { display: block; width: 100%; min-height: 44px; font: inherit; margin-block: 8px; }
  p { overflow-wrap: anywhere; } .version { position: relative; text-align: right; margin-top: auto; padding-top: 32px; margin-bottom: 0; background: var(--wood-dark); }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  @media (max-width: 767px) { .title-screen { padding: 12px; } .title-content { width: 100%; } }
</style>
