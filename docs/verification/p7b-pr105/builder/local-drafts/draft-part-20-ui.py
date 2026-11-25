p = 'packages/ui/src/npc-sheet-view.ts'
edit(p, 'NPC_HOBBIES, NPC_ORIGINS, P7A_TRIAL, REQUIRED_SKILLS, type SexPart', 'NPC_HOBBIES, NPC_ORIGINS, P7A_TRIAL, P7B_TRIAL, REQUIRED_SKILLS, TRIAL_BUILDINGS, type SexPart', 'Data-driven household stats and human-readable home')
edit(p, 'function historyView(', '''const startingPast = [
  ...parts.map(part => ({ key: 'sex.' + part + '.outsider', label: partLabels[part] + ' · Outsider encounters' })),
  { key: 'partners.outsider', label: 'Outsider partners' },
  { key: 'brothel.customers', label: 'Brothel customers' },
  { key: 'act.threesome', label: 'Threesome' },
  { key: 'act.withNpc', label: 'With another NPC' },
];
const pastKeys = new Set(startingPast.map(row => row.key));

function historyView(''', 'Preserve the numeric starting past with a labeled group')
edit(p, '''  const other = Object.keys(counters).filter(kind => !Object.hasOwn(eventLabels, kind)).sort();''', '''  const knownPast = startingPast.filter(row => Object.hasOwn(counters, row.key));
  if (knownPast.length) categories.push({
    label: 'Starting past', counters: knownPast.map(({ key, label }) => ({ label, count: counters[key] })),
  });
  const other = Object.keys(counters).filter(kind => !Object.hasOwn(eventLabels, kind) && !pastKeys.has(kind)).sort();''', 'Keep Other exact for unrelated history counters')
edit(p, '''export function buildNpcSheetView({ character, life }: WorldNpc) {
  return {''', '''export function buildNpcSheetView({ character, life, household }: WorldNpc) {
  const { quadrantSplit } = P7B_TRIAL.household;
  const affection = character.relationshipToPlayer.affection;
  const obedient = household.obedience >= quadrantSplit;
  const quadrant = affection >= quadrantSplit
    ? (obedient ? 'Devoted' : 'Willful lover')
    : (obedient ? 'Submissive out of fear' : 'Rebellious');
  const homeType = household.home === 'estate-1' ? 'mansion' : 'retainers-hall';
  const will = ({ id, strength }: { id: string; strength: number }) => ({
    label: title(id.replaceAll('-', ' ')), strength,
  });
  return {
    household: {
      status: { slave: 'Slave', servant: 'Servant', lifelong: 'Lifelong' }[household.status],
      home: TRIAL_BUILDINGS[homeType].name + ' (' + household.home + ')',
      contract: household.contract && { weeksLeft: household.contract.weeksLeft, wageMilli: household.contract.wageMilli },
      obedience: household.obedience, quadrant,
      preference: will(household.will.preference), flaw: will(household.will.flaw),
    },''', 'Project display-only household fields without exposing source, counters or timestamps')
edit(p, '    affection: character.relationshipToPlayer.affection,', '    affection,', 'Use the same affection for display and quadrant')

p = 'packages/ui/src/NpcSheet.svelte'
edit(p, "  import { formatLifeWeek }", "  import { formatMilli } from './milli-format.js';\n  import { formatLifeWeek }", 'Display the weekly wage in Gold')
edit(p, '    description: Snippet;', '    description: Snippet;\n    notice?: Snippet;', 'Render notice controls inside the sheet')
edit(p, 'let { npc, description }:', 'let { npc, description, notice }:', 'Receive notice controls from the command-owning parent')
edit(p, '''  <div class="tabs" role="tablist"''', '''  {#if notice}{@render notice()}{/if}
  <div class="tabs" role="tablist"''', 'Keep notices visible on every sheet tab')
