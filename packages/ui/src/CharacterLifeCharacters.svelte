<script lang="ts">
  import EquipmentView from './EquipmentView.svelte';
  import { tick } from 'svelte';
  import { departureReason } from './acquisition-view.js';
  import { homeBeds, managerSlotTileIds, npcAge, PLAYER_CHARACTER_ID, TRIAL_BUILDINGS, type CharacterLifeSessionState, type CharacterView } from '@haven/core';
  import { executeCharacterLifeCommand } from '@haven/simulation';
  import CharacterProfile from './CharacterProfile.svelte';
  import type { CharacterArea, PostDraftEntry } from './character-life-navigation.js';

  export let session: CharacterLifeSessionState;
  export let locked: boolean;
  export let onapply: (next: CharacterLifeSessionState) => void;
  export let onpostdrafts: (entries: PostDraftEntry[]) => void;
  let selectedCharacterId = PLAYER_CHARACTER_ID;
  let areas: Record<string, CharacterArea> = {};
  let drafts: Record<string, string> = {};
  let assignError: { npcId: string; message: string } | null = null;
  $: slots = managerSlotTileIds(session.city);
  $: held = new Set(session.npcs.map(npc => npc.postTileId));
  $: freeSlots = slots.filter(id => !held.has(id));
  $: roster = [
    { id: PLAYER_CHARACTER_ID, name: 'You', role: 'Leader of Haven' },
    ...session.npcs.map(npc => ({ id: npc.character.id, name: npc.character.name, role: postLabel(npc.postTileId) })),
  ];
  $: selectedIndex = roster.findIndex(person => person.id === selectedCharacterId);
  $: npc = session.npcs.find(person => person.character.id === selectedCharacterId);
  $: view = (npc ? {
    character: { ...npc.character, age: npcAge(npc.life, session.city.world.week) },
    profile: session.profiles.find(profile => profile.id === npc.character.id)!,
    role: 'npc', postBuildingName: npc.postTileId ? buildingName(npc.postTileId) : null,
  } : { character: session.player.character, profile: session.player.profile, role: 'player', postBuildingName: null }) satisfies CharacterView;
  $: displayedPost = drafts[selectedCharacterId] ?? freeSlots[0] ?? '';
  $: npcHome = npc ? session.city.tiles.find(tile => tile.id === npc.household.home) : undefined;
  $: inHall = npcHome?.building?.typeId === 'retainers-hall';
  $: hallIds = new Set(session.npcs.filter(person => session.city.tiles.some(tile =>
    tile.id === person.household.home && tile.building?.typeId === 'retainers-hall')).map(person => person.character.id));
  $: if (Object.keys(drafts).some(id => !hallIds.has(id))) {
    drafts = Object.fromEntries(Object.entries(drafts).filter(([id]) => hallIds.has(id)));
  }
  $: onpostdrafts(session.npcs.filter(person => hallIds.has(person.character.id) && Object.hasOwn(drafts, person.character.id))
    .map(person => ({ npcId: person.character.id, name: person.character.name })));

  function buildingName(tileId: string) {
    return TRIAL_BUILDINGS[session.city.tiles.find(tile => tile.id === tileId)?.building?.typeId ?? '']?.name ?? 'Locked';
  }
  function slotName(tileId: string) { return `Manager — ${buildingName(tileId)} (${tileId})`; }
  function postLabel(tileId: string | null) { return tileId ? slotName(tileId) : 'Unassigned'; }
  export function openWork(npcId: string): void {
    if (!session.npcs.some(npc => npc.character.id === npcId)) return;
    selectedCharacterId = npcId;
    areas[npcId] = 'work';
  }
  let playerButton: HTMLButtonElement;
  async function release(npcId: string, reason: string) {
    if (reason) return;
    const result = executeCharacterLifeCommand(session, { type: 'RELEASE_NPC', expectedRevision: session.city.revision, npcId });
    if (!result.success) { assignError = { npcId, message: result.error.message }; return; }
    assignError = null;
    selectedCharacterId = PLAYER_CHARACTER_ID;
    onapply(result.next);
    await tick();
    playerButton.focus();
  }
  function run(type: 'ASSIGN_NPC' | 'UNASSIGN_NPC', npcId: string) {
    const fields = type === 'ASSIGN_NPC' ? { tileId: displayedPost } : {};
    const result = executeCharacterLifeCommand(session, { type, expectedRevision: session.city.revision, npcId, ...fields });
    delete drafts[npcId];
    drafts = { ...drafts };
    assignError = result.success ? null : { npcId, message: result.error.message };
    if (result.success) onapply(result.next);
  }
</script>

