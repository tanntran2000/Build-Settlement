<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { CharacterArea } from './character-life-navigation.js';
  import {
    describeLong, describeShort, profileRows, REQUIRED_EMOTIONS, REQUIRED_NEEDS, REQUIRED_RELATIONSHIP, REQUIRED_SKILLS, WORLD_TRAITS,
    type CharacterView, type Relationship8D,
  } from '@haven/core';

  export let view: CharacterView;
  export let traitIds: string[] = [];
  export let relationship: Relationship8D | null = null;
  export let area: CharacterArea = 'description';
  export let onarea: (area: CharacterArea) => void = () => {};
  export let work: Snippet | undefined = undefined;
  const title = (key: string) => key[0].toUpperCase() + key.slice(1);
  const tabs: { id: CharacterArea; label: string }[] = [
    { id: 'description', label: 'Description' }, { id: 'inventory', label: 'Inventory' },
    { id: 'work', label: 'Work' }, { id: 'relations', label: 'Relations' },
  ];
  const buttons: HTMLButtonElement[] = [];
  $: c = view.character;
  $: id = `profile-${c.id}`;
  $: history = view.profile.private?.intimateHistory;
  $: traits = traitIds.map(id => WORLD_TRAITS.find(trait => trait.id === id));

  function selectArea(next: CharacterArea) { area = next; onarea(next); }

  function onTabKey(event: KeyboardEvent) {
    const tab = tabs.findIndex(t => t.id === area);
    const next = ({ ArrowRight: tab + 1, ArrowLeft: tab - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const index = (next + tabs.length) % tabs.length;
    selectArea(tabs[index].id);
    buttons[index].focus();
  }
</script>

<div class="profile">
  <div class="full-body" role="group" aria-label="Full-body character display">
    <p>Character artwork unavailable.</p>
  </div>
  <div role="tablist" aria-label={`${c.name} profile`}>
    {#each tabs as tab, i}
      <button bind:this={buttons[i]} id={`${id}-tab-${tab.id}`} role="tab" aria-selected={area === tab.id} aria-controls={`${id}-panel`} tabindex={area === tab.id ? 0 : -1}
        onclick={() => selectArea(tab.id)} onkeydown={onTabKey}>{tab.label}</button>
    {/each}
  </div>
  <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${area}`}>
    {#if area === 'description'}
      <p data-testid={`${id}-short`}><strong>{describeShort(view)}</strong></p>
      <p data-testid={`${id}-long`}>{describeLong(view)}</p>
      <h4>Identity and appearance</h4>
      {#if view.role === 'npc'}<p>Age {c.age} · Background: {c.occupation} · {c.socialClass} · {c.legalStatus.replace('_', ' ')}</p>{/if}
      <dl>
        {#each profileRows(view) as row}<div><dt>{row.label}</dt><dd>{row.value}</dd></div>{/each}
        {#each traits as trait, i}<div><dt>{trait?.name ?? traitIds[i]}</dt><dd>{trait?.summary ?? ''}</dd></div>{/each}
      </dl>
      <details><summary>Attributes</summary>
        <p>Health {c.health}</p>
        <p>Needs: {REQUIRED_NEEDS.map(k => `${title(k)} ${c.needs[k]}`).join(' · ')}</p>
        <p>Emotions: {REQUIRED_EMOTIONS.map(k => `${title(k)} ${c.emotions[k]}`).join(' · ')}</p>
      </details>
      <details><summary>Skills</summary><p>Skills: {REQUIRED_SKILLS.map(k => `${title(k)} ${c.skills[k]}`).join(' · ')}</p></details>
      <details><summary>History</summary><p>No memories yet.</p></details>
      {#if c.age >= 18}
        <details>
          <summary>Private (adult)</summary>
          <p>Intimacy Knowledge: {view.profile.traits.intimacyKnowledge ?? 'Not recorded'}</p>
          <p>Intimate history: {!history ? 'Not recorded' : history.disclosure === 'unknown' ? 'Unknown' : title(history.value)}</p>
        </details>
      {/if}
    {:else if area === 'inventory'}
      <p>Inventory and equipment are not implemented yet.</p>
      <p>Current clothing is described in Description.</p>
    {:else if area === 'work'}
      {#if view.role === 'player'}
        <p>Leader of Haven.</p>
        <p>Player work and interactions are not available yet.</p>
      {:else if work}{@render work()}{/if}
    {:else if view.role === 'npc' && relationship}
      <p>Toward you:</p>
      <dl>{#each REQUIRED_RELATIONSHIP as k}<div><dt>{title(k)}</dt><dd>{relationship[k]}</dd></div>{/each}</dl>
    {:else}
      <p>Your own relationships are not tracked yet. Open a person to see how they regard you.</p>
    {/if}
  </div>
</div>

<style>
  /* Long unbroken names and labels wrap inside the card instead of widening it. */
  .profile { margin: 8px 0; min-width: 0; overflow-wrap: anywhere; } [role='tablist'] { display: flex; flex-wrap: wrap; gap: 4px; }
  .full-body { box-sizing: border-box; display: grid; place-items: center; width: min(100%, 15rem); min-height: 22.5rem; margin: 0 auto 12px; padding: 16px; border: 1px dashed var(--border-color); border-radius: 6px; background: var(--bg-tertiary); text-align: center; }
  button { font: inherit; border-radius: 6px; padding: 6px 8px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-main); cursor: pointer; }
  [role='tab'][aria-selected='true'] { background: var(--accent-green); color: #000; }
  dl { display: grid; gap: 4px; margin: 8px 0; } dl div { display: flex; gap: 8px; } dt { color: var(--text-muted); min-width: 9rem; } dd { margin: 0; min-width: 0; }
  p { margin: 8px 0; } :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
  :global([data-testid='life-shell']) [role='tab'][aria-selected='true'] { font-weight: bold; }
  :global([data-testid='life-shell']) dl div { flex-wrap: wrap; min-width: 0; }
  :global([data-testid='life-shell']) dt { min-width: min(9rem, 100%); }
</style>
