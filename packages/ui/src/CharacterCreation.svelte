<script lang="ts">
  import {
    axisBand, BUILDS, createPlayerCharacter, DEFAULT_PLAYER_DRAFT, describeLong, describeShort, EYE_COLORS, FACE_FEATURES, FACE_SHAPES,
    HAIR_COLORS, HAIR_LENGTHS, HAIR_STYLES, HAIR_TEXTURES, OUTFITS, PLACES, PLAYER_APPEARANCE_PRESETS, PLAYER_PROFESSIONS, PROFESSION_LABELS,
    REGIONS, SKIN_TONES, UPBRINGINGS, validatePlayerDraft, type PlayerDraft,
  } from '@haven/core';

  export let oncreate: (draft: PlayerDraft) => void;
  export let oncancel: () => void;
  const TABS = ['Identity', 'Origin', 'Appearance', 'Traits', 'Review'];
  // Fields per tab, so the Review summary can say where to fix each error; the rest belong to Appearance.
  const FIELDS: Record<string, string[]> = {
    Identity: ['currentName', 'birthName', 'label', 'pronouns', 'gender', 'age'],
    Origin: ['profession', 'birthplaceId', 'regionId', 'upbringing', 'biography'],
    Traits: ['attractiveness', 'learningAptitude', 'warmth', 'intimacyKnowledge', 'intimateHistory'],
  };
  const AXES = [['attractiveness', 'Attractiveness'], ['learningAptitude', 'Learning Aptitude'], ['warmth', 'Warmth']] as const;
  const MEASUREMENTS = [['chestCm', 'Chest (cm)'], ['waistCm', 'Waist (cm)'], ['hipsCm', 'Hips (cm)']] as const;
  const title = (id: string) => id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' ');
  // Copies only: the frozen default and presets are never bound to inputs.
  let draft: PlayerDraft = structuredClone(DEFAULT_PLAYER_DRAFT);
  let preset = 'practical';
  let tab = 0;
  let created = false;
  const tabs: HTMLButtonElement[] = [];
  $: errors = validatePlayerDraft(draft);
  $: valid = Object.keys(errors).length === 0;
  $: player = valid ? createPlayerCharacter(draft) : null;
  $: preview = player?.success ? { character: player.value.character, profile: player.value.profile, role: 'player' as const, postBuildingName: null } : null;
  $: summary = Object.entries(errors).map(([key, message]) => `${Object.keys(FIELDS).find(t => FIELDS[t].includes(key)) ?? 'Appearance'}: ${message}`);

  function onTabKey(event: KeyboardEvent) {
    const next = ({ ArrowRight: tab + 1, ArrowLeft: tab - 1, Home: 0, End: TABS.length - 1 } as Record<string, number>)[event.key];
    if (next === undefined) return;
    event.preventDefault();
    tab = (next + TABS.length) % TABS.length;
    tabs[tab].focus();
  }
  function applyPreset() {
    const chosen = PLAYER_APPEARANCE_PRESETS.find(p => p.id === preset);
    if (chosen) draft.appearance = structuredClone(chosen.appearance);
  }
  function toggleFeature(id: string, on: boolean) {
    const features = draft.appearance.face.features.filter(f => f !== id);
    draft.appearance.face.features = on ? [...features, id] : features;
  }
  function create() {
    if (created || !valid) return;
    created = true;
    oncreate(draft);
  }
</script>

