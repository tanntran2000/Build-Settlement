<script lang="ts">
  import { isMansionStaffRole, mansionResidentRole, type MansionStaffRole, type TileTrialState, type WorldNpc } from '@haven/core';
  import { mansionRoleOptions } from './mansion-view.js';

  export let city: TileTrialState;
  export let npcs: readonly WorldNpc[];
  export let npc: WorldNpc;
  export let locked: boolean;
  export let onassign: (role: MansionStaffRole | null) => string | null;
  let error: string | null = null;
  $: choices = mansionRoleOptions(city, npcs, npc);
  $: selected = mansionResidentRole(npc.household) ?? '';
  $: selectId = 'mansion-role-' + npc.character.id;

  function change(select: HTMLSelectElement) {
    const role = select.value || null;
    if (role !== null && !isMansionStaffRole(role)) return;
    error = onassign(role);
    if (error) select.value = selected;
  }
</script>

<div class="role-picker">
  <label for={selectId}>Role</label>
  <select id={selectId} value={selected} disabled={locked}
    aria-describedby={locked ? selectId + '-reason' : undefined} onchange={event => change(event.currentTarget)}>
    {#each choices as option (option.role)}
      <option value={option.role ?? ''} disabled={!!option.reason}>
        {option.name}{option.fitRoom ? ' · ' + option.fitRoom : ''}{option.reason ? ' · ' + option.reason : ''}
      </option>
    {/each}
  </select>
  {#if locked}<p id={selectId + '-reason'}>Plan next week to change roles.</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
</div>

<style>
  .role-picker { display: grid; justify-items: start; gap: .35rem; margin-block: .8rem; min-width: 0; }
  select { font: inherit; max-width: 100%; padding: .5rem; border: 1px solid var(--life-control-border);
    border-radius: 8px; color: var(--text-main); background: var(--bg-tertiary); }
  select:focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
  p { margin: 0; }
</style>
