<script lang="ts">
  import type { WorldNpc } from '@haven/core';
  import type { Snippet } from 'svelte';
  import { formatLifeWeek } from './life-calendar.js';
  import { buildNpcSheetView } from './npc-sheet-view.js';

  interface Props {
    npc: WorldNpc;
    age: number;
    description: Snippet;
  }

  let { npc, description }: Props = $props();
  const id = $props.id();
  const tabs = ['Profile', 'Skills', '18+', 'History'] as const;
  const buttons: HTMLButtonElement[] = [];
  let selected = $state(0);
  const sheet = $derived(buildNpcSheetView(npc));

  function onTabKey(event: KeyboardEvent, index: number) {
    let next: number;
    switch (event.key) {
      case 'ArrowLeft': next = (index + tabs.length - 1) % tabs.length; break;
      case 'ArrowRight': next = (index + 1) % tabs.length; break;
      case 'Home': next = 0; break;
      case 'End': next = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    selected = next;
    buttons[next].focus();
  }
</script>

<div class="npc-sheet ledger-parchment" data-testid="npc-sheet">
  <div class="tabs" role="tablist" aria-label="NPC sheet">
    {#each tabs as name, index}
      <button
        type="button"
        id={`${id}-tab-${index}`}
        role="tab"
        aria-controls={`${id}-panel-${index}`}
        aria-selected={selected === index}
        tabindex={selected === index ? 0 : -1}
        bind:this={buttons[index]}
        onclick={() => { selected = index; }}
        onfocus={() => { selected = index; }}
        onkeydown={event => onTabKey(event, index)}
      >{name}</button>
    {/each}
  </div>

  {#each tabs as name, index}
    <div
      class="panel"
      id={`${id}-panel-${index}`}
      role="tabpanel"
      aria-labelledby={`${id}-tab-${index}`}
      tabindex="0"
      hidden={selected !== index}
    >
      {#if selected === index}
        {#if name === 'Profile'}
          <dl class="rows">
            <div><dt>Life origin</dt><dd>{sheet.origin}</dd></div>
            <div><dt>Hobbies</dt><dd>{sheet.hobbies.join(' · ')}</dd></div>
            <div><dt>Affection</dt><dd>{sheet.affection}</dd></div>
          </dl>
          {@render description()}
        {:else if name === 'Skills'}
          <dl class="rows">
            {#each sheet.skills as skill}
              <div><dt>{skill.label}</dt><dd>{skill.score}</dd></div>
            {/each}
          </dl>
          <h4>Stress</h4>
          <p>{sheet.stress.value} / 100 · {sheet.stress.band}</p>
          <div
            class="track"
            role="meter"
            aria-label="Stress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={sheet.stress.value}
            aria-valuetext={`${sheet.stress.value} of 100, ${sheet.stress.band}`}
          >
            <span class="stress-fill" style:width={`${sheet.stress.value}%`}></span>
          </div>
          {#if sheet.stress.notWorking}<p>Not working</p>{/if}
        {:else if name === '18+'}
          <h4>Mind</h4>
          <p>{sheet.mind.value} / 100 · {sheet.mind.band}</p>
          <div
            class="track mind"
            data-testid="npc-mind-track"
            role="meter"
            aria-label="Mind"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={sheet.mind.value}
            aria-valuetext={`${sheet.mind.value} of 100, ${sheet.mind.band}`}
          >
            <span class="marker" data-testid="npc-mind-marker" style:left={`${sheet.mind.value}%`}></span>
          </div>
          <div class="mind-ends"><span>Light</span><span>Dark</span></div>
          <dl class="rows">
            <div><dt>Lust</dt><dd>{sheet.lust}</dd></div>
            <div><dt>Arousal</dt><dd>{sheet.arousal}</dd></div>
            <div><dt>Beauty</dt><dd>{sheet.beauty}</dd></div>
          </dl>
          <h4>Sex-exp</h4>
          {#each sheet.experience as part, partIndex}
            <div class="experience">
              <label for={`${id}-exp-${partIndex}`}>{part.label}</label>
              <span id={`${id}-level-${partIndex}`}>{part.level} · {part.exp} / {part.cap}</span>
              <progress
                id={`${id}-exp-${partIndex}`}
                aria-describedby={`${id}-level-${partIndex}`}
                value={part.exp}
                max={part.cap}
              ></progress>
            </div>
          {/each}
        {:else}
          <div class="history-groups">
            {#each sheet.history.groups as group}
              <section aria-label={group.label}>
                <h4>{group.label}</h4>
                <dl class="rows">
                  {#each group.counters as counter}
                    <div><dt>{counter.label}</dt><dd>{counter.count}</dd></div>
                  {/each}
                </dl>
              </section>
            {/each}
          </div>
          <h4>Recent events</h4>
          {#if sheet.history.recent.length}
            <ol aria-label="Recent events">
              {#each sheet.history.recent as event}
                <li>{formatLifeWeek(event.week)} · {event.label}</li>
              {/each}
            </ol>
          {:else}
            <p>No events recorded.</p>
          {/if}
        {/if}
      {/if}
    </div>
  {/each}
</div>

<style>
  .npc-sheet { min-width: 0; overflow-wrap: anywhere; padding: 8px; }
  .tabs { display: flex; flex-wrap: wrap; gap: 8px; padding: 6px; }
  .tabs button { flex: 1 1 4.5rem; min-width: 44px; min-height: 44px; font: inherit; cursor: pointer; }
  .tabs [aria-selected="true"] { font-weight: 700; }
  .panel { min-width: 0; padding: 8px; }
  .panel[hidden] { display: none; }
  h4 { margin: 12px 0 6px; }
  p { margin: 8px 0; }
  .rows { margin: 8px 0; }
  .rows div { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; padding-block: 2px; }
  .rows dd { margin: 0; text-align: right; }
  .track { position: relative; height: 12px; border: 2px solid var(--ink); background-color: var(--paper); }
  .stress-fill { display: block; height: 100%; background-color: var(--ink-loss); }
  .mind { background-image: linear-gradient(to right, #fff, #efb4c8); }
  .marker { position: absolute; inset-block: -2px; width: 4px; transform: translateX(-50%); background: var(--ink); }
  .mind-ends { display: flex; justify-content: space-between; margin-block: 4px; }
  .experience { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 8px; margin-block: 6px; }
  .experience progress { grid-column: 1 / -1; width: 100%; height: 12px; accent-color: var(--ink-gain); }
  .history-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr)); gap: 8px; }
  .history-groups section { min-width: 0; }
  ol { margin-block: 8px; padding-inline-start: 24px; }
</style>
