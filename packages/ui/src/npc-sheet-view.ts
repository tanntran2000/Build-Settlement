import { NPC_HOBBIES, NPC_ORIGINS, P7A_TRIAL, REQUIRED_SKILLS, type SexPart, type WorldNpc } from '@haven/core';

const partLabels = {
  hand: 'Hand', mouth: 'Mouth', breast: 'Breast', vagina: 'Vagina', ass: 'Ass',
} as const satisfies Record<SexPart, string>;
const parts = Object.keys(partLabels) as SexPart[];
const levelLabels = { novice: 'Novice', professional: 'Professional', expert: 'Expert' } as const;

const eventLabels = {
  'post-assigned': 'Post assigned', 'post-cleared': 'Post cleared',
  exhausted: 'Exhausted', recovered: 'Recovered', birthday: 'Birthday',
} as const;
const groups = [
  { label: 'Posts', kinds: ['post-assigned', 'post-cleared'] },
  { label: 'Wellbeing', kinds: ['exhausted', 'recovered'] },
  { label: 'Milestones', kinds: ['birthday'] },
] as const;

function title(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function eventLabel(kind: string): string {
  return Object.hasOwn(eventLabels, kind)
    ? eventLabels[kind as keyof typeof eventLabels]
    : title(kind.replaceAll('-', ' '));
}

function historyView({ counters, recent }: WorldNpc['life']['history']) {
  const counter = (kind: string) => ({
    label: eventLabel(kind),
    count: Object.hasOwn(counters, kind) ? counters[kind] : 0,
  });
  const categories: { label: string; counters: ReturnType<typeof counter>[] }[] =
    groups.map(({ label, kinds }) => ({ label, counters: kinds.map(counter) }));
  const other = Object.keys(counters).filter(kind => !Object.hasOwn(eventLabels, kind)).sort();
  if (other.length) categories.push({ label: 'Other', counters: other.map(counter) });
  return {
    groups: categories,
    recent: recent.slice(-P7A_TRIAL.recentCap).reverse().map(({ week, kind }) => ({ week, label: eventLabel(kind) })),
  };
}

export function buildNpcSheetView({ character, life }: WorldNpc) {
  return {
    origin: NPC_ORIGINS[life.origin].name,
    hobbies: life.hobbies.map(id => NPC_HOBBIES[id].name),
    affection: character.relationshipToPlayer.affection,
    skills: REQUIRED_SKILLS.map(key => ({ label: title(key), score: character.skills[key] })),
    stress: {
      value: life.stress,
      band: life.stress < 50 ? 'Calm' : life.stress < 80 ? 'Tired' : 'Exhausted',
      notWorking: !life.working,
    },
    mind: { value: life.mind, band: life.mind <= 33 ? 'Light' : life.mind <= 66 ? 'Balanced' : 'Dark' },
    lust: life.lust,
    arousal: life.arousal,
    beauty: life.beauty,
    experience: parts.map(part => {
      const { level, exp } = life.sexExp[part];
      return { label: partLabels[part], level: levelLabels[level], exp, cap: P7A_TRIAL.sexExpCaps[level] };
    }),
    history: historyView(life.history),
  };
}