edit(p, '''            <div><dt>Affection</dt><dd>{sheet.affection}</dd></div>''', '''            <div><dt>Affection</dt><dd>{sheet.affection}</dd></div>
            <div><dt>Status</dt><dd>{sheet.household.status}</dd></div>
            <div><dt>Home</dt><dd>{sheet.household.home}</dd></div>
            {#if sheet.household.contract}
              <div><dt>Weeks left</dt><dd>{sheet.household.contract.weeksLeft}</dd></div>
              <div><dt>Weekly wage</dt><dd>{formatMilli(sheet.household.contract.wageMilli)} Gold</dd></div>
            {/if}
            <div><dt>Obedience</dt><dd>{sheet.household.obedience} · {sheet.household.quadrant}</dd></div>
            <div><dt>Preference</dt><dd>{sheet.household.preference.label} · {sheet.household.preference.strength}</dd></div>
            <div><dt>Flaw</dt><dd>{sheet.household.flaw.label} · {sheet.household.flaw.strength}</dd></div>''', 'Add accessible text rows and no wage for slaves or lifelong servants')

p = 'packages/ui/src/CharacterProfile.svelte'
edit(p, '  export let inventory: Snippet | undefined = undefined;', '  export let inventory: Snippet | undefined = undefined;\n  export let notice: Snippet | undefined = undefined;', 'Pass the existing command-owner’s notice controls down to the NPC sheet')
edit(p, '<NpcSheet {npc} age={c.age} {description} />', '<NpcSheet {npc} age={c.age} {description} {notice} />', 'Wire the single NPC sheet call site')

p = 'packages/ui/src/HouseholdNotice.svelte'
new(p, """<script lang="ts">
  import { tick } from 'svelte';
  import type { TileTrialState, WorldNpc } from '@haven/core';
  import { departureReason } from './acquisition-view.js';

  let { city, npc, locked, onanswer, onanswered }: {
    city: TileTrialState; npc: WorldNpc; locked: boolean;
    onanswer: (choice: string) => boolean; onanswered: () => void;
  } = $props();
  const id = $props.id();
  const notice = $derived(npc.household.notice);
  const choices = $derived(notice === 'renewal'
    ? [{ value: 'renew', label: 'Renew contract' }, { value: 'release', label: 'Let her go' }]
    : [{ value: 'accept', label: 'Accept lifelong service' }, { value: 'decline', label: 'Decline lifelong service' }]);
  const phaseReason = $derived(locked ? 'Plan next week to answer notices.' : '');
  const releaseReason = $derived(departureReason(city, npc, false, false));

  async function answer(choice: string, reason: string) {
    if (reason || !onanswer(choice)) return;
    await tick();
    onanswered();
  }
</script>

{#if notice}
  <div role="group" aria-label={'Notice for ' + npc.character.name} class="notice" data-household-notice={notice}>
    <p><strong>{notice === 'renewal' ? 'Renewal notice' : 'Lifelong service offer'}</strong></p>
    {#if notice === 'renewal' && releaseReason}
      <p>If she leaves at End Week, she takes equipped gear that cannot be stored together.</p>
    {/if}
    {#each choices as choice (choice.value)}
      {@const reason = phaseReason || (choice.value === 'release' ? releaseReason : '')}
      <button type="button" data-notice-choice={choice.value} aria-disabled={!!reason}
        aria-describedby={reason ? id + '-' + choice.value : undefined}
        onclick={() => void answer(choice.value, reason)}>{choice.label}</button>
      {#if reason}<p id={id + '-' + choice.value}>{reason}</p>{/if}
    {/each}
  </div>
{/if}

<style>
  .notice { min-width: 0; overflow-wrap: anywhere; }
  button { max-width: 100%; min-height: 44px; margin: 4px 4px 4px 0; font: inherit; white-space: normal; }
  button[aria-disabled='true'] { opacity: .65; }
  button:focus-visible { outline: 3px solid var(--accent-blue); outline-offset: 3px; }
</style>
""", 'Reuse the same keyboard-accessible buttons and disabled reasons in roster, sheet, and Homes')

