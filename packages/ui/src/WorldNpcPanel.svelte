<script lang="ts">
  import { managerSlotTileIds, REQUIRED_RELATIONSHIP, REQUIRED_SKILLS, TRIAL_BUILDINGS, WORLD_TRAITS, type NpcWorldSessionState } from '@haven/core';
  import { executeWorldNpcCommand } from '@haven/simulation';

  export let session: NpcWorldSessionState;
  export let locked = false;
  export let onapply: (next: NpcWorldSessionState) => void;
  let drafts: Record<string, string> = {};
  let error = '';
  const title = (key: string) => key[0].toUpperCase() + key.slice(1);
  $: slots = managerSlotTileIds(session.city);
  $: slotName = (tileId: string) => `Manager — ${TRIAL_BUILDINGS[session.city.tiles.find(t => t.id === tileId)?.building?.typeId ?? '']?.name ?? 'Locked'} (${tileId})`;
  $: held = new Set(session.npcs.map(n => n.postTileId));

  function run(type: 'ASSIGN_NPC' | 'UNASSIGN_NPC', npcId: string) {
    const fields = type === 'ASSIGN_NPC' ? { tileId: drafts[npcId] ?? slots.find(id => !held.has(id)) ?? '' } : {};
    const result = executeWorldNpcCommand(session, { type, expectedRevision: session.city.revision, npcId, ...fields });
    // A stale choice (post gone or taken) fails visibly instead of moving silently; the next click uses the shown option.
    if (!result.success) { error = result.error.message; delete drafts[npcId]; return; }
    error = ''; delete drafts[npcId];
    onapply(result.next);
  }
</script>

<section class="card" aria-label="NPCs">
  <h2>NPCs · TRIAL</h2>
  <p>Starter profiles, traits and the manager-post mapping are PROVISIONAL trial content. Names are drawn once at New Game. No one is assigned automatically; read stats and traits, then choose a post. Any NPC may take any unlocked post.</p>
  <p><strong>NPC effects on output are not active yet.</strong> <a href="/?mode=world">World Session without NPCs</a></p>
  {#if error}<p role="alert">{error}</p>{/if}
  <div class="npcs">
    {#each session.npcs as npc (npc.character.id)}
      {@const c = npc.character}
      <article data-testid={`npc-${c.id}`} aria-label={c.name}>
        <h3>{c.name}</h3>
        <p>Age {c.age} · Background: {c.occupation} · {c.socialClass} · {c.legalStatus.replace('_', ' ')}</p>
        <p>{#each REQUIRED_SKILLS as key}{title(key)} {c.skills[key]} · {/each}Health {c.health}</p>
        <details><summary>Relationship to you</summary>
          {#each REQUIRED_RELATIONSHIP as key}
            <label class="axis">{title(key)} <meter min="0" max="100" value={c.relationshipToPlayer[key]} aria-label={title(key)} aria-valuenow={c.relationshipToPlayer[key]}></meter> {c.relationshipToPlayer[key]}</label>
          {/each}
        </details>
        <ul>{#each npc.traits as id}{@const trait = WORLD_TRAITS.find(t => t.id === id)}<li><strong>{trait?.name ?? id}</strong>: {trait?.summary ?? ''}</li>{/each}</ul>
        <p data-testid={`npc-post-${c.id}`}>Post: {npc.postTileId ? slotName(npc.postTileId) : 'Unassigned'}</p>
        {#if npc.postTileId}
          <button disabled={locked} onclick={() => run('UNASSIGN_NPC', c.id)}>Unassign</button>
        {:else if slots.some(id => !held.has(id))}
          <label for={`npc-slot-${c.id}`}>Manager post for {c.name}</label>
          <select id={`npc-slot-${c.id}`} disabled={locked} onchange={e => { drafts[c.id] = e.currentTarget.value; }}>
            {#each slots.filter(id => !held.has(id)) as id}<option value={id}>{slotName(id)}</option>{/each}
          </select>
          <button disabled={locked} onclick={() => run('ASSIGN_NPC', c.id)}>Assign</button>
        {:else}<p>No free manager post. Build a Farm, Processor, Logging Camp, Mine, Workshop or Market.</p>{/if}
      </article>
    {/each}
  </div>
</section>

<style>
  .npcs { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
  article { background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; }
  h3 { margin: 0; } p { margin: 8px 0; } ul { padding-left: 18px; margin: 8px 0; }
  .axis { display: flex; gap: 8px; align-items: center; margin: 4px 0; } meter { flex: 1; }
  a { color: var(--accent-green); }
  select, button { font: inherit; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); }
  select { color: var(--text-main); background: var(--bg-secondary, var(--bg-tertiary)); max-width: 100%; }
  button { background: var(--accent-green); color: #000; cursor: pointer; margin: 4px 4px 4px 0; } button:disabled { opacity: .5; cursor: default; }
  label { display: block; margin: 8px 0 4px; } [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
</style>