{#snippet fieldError(key: string)}{#if errors[key]}<p id={`cc-error-${key}`} class="field-error">{errors[key]}</p>{/if}{/snippet}
{#snippet text(key: string, label: string, value: string, set: (v: string) => void, mode: 'numeric' | 'decimal' | 'text' = 'text')}
  <label for={`cc-${key}`}>{label}</label>
  <input id={`cc-${key}`} type="text" inputmode={mode} {value} oninput={e => set(e.currentTarget.value)}
    aria-invalid={errors[key] ? 'true' : 'false'} aria-describedby={errors[key] ? `cc-error-${key}` : undefined} />
  {@render fieldError(key)}
{/snippet}
{#snippet choice(key: string, label: string, value: string, options: readonly (readonly [string, string])[], set: (v: string) => void)}
  <label for={`cc-${key}`}>{label}</label>
  <select id={`cc-${key}`} {value} onchange={e => set(e.currentTarget.value)}
    aria-invalid={errors[key] ? 'true' : 'false'} aria-describedby={errors[key] ? `cc-error-${key}` : undefined}>
    {#each options as [id, name]}<option value={id}>{name}</option>{/each}
  </select>
  {@render fieldError(key)}
{/snippet}

<section class="card" aria-label="Character Creation">
  <h2>Character Creation</h2>
  <div role="tablist" aria-label="Character Creation steps">
    {#each TABS as name, i}
      <button bind:this={tabs[i]} id={`cc-tab-${i}`} role="tab" aria-selected={tab === i} aria-controls="cc-panel" tabindex={tab === i ? 0 : -1}
        onclick={() => { tab = i; }} onkeydown={onTabKey}>{name}</button>
    {/each}
  </div>

  <div id="cc-panel" role="tabpanel" aria-labelledby={`cc-tab-${tab}`}>
    {#if TABS[tab] === 'Identity'}
      {@render text('currentName', 'Name', draft.currentName, v => { draft.currentName = v; })}
      {@render text('birthName', 'Birth name (optional)', draft.birthName, v => { draft.birthName = v; })}
      {@render text('label', 'Label', draft.label, v => { draft.label = v; })}
      {@render choice('pronouns', 'Pronouns', draft.pronouns, [['she', 'She/her'], ['he', 'He/him'], ['they', 'They/them']], v => { draft.pronouns = v as PlayerDraft['pronouns']; })}
      {@render choice('gender', 'Gender', draft.gender, [['female', 'Female'], ['male', 'Male'], ['other', 'Other']], v => { draft.gender = v as PlayerDraft['gender']; })}
      {@render text('age', 'Age', draft.age, v => { draft.age = v; }, 'numeric')}
      <p>Character Life is for adults: age 18 to 90.</p>
    {:else if TABS[tab] === 'Origin'}
      {@render choice('profession', 'Profession', draft.profession, PLAYER_PROFESSIONS.map(id => [id, title(PROFESSION_LABELS[id])] as const), v => { draft.profession = v; })}
      {@render choice('birthplaceId', 'Birthplace', draft.birthplaceId, PLACES.filter(p => p.regionId !== null).map(p => [p.id, p.name] as const), v => { draft.birthplaceId = v; })}
      {@render choice('regionId', 'Origin region', draft.regionId, REGIONS.map(r => [r.id, r.name] as const), v => { draft.regionId = v; })}
      {@render choice('upbringing', 'Upbringing', draft.upbringing, UPBRINGINGS.map(u => [u.id, title(u.id)] as const), v => { draft.upbringing = v; })}
      <label for="cc-biography">Biography</label>
      <textarea id="cc-biography" rows="4" value={draft.biography} oninput={e => { draft.biography = e.currentTarget.value; }}
        aria-invalid={errors.biography ? 'true' : 'false'} aria-describedby={errors.biography ? 'cc-error-biography' : undefined}></textarea>
      {@render fieldError('biography')}
      <p>Current location: Haven.</p>
    {:else if TABS[tab] === 'Appearance'}
      <p>Appearance presets and values are PROVISIONAL trial content. A preset replaces every appearance field.</p>
      <label for="cc-preset">Appearance preset</label>
      <select id="cc-preset" bind:value={preset} onchange={applyPreset}>
        {#each PLAYER_APPEARANCE_PRESETS as p}<option value={p.id}>{p.label}</option>{/each}
      </select>
      {@render choice('presentation', 'Presentation', draft.appearance.presentation, [['feminine', 'Feminine'], ['masculine', 'Masculine'], ['androgynous', 'Androgynous']], v => { draft.appearance.presentation = v as PlayerDraft['appearance']['presentation']; })}
      {@render text('heightCm', 'Height (cm)', draft.appearance.heightCm, v => { draft.appearance.heightCm = v; }, 'numeric')}
      {@render text('weightKg', 'Weight (kg)', draft.appearance.weightKg, v => { draft.appearance.weightKg = v; }, 'numeric')}
      {@render choice('build', 'Build', draft.appearance.build, BUILDS.map(b => [b.id, title(b.id)] as const), v => { draft.appearance.build = v; })}
      {@render choice('skinTone', 'Skin tone', draft.appearance.skinTone, SKIN_TONES.map(w => [w.id, title(w.id)] as const), v => { draft.appearance.skinTone = v; })}
      {@render choice('eyeColor', 'Eye color', draft.appearance.eyeColor, EYE_COLORS.map(w => [w.id, title(w.id)] as const), v => { draft.appearance.eyeColor = v; })}
      {@render choice('hairColor', 'Hair color', draft.appearance.hair.color, HAIR_COLORS.map(w => [w.id, title(w.id)] as const), v => { draft.appearance.hair.color = v; })}
      {@render choice('hairLength', 'Hair length', draft.appearance.hair.length, HAIR_LENGTHS.map(w => [w.id, title(w.id)] as const), v => { draft.appearance.hair.length = v; })}
      {@render choice('hairTexture', 'Hair texture', draft.appearance.hair.texture, HAIR_TEXTURES.map(w => [w.id, title(w.id)] as const), v => { draft.appearance.hair.texture = v; })}
      {@render choice('hairStyle', 'Hair style', draft.appearance.hair.style, HAIR_STYLES.map(w => [w.id, title(w.id)] as const), v => { draft.appearance.hair.style = v; })}
      {@render choice('faceShape', 'Face shape', draft.appearance.face.shape, FACE_SHAPES.map(w => [w.id, title(w.id)] as const), v => { draft.appearance.face.shape = v; })}
      <fieldset aria-describedby={errors.faceFeatures ? 'cc-error-faceFeatures' : undefined}>
        <legend>Face features (up to 2)</legend>
        {#each FACE_FEATURES as f}
          <label class="inline"><input type="checkbox" checked={draft.appearance.face.features.includes(f.id)} onchange={e => toggleFeature(f.id, e.currentTarget.checked)} /> {title(f.id)}</label>
        {/each}
      </fieldset>
      {@render fieldError('faceFeatures')}
      {@render choice('outfit', 'Outfit', draft.appearance.outfit, [['role_default', 'Role default'], ...OUTFITS.map(o => [o.id, title(o.phrase)] as const)], v => { draft.appearance.outfit = v; })}
      <label class="inline"><input type="checkbox" checked={draft.appearance.measurements !== null}
        onchange={e => { draft.appearance.measurements = e.currentTarget.checked ? { chestCm: '', waistCm: '', hipsCm: '' } : null; }} /> Record measurements</label>
      {#if draft.appearance.measurements}
        {@const m = draft.appearance.measurements}
        {#each MEASUREMENTS as [key, label]}
          {@render text(key, label, m[key], v => { m[key] = v; draft = draft; }, 'numeric')}
        {/each}
      {/if}
    {:else if TABS[tab] === 'Traits'}
      <p>Traits are 0 to 100. Decimals are allowed.</p>
      {#each AXES as [key, label]}
        {@render text(key, label, draft.traits[key], v => { draft.traits[key] = v; }, 'decimal')}
        {#if !errors[key]}<p class="band">{axisBand(key, Number(draft.traits[key]))?.short ?? 'neither high nor low'}</p>{/if}
      {/each}
      {#if !errors.age}
        <details>
          <summary>Private (adult)</summary>
          <p>Optional. Shown only in the collapsed Private section of the profile.</p>
          <label class="inline"><input type="checkbox" checked={draft.traits.intimacyKnowledge !== null}
            onchange={e => { draft.traits.intimacyKnowledge = e.currentTarget.checked ? '' : null; }} /> Record Intimacy Knowledge</label>
          {#if draft.traits.intimacyKnowledge !== null}
            {@render text('intimacyKnowledge', 'Intimacy Knowledge', draft.traits.intimacyKnowledge, v => { draft.traits.intimacyKnowledge = v; }, 'decimal')}
          {/if}
          <label for="cc-intimateHistory">Intimate history</label>
          <select id="cc-intimateHistory" bind:value={draft.intimateHistory}>
            <option value={null}>Not recorded</option><option value="none">None</option><option value="some">Some</option>
          </select>
          {@render fieldError('intimateHistory')}
        </details>
      {/if}
    {:else}
      {#if preview}
        <div data-testid="creation-preview">
          <p><strong>{describeShort(preview)}</strong></p>
          <p>{describeLong(preview)}</p>
        </div>
      {:else}
        <div role="alert">
          <p>Fix these fields before Create character:</p>
          <ul>{#each summary as line}<li>{line}</li>{/each}</ul>
        </div>
      {/if}
    {/if}
  </div>

  <div class="actions">
    <button disabled={tab === 0} onclick={() => { tab -= 1; }}>Back</button>
    {#if tab < TABS.length - 1}<button onclick={() => { tab += 1; }}>Next</button>
    {:else}<button disabled={!valid || created} onclick={create}>Create character</button>{/if}
    <button onclick={oncancel}>Cancel</button>
  </div>
</section>

<style>
  [role='tablist'] { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
  [role='tab'] { background: var(--bg-tertiary); color: var(--text-main); }
  [role='tab'][aria-selected='true'] { background: var(--accent-green); color: #000; }
  label { display: block; margin: 12px 0 4px; } label.inline { display: flex; gap: 8px; align-items: center; }
  input, select, textarea, button { font: inherit; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); }
  input[type='text'], select, textarea { color: var(--text-main); background: var(--bg-tertiary); max-width: 100%; } textarea { width: 100%; }
  fieldset { border: 1px solid var(--border-color); border-radius: 6px; margin: 12px 0 0; } details { margin: 16px 0; }
  button { background: var(--accent-green); color: #000; cursor: pointer; margin: 4px 4px 4px 0; } button:disabled { opacity: .5; cursor: default; }
  .field-error { color: var(--accent-red); margin: 4px 0; } .band { color: var(--text-muted); margin: 4px 0; }
  /* Valid names may be 64 characters with no spaces; they must wrap, not overflow the card. */
  [data-testid='creation-preview'] { overflow-wrap: anywhere; }
  .actions { margin-top: 16px; } :focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
  [role='alert'] { padding: 12px; border-left: 3px solid var(--accent-red); }
</style>
