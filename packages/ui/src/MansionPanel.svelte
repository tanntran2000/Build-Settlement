<script lang="ts">
  import { tick } from 'svelte';
  import { MANSION_CATALOG, type MansionRoomTypeId, type TileTrialState, type WorldNpc } from '@haven/core';
  import { mansionRoomChoices, mansionView } from './mansion-view.js';

  export let city: TileTrialState;
  export let npcs: WorldNpc[];
  export let locked: boolean;
  export let managementError: { action: string; message: string } | null;
  export let oncommand: (type: string, fields: Record<string, unknown>) => boolean;
  export let onopenreports: () => void;
  let heading: HTMLHeadingElement;
  let buildType: MansionRoomTypeId = MANSION_CATALOG.defaultBuildType;
  let assignments: Record<string, string> = {};

  $: model = mansionView(city, npcs);
  $: build = model.builds.find(option => option.id === buildType)!;

  async function moveNpc(npcId: string, roomId: string) {
    if (!oncommand('MOVE_TO_ROOM', { npcId, roomId })) return;
    const next = { ...assignments };
    delete next[npcId];
    assignments = next;
    await tick();
    heading?.focus();
  }
</script>

<section aria-labelledby="mansion-rooms-heading" class="mansion">
  <h3 id="mansion-rooms-heading" bind:this={heading} tabindex="-1">Mansion rooms</h3>

  <div class="mansion-build">
    <label for="mansion-build-type">Build room type</label>
    <select id="mansion-build-type" bind:value={buildType} disabled={locked} aria-describedby={build.reason ? 'mansion-build-reason' : undefined}>
      {#each model.builds as option (option.id)}
        <option value={option.id}>{option.name}</option>
      {/each}
    </select>
    <p>Build cost · <span>{build.cost}</span></p>
    {#if build.reason}<p id="mansion-build-reason" class="reason">{build.reason}</p>{/if}
    <button type="button" disabled={!!build.reason} aria-describedby={build.reason ? 'mansion-build-reason' : undefined}
      onclick={() => oncommand('BUILD_ROOM', { typeId: build.id })}>Build room</button>
  </div>

  {#if managementError && ['BUILD_ROOM', 'UPGRADE_ROOM', 'MOVE_TO_ROOM'].includes(managementError.action)}
    <p class="room-error" role="alert">{managementError.message}</p>
  {/if}

  {#each model.rooms as room (room.id)}
    <article class="room">
      <h4>{room.name} · Level {room.level}</h4>
      <p>Beds used: {room.residents.length} / {room.beds}</p>
      {#if room.residents.length}
        <ul>
          {#each room.residents as resident (resident.character.id)}
            {@const name = resident.character.name}
            {@const id = resident.character.id}
            {@const options = mansionRoomChoices(city, npcs, resident).filter(choice => !choice.reason && choice.id !== room.id)}
            {@const choice = assignments[id] ?? ''}
            {@const reason = locked ? 'Plan next week to move residents.' : !options.length ? 'No other eligible room has a free bed.'
              : options.some(option => option.id === choice) ? '' : 'Choose a destination room.'}
            <li>
              <strong>{name}</strong>
              <label for={'mansion-room-for-' + id}>Move to room for {name}</label>
              <select id={'mansion-room-for-' + id} value={choice} disabled={locked || !options.length}
                aria-describedby={reason ? 'mansion-move-reason-' + id : undefined}
                onchange={event => { assignments = { ...assignments, [id]: event.currentTarget.value }; }}>
                <option value="">Choose a destination room</option>
                {#each options as option (option.id)}<option value={option.id}>{option.label}</option>{/each}
              </select>
              {#if reason}<p id={'mansion-move-reason-' + id} class="reason">{reason}</p>{/if}
              <button type="button" disabled={!!reason} aria-label={'Move ' + name + ' to room'}
                aria-describedby={reason ? 'mansion-move-reason-' + id : undefined} onclick={() => void moveNpc(id, choice)}>Move to room</button>
            </li>
          {/each}
        </ul>
      {:else if room.beds}
        <p>No residents.</p>
      {/if}
      {#if room.upgradeCost}<p>Upgrade cost · <span>{room.upgradeCost}</span></p>{/if}
      {#if room.upgradeReason}<p id={'mansion-upgrade-' + room.id} class="reason">{room.upgradeReason}</p>{/if}
      <button type="button" disabled={!!room.upgradeReason} aria-label={'Upgrade ' + room.name}
        aria-describedby={room.upgradeReason ? 'mansion-upgrade-' + room.id : undefined}
        onclick={() => oncommand('UPGRADE_ROOM', { roomId: room.id })}>Upgrade</button>
      {#if room.reportAccess}<button type="button" onclick={onopenreports}>Open Report</button>{/if}
    </article>
  {/each}
</section>

<style>
  .mansion { margin-block: 1.35rem; min-width: 0; }
  .mansion-build, .room { border-top: 1px solid var(--life-control-border); padding-block: .8rem; }
  h3 { font-size: var(--life-card-heading); }
  h4 { margin: 0 0 .45rem; }
  p { margin-block: .45rem; line-height: 1.4; }
  .reason { font-size: .9em; }
  .room-error { border-left: 3px solid var(--accent-red); padding-inline-start: .6rem; }
  label { display: block; margin-block: .45rem; }
  ul { padding-inline-start: 1.2rem; }
  li + li { margin-top: .8rem; }
  select, button { font: inherit; color: var(--text-main); border: 1px solid var(--life-control-border); border-radius: 8px; padding: .5rem; max-width: 100%; }
  select { background: var(--bg-tertiary); }
  button { margin: .25rem .3rem .15rem 0; background: transparent; cursor: pointer; }
  button:disabled { cursor: default; }
  :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
</style>