p = 'packages/ui/src/CharacterLifeCharacters.svelte'
edit(p, "  import EquipmentView from './EquipmentView.svelte';", "  import EquipmentView from './EquipmentView.svelte';\n  import HouseholdNotice from './HouseholdNotice.svelte';", 'Mount notices in the roster and sheet')
edit(p, "role: 'Leader of Haven' },", "role: 'Leader of Haven', npc: null },", 'Carry the NPC when projecting roster notices')
edit(p, 'role: postLabel(npc.postTileId) })),', 'role: postLabel(npc.postTileId), npc })),', 'Carry the NPC when projecting roster notices')
edit(p, '''  let playerButton: HTMLButtonElement;''', '''  let playerButton: HTMLButtonElement;
  const rosterButtons: Record<string, HTMLButtonElement> = {};
  let noticeError: { npcId: string; message: string } | null = null;
  $: if (selectedIndex === -1) selectedCharacterId = PLAYER_CHARACTER_ID;

  function answer(npcId: string, choice: string): boolean {
    const result = executeCharacterLifeCommand(session, {
      type: 'ANSWER_NOTICE', expectedRevision: session.city.revision, npcId, choice,
    });
    noticeError = result.success ? null : { npcId, message: result.error.message };
    if (!result.success) return false;
    if (choice === 'release' && selectedCharacterId === npcId) selectedCharacterId = PLAYER_CHARACTER_ID;
    onapply(result.next);
    return true;
  }''', 'Route notice actions through the existing character command bridge and handle a removed selection')
edit(p, '''      <button data-testid={\`character-\${person.id}\`} aria-pressed={selectedCharacterId === person.id}
        onclick={() => { selectedCharacterId = person.id; }}>{person.name} · {person.role}</button>'''.replace('\\$', '$').replace('\\x60','\x60').replace('\\' + chr(96), chr(96)), '''      <div class="roster-entry">
        <button bind:this={rosterButtons[person.id]} data-testid={\`character-\${person.id}\`} aria-pressed={selectedCharacterId === person.id}
          onclick={() => { selectedCharacterId = person.id; }}>{person.name} · {person.role}</button>
        {#if person.npc?.household.notice}
          <HouseholdNotice city={session.city} npc={person.npc} {locked}
            onanswer={choice => answer(person.id, choice)} onanswered={() => (rosterButtons[person.id] ?? playerButton).focus()} />
          {#if noticeError?.npcId === person.id}<p role="alert">{noticeError.message}</p>{/if}
        {/if}
      </div>'''.replace('\\$', '$').replace('\\' + chr(96), chr(96)), 'Roster badge and both actions with stable focus after the badge or resident disappears')
edit(p, '''      {#snippet inventory()}''', '''      {#snippet notice()}
        {#if npc?.household.notice}
          {@const id = npc.character.id}
          <HouseholdNotice city={session.city} {npc} {locked}
            onanswer={choice => answer(id, choice)} onanswered={() => (rosterButtons[id] ?? playerButton).focus()} />
        {/if}
      {/snippet}
      {#snippet inventory()}''', 'Sheet uses identical choices and inactive reasons')
edit(p, 'section, header, .roster {', 'section, header, .roster, .roster-entry {', 'Long labels wrap at existing narrow widths')

p = 'packages/ui/src/CharacterLifeCity.svelte'
edit(p, "  import InsideCity from './InsideCity.svelte';", "  import InsideCity from './InsideCity.svelte';\n  import HouseholdNotice from './HouseholdNotice.svelte';", 'Fulfill spec §7 in the Home residents panel too')
edit(p, '''                    <strong>{resident.character.name}</strong>''', '''                    <strong>{resident.character.name}</strong>
                    {#if resident.household.notice}
                      <HouseholdNotice city={state} npc={resident} {locked}
                        onanswer={choice => oncommand('ANSWER_NOTICE', { npcId: id, choice })}
                        onanswered={focusManage} />
                    {/if}''', 'Homes command bridge, keyboard path and focus restoration')
