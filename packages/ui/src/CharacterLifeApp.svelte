<script lang="ts">
  import { createCharacterLifeSession, SOCIETY_RULESET, type CharacterLifeSessionState, type PlayerDraft } from '@haven/core';
  import { deserializeCharacterLifeSave, TILE_SAVE_MAX_BYTES } from '@haven/persistence';
  import CharacterCreation from './CharacterCreation.svelte';
  import TileManagement from './TileManagement.svelte';
  import { readLocalCharacterLife, isPlayableCheckpoint, OLD_CHECKPOINT_MESSAGE } from './character-life-session.js';

  let screen: 'start' | 'create' = 'start';
  let session: CharacterLifeSessionState | null = null;
  let error = '';
  // Any later choice invalidates a file read still pending.
  let importRead = 0;

  function newGame() { importRead++; error = ''; screen = 'create'; }
  function create(draft: PlayerDraft) {
    // A repeated Create (or one after Cancel) must not start a second session.
    if (session || screen !== 'create') return;
    try {
      const result = createCharacterLifeSession(crypto.getRandomValues(new Uint32Array(1))[0], draft, SOCIETY_RULESET);
      if (result.success) { session = result.value; return; }
      error = result.error.message;
    } catch { error = 'Could not start a Character Life session. Choose New Game to try again.'; }
    screen = 'start';
  }
  function continueLocally() {
    importRead++;
    const result = readLocalCharacterLife();
    if (result.success) session = result.state; else error = result.message;
  }
  async function importCheckpoint(event: Event) {
    const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; input.value = '';
    if (!file) return;
    const ticket = ++importRead; error = '';
    if (file.size > TILE_SAVE_MAX_BYTES) { error = 'Checkpoint exceeds the 1 MiB limit.'; return; }
    try {
      const text = await file.text();
      if (ticket !== importRead || session) return;
      const result = deserializeCharacterLifeSave(text);
      if (result.success && isPlayableCheckpoint(result.state)) session = result.state; else error = OLD_CHECKPOINT_MESSAGE;
    } catch { if (ticket === importRead) error = 'Could not read the checkpoint file.'; }
  }
</script>

{#if session}
  <TileManagement lifeMode initialLife={session} />
{:else}
  <main lang="en">
    <header class="card">
      <p class="eyebrow">HAVEN · CHARACTER LIFE</p>
      <h1>Character Life</h1>
      <p>Character profiles are TRIAL content. Weekly life events and Player interactions are not available yet.</p>
    </header>
    {#if screen === 'create'}
      <CharacterCreation oncreate={create} oncancel={() => { screen = 'start'; }} />
    {:else}
      <section class="card" aria-label="Start">
        <p>Create an adult Player who leads Haven, or resume a Character Life checkpoint.</p>
        <button onclick={newGame}>New Game</button>
        <button onclick={() => continueLocally()}>Continue locally</button>
        <label for="life-save-file">Import checkpoint</label>
        <input id="life-save-file" type="file" accept=".json,application/json" onchange={importCheckpoint} />
        {#if error}<p role="alert">{error}</p>{/if}
      </section>
    {/if}
  </main>
{/if}

<style>
  main { max-width: 1180px; margin: auto; padding: 24px; }
  .card { margin-bottom: 16px; } h1 { font-size: 1.9rem; } p { margin: 12px 0; line-height: 1.55; } a { color: var(--accent-green); }
  .eyebrow { color: var(--text-muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; }
  label { display: block; margin: 16px 0 8px; } input, button { font: inherit; border-radius: 6px; padding: 10px; border: 1px solid var(--border-color); }
  input { color: var(--text-main); background: var(--bg-tertiary); max-width: 100%; }
  button { background: var(--accent-green); color: #000; cursor: pointer; margin: 4px 4px 4px 0; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; } [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
  @media(max-width: 750px) { main { padding: 12px; } }
</style>
