<script lang="ts">
  import { tick } from 'svelte';
  import ErrorLog from './ErrorLog.svelte';
  import { options } from './options.js';
  import { platform } from './platform.js';
  import { APP_VERSION, BUILD_SHA, RELEASE_STAGE, versionLabel } from './version.js';
  export let open: boolean;
  export let onclose: () => void;
  let dialog: HTMLDialogElement;
  let fullscreen = false;
  let refusal = '';
  $: if (open && dialog && !dialog.open) { fullscreen = platform.isFullscreen(); refusal = ''; void tick().then(() => dialog.showModal()); }
  $: if (!open && dialog?.open) dialog.close();
  async function toggleFullscreen(event: Event) {
    const control = event.currentTarget as HTMLInputElement;
    const requested = control.checked;
    const accepted = await platform.setFullscreen(requested);
    fullscreen = platform.isFullscreen(); control.checked = fullscreen; refusal = accepted ? '' : 'Fullscreen is not available here.';
  }
</script>
<svelte:document onfullscreenchange={() => { fullscreen = platform.isFullscreen(); }} />
<dialog bind:this={dialog} onclose={onclose} aria-label="Options">
  <h2>Options</h2>
  <fieldset><legend>Text size</legend>
    <label><input type="radio" name="text-size" value="normal" bind:group={$options.textSize}> Normal</label>
    <label><input type="radio" name="text-size" value="large" bind:group={$options.textSize}> Large</label>
  </fieldset>
  <label><input type="checkbox" checked={$options.reduceMotion ?? (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)} onchange={event => options.update(o => ({ ...o, reduceMotion: event.currentTarget.checked }))}> Reduce motion</label>
  <label><input type="checkbox" checked={fullscreen} onchange={toggleFullscreen}> Fullscreen</label>
  {#if refusal}<p role="status">{refusal}</p>{/if}
  <label><input type="checkbox" bind:checked={$options.autosave}> Autosave</label>
  <section aria-label="About"><h2>About</h2><p>{versionLabel(APP_VERSION, RELEASE_STAGE)}</p><p>Build {BUILD_SHA}</p><p>Pixelify Sans — SIL Open Font License 1.1</p><ErrorLog /></section>
  <button onclick={() => dialog.close()}>Close</button>
</dialog>
<style>
  dialog { box-sizing: border-box; width: min(600px, calc(100% - 24px)); max-height: calc(100dvh - 24px); overflow: auto; background: var(--parchment); color: var(--ink); font: inherit; border: 4px solid var(--ink-muted); }
  label { display: flex; align-items: center; min-height: 44px; gap: 10px; }
  button { min-height: 44px; font: inherit; }
  fieldset { min-width: 0; } p { overflow-wrap: anywhere; }
</style>