<nav class="roster" aria-label="Character roster">
  {#each roster as person (person.id)}
    {#if person.id === PLAYER_CHARACTER_ID}
      <button bind:this={playerButton} data-testid={`character-${person.id}`} aria-pressed={selectedCharacterId === person.id}
        onclick={() => { selectedCharacterId = person.id; }}>{person.name} · {person.role}</button>
    {:else}
      <button data-testid={`character-${person.id}`} aria-pressed={selectedCharacterId === person.id}
        onclick={() => { selectedCharacterId = person.id; }}>{person.name} · {person.role}</button>
    {/if}
  {/each}
</nav>
{#if session.npcs.length === 0}<p>No NPCs yet. Find recruits at the Guild, Auction House or Slave Market.</p>{/if}
<section class="card" aria-label="Character window" data-character-id={selectedCharacterId}>
  <header>
    <h3>{view.character.name}</h3>
    <p>{npc ? postLabel(npc.postTileId) : 'You · Leader of Haven'}</p>
    <button disabled={selectedIndex === 0} onclick={() => { selectedCharacterId = roster[selectedIndex - 1].id; }}>Previous</button>
    <button disabled={selectedIndex === roster.length - 1} onclick={() => { selectedCharacterId = roster[selectedIndex + 1].id; }}>Next</button>
  </header>
  {#key selectedCharacterId}
    <CharacterProfile {view} {npc} traitIds={npc?.traits ?? []} relationship={npc?.character.relationshipToPlayer ?? null}
      area={areas[selectedCharacterId] ?? 'description'} onarea={area => { areas[selectedCharacterId] = area; }}>
      {#snippet inventory()}<EquipmentView {session} characterId={selectedCharacterId} {locked} {onapply} />{/snippet}
      {#snippet work()}
        {#if npc}
          <p data-testid={`npc-post-${npc.character.id}`}>Post: {postLabel(npc.postTileId)}</p>
          {#if npcHome?.building && homeBeds(session.city, npcHome.id)}
            <p>Home: {buildingName(npcHome.id)} ({npcHome.id}).</p>
          {/if}
          {#if npc.life.working}
            <p>NPC post skills apply at End Week.</p>
          {:else}
            <p>Not working{npc.postTileId ? ' · Post inactive at End Week.' : ''}</p>
          {/if}
          {#if assignError?.npcId === npc.character.id}<p id="life-assign-error" role="alert">{assignError.message}</p>{/if}
          {#if !inHall}
            <p>Only Retainers' Hall residents can hold a city post.</p>
          {:else if npc.postTileId}
            <button disabled={locked} aria-describedby={assignError?.npcId === npc.character.id ? 'life-assign-error' : undefined}
              onclick={() => run('UNASSIGN_NPC', npc.character.id)}>Unassign</button>
          {:else if freeSlots.length || Object.hasOwn(drafts, npc.character.id)}
            <label for={`npc-slot-${npc.character.id}`}>Manager post for {npc.character.name}</label>
            <select id={`npc-slot-${npc.character.id}`} value={displayedPost} disabled={locked}
              aria-describedby={assignError?.npcId === npc.character.id ? 'life-assign-error' : undefined}
              onchange={event => { drafts[npc.character.id] = event.currentTarget.value; }}>
              {#if !freeSlots.includes(displayedPost)}<option value={displayedPost}>Unavailable — {slotName(displayedPost)}</option>{/if}
              {#each freeSlots as id}<option value={id}>{slotName(id)}</option>{/each}
            </select>
            <button disabled={locked} aria-describedby={assignError?.npcId === npc.character.id ? 'life-assign-error' : undefined}
              onclick={() => run('ASSIGN_NPC', npc.character.id)}>Assign</button>
          {/if}
          {#if inHall && !npc.postTileId && !freeSlots.length}<p>No free manager post. Build a Farm, Processor, Logging Camp, Mine, Workshop or Market.</p>{/if}
          {@const reason = departureReason(session.city, npc, locked, false)}
          <button type="button" data-acquisition-action="RELEASE_NPC" aria-disabled={!!reason}
            aria-describedby={reason ? 'npc-release-reason' : undefined}
            onclick={() => release(npc!.character.id, reason)}>Release</button>
          {#if reason}<p id="npc-release-reason">{reason}</p>{/if}
        {/if}
      {/snippet}
    </CharacterProfile>
  {/key}
</section>

<style>
  section, header, .roster { min-width: 0; overflow-wrap: anywhere; }
  .roster { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  h3 { margin: 0; } p { margin: 8px 0; }
  select, button { font: inherit; border-radius: 6px; padding: 10px; border: 1px solid var(--border-color); max-width: 100%; }
  select { color: var(--text-main); background: var(--bg-tertiary); }
  button { background: var(--accent-green); color: #000; cursor: pointer; margin: 4px 4px 4px 0; }
  button:disabled { opacity: .5; cursor: default; }
  [aria-pressed='true'] { border: 3px solid var(--text-main); font-weight: bold; }
  label { display: block; margin: 8px 0 4px; }
  [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
</style>
