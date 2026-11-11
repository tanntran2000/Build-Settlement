<script lang="ts">
  import { onMount } from 'svelte';
  import { createCharacterLifeSession, type CharacterLifeSessionState, type PlayerDraft } from '@haven/core';
  import { deserializeCharacterLifeSave, TILE_SAVE_MAX_BYTES } from '@haven/persistence';
  import CharacterCreation from './CharacterCreation.svelte';
  import TitleScreen from './TitleScreen.svelte';
  import TileManagement from './TileManagement.svelte';
  import { readLocalCharacterLife, isPlayableCheckpoint, OLD_CHECKPOINT_MESSAGE } from './character-life-session.js';

  let screen: 'start' | 'create' = 'start';
  let session: CharacterLifeSessionState | null = null;
  let cachedCheckpoint: CharacterLifeSessionState | null = null;
  let checkpoint: 'playable' | 'none' | 'old' = 'none';
  let error = '';
  // Any later choice invalidates a file read still pending.
  let importRead = 0;

  onMount(() => {
    const result = readLocalCharacterLife();
    if (result.success && isPlayableCheckpoint(result.state)) {
      cachedCheckpoint = result.state; checkpoint = 'playable';
    } else checkpoint = result.success || result.message.includes(OLD_CHECKPOINT_MESSAGE) ? 'old' : 'none';
  });
  function newGame() { importRead++; error = ''; screen = 'create'; }
  function create(draft: PlayerDraft) {
    // A repeated Create (or one after Cancel) must not start a second session.
    if (session || screen !== 'create') return;
    try {
      const result = createCharacterLifeSession(crypto.getRandomValues(new Uint32Array(1))[0], draft);
      if (result.success) { session = result.value; return; }
      error = result.error.message;
    } catch { error = 'Could not start a Character Life session. Choose New Game to try again.'; }
    screen = 'start';
  }
  function continueLocally() {
    if (session || screen !== 'start' || !cachedCheckpoint) return;
    importRead++;
    session = cachedCheckpoint;
  }
  async function importCheckpoint(file: File) {
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
  <TileManagement lifeMode initialLife={session} onnewgame={() => { session = null; newGame(); }} />
{:else if screen === 'create'}
  <main lang="en">
    <header class="card"><h1>Character Life</h1></header>
    <CharacterCreation oncreate={create} oncancel={() => { screen = 'start'; }} />
  </main>
{:else}
  <TitleScreen {checkpoint} {error} oncontinue={continueLocally} onnewgame={newGame} onload={importCheckpoint} />
{/if}

<style>
  main { max-width: 1180px; margin: auto; padding: 24px; }
  .card { margin-bottom: 16px; } h1 { font-size: 1.9rem; }
  @media(max-width: 750px) { main { padding: 12px; } }
</style>
