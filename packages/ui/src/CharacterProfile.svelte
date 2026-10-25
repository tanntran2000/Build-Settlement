<script lang="ts">
  import {
    describeLong, describeShort, profileRows, REQUIRED_EMOTIONS, REQUIRED_NEEDS, REQUIRED_RELATIONSHIP, REQUIRED_SKILLS, WORLD_TRAITS,
    type CharacterView, type Relationship8D,
  } from '@haven/core';

  export let view: CharacterView;
  export let traitIds: string[] = [];
  export let relationship: Relationship8D | null = null;
  const title = (key: string) => key[0].toUpperCase() + key.slice(1);
  let tab = 0;
  const buttons: HTMLButtonElement[] = [];
  $: c = view.character;
  $: id = `profile-${c.id}`;
  $: tabs = ['Overview', 'Profile', 'Stats', ...(view.role === 'npc' && relationship ? ['Relationship'] : []), 'History'];
  $: history = view.profile.private?.intimateHistory;
  $: traitNames = traitIds.map(t => WORLD_TRAITS.find(w => w.id === t)?.name ?? t);

  function onTabKey(event: KeyboardEvent) {
    const next = ({ ArrowRight: tab + 1, ArrowLeft: tab - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[event.key];
    if (next === undefined) return;
    event.preventDefault();
    tab = (next + tabs.length) % tabs.length;
    buttons[tab].focus();
  }
</script>

<div class="profile">
  <div role="tablist" aria-label={`${c.name} profile`}>
    {#each tabs as name, i}
      <button bind:this={buttons[i]} id={`${id}-tab-${i}`} role="tab" aria-selected={tab === i} aria-controls={`${id}-panel`} tabindex={tab === i ? 0 : -1}
        onclick={() => { tab = i; }} onkeydown={onTabKey}>{name}</button>
    {/each}
  </div>
  <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`}>
    {#if tabs[tab] === 'Overview'}
      <p data-testid={`${id}-short`}><strong>{describeShort(view)}</strong></p>
      <p data-testid={`${id}-long`}>{describeLong(view)}</p>
    {:else if tabs[tab] === 'Profile'}
      <dl>
        {#each profileRows(view) as row}<div><dt>{row.label}</dt><dd>{row.value}</dd></div>{/each}
        {#if traitNames.length}<div><dt>Traits</dt><dd>{traitNames.join(', ')}</dd></div>{/if}
      </dl>
      {#if c.age >= 18}
        <details>
          <summary>Private (adult)</summary>
          <p>Intimacy Knowledge: {view.profile.traits.intimacyKnowledge ?? 'Not recorded'}</p>
          <p>Intimate history: {!history ? 'Not recorded' : history.disclosure === 'unknown' ? 'Unknown' : title(history.value)}</p>
        </details>
      {/if}
    {:else if tabs[tab] === 'Stats'}
      <p>Skills: {REQUIRED_SKILLS.map(k => `${title(k)} ${c.skills[k]}`).join(' · ')}</p>
      <p>Health {c.health}</p>
      <p>Needs: {REQUIRED_NEEDS.map(k => `${title(k)} ${c.needs[k]}`).join(' · ')}</p>
      <p>Emotions: {REQUIRED_EMOTIONS.map(k => `${title(k)} ${c.emotions[k]}`).join(' · ')}</p>
    {:else if tabs[tab] === 'Relationship' && relationship}
      <p>Toward you:</p>
      <dl>{#each REQUIRED_RELATIONSHIP as k}<div><dt>{title(k)}</dt><dd>{relationship[k]}</dd></div>{/each}</dl>
    {:else}
      <p>No memories yet.</p>
    {/if}
  </div>
</div>

<style>
  /* Long unbroken names and labels wrap inside the card instead of widening it. */
  .profile { margin: 8px 0; min-width: 0; overflow-wrap: anywhere; } [role='tablist'] { display: flex; flex-wrap: wrap; gap: 4px; }
  button { font: inherit; border-radius: 6px; padding: 6px 8px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-main); cursor: pointer; }
  [role='tab'][aria-selected='true'] { background: var(--accent-green); color: #000; }
  dl { display: grid; gap: 4px; margin: 8px 0; } dl div { display: flex; gap: 8px; } dt { color: var(--text-muted); min-width: 9rem; } dd { margin: 0; min-width: 0; }
  p { margin: 8px 0; } :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
</style>