edit(p, "{#if managementError?.action === 'MOVE_NPC_HOME'}", "{#if managementError?.action === 'MOVE_NPC_HOME' || managementError?.action === 'ANSWER_NOTICE'}", 'Show exact notice refusal in the Homes panel')

p = 'packages/ui/src/TileManagement.svelte'
edit(p, "  let report: Readonly<TileTrialReport> | null = null;", "  let report: Readonly<TileTrialReport> | null = null;\n  let reportNpcs: WorldNpc[] = [];", 'Remember names from the reported week when an NPC leaves')
edit(p, "'NOT_A_SLAVE', 'STORAGE_FULL'];", "'NOT_A_SLAVE', 'STORAGE_FULL', 'NOTICE_MISSING', 'NOTICE_CHOICE'];", 'Treat notice refusals as normal gameplay errors')
edit(p, "'SELL_NPC', 'RELEASE_NPC'].includes(type)", "'SELL_NPC', 'RELEASE_NPC', 'ANSWER_NOTICE'].includes(type)", 'Send Home notice errors to its inline alert')
edit(p, '''    ({ city: state, outside, npcs, player, profiles } = result.next);
    if (result.report) report = result.report;''', '''    if (result.report) {
      report = result.report;
      reportNpcs = report.npcLife ? npcs ?? [] : [];
    }
    ({ city: state, outside, npcs, player, profiles } = result.next);''', 'Read report names from the opening roster even when a leaver exhausted or had a birthday')
edit(p, '<SoloWeekReport {report} npcs={npcs ?? []}', '<SoloWeekReport {report} npcs={reportNpcs}', 'Keep the visible report names stable through NEXT_WEEK and later releases')

p = 'packages/simulation/src/character-life-observation.ts'
edit(p, "        ...(session.npcs.length ? ['RELEASE_NPC'] as const : [])],", """        ...(session.npcs.length ? ['RELEASE_NPC'] as const : []),
        ...(session.npcs.some(npc => npc.household.notice !== null) ? ['ANSWER_NOTICE'] as const : [])],""", 'Advertise the new action in Planning only when a notice exists')

p = 'packages/ui/src/report-letters.ts'
edit(p, """    })),
  ];
}

export function npcLifeReportRows(""", """    })),
    ...(household.wagesPaidMilli ? [{ kind: 'wagesPaidMilli', label: 'Wages paid', value: formatMilli(household.wagesPaidMilli) + ' Gold' }] : []),
    ...household.unpaid.map(value => ({ kind: 'unpaid', label: 'Wage unpaid', value })),
    ...household.notices.map(value => ({ kind: 'notices', label: 'Contract notice', value })),
    ...household.left.map(value => ({ kind: 'left', label: 'Left', value })),
  ];
}

export function npcLifeReportRows(""", 'Display B4 household report rows only when nonempty')

p = 'tests/e2e/character-life-navigation.helpers.ts'
edit(p, """      } else if (kind === 'bought' || kind === 'sold' || kind === 'released') {
        const labels = { bought: 'Recruited', sold: 'Sold', released: 'Released' };""", """      } else if (kind === 'wagesPaidMilli') {
        const match = /^([\d,.]+) Gold$/.exec(value);
        if (!match) throw Error('Invalid household wage row.');
        await expect(row).toHaveText('Wages paid · ' + value);
        household.wagesPaidMilli = milli(match[1]);
      } else if (kind === 'bought' || kind === 'sold' || kind === 'released' || kind === 'left' || kind === 'unpaid' || kind === 'notices') {
        const labels = { bought: 'Recruited', sold: 'Sold', released: 'Released', left: 'Left', unpaid: 'Wage unpaid', notices: 'Contract notice' };""", 'Reconstruct all B4 fields while keeping the complete equality test')
edit(p, "[data-acquisition-panel] [role=\"tab\"], [data-household-kind]')].map", "[data-acquisition-panel] [role=\"tab\"], [data-household-kind], [data-household-notice], [data-notice-choice]')].map", 'Capture notice controls and disabled reasons in rejection parity snapshots')

