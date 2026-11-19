import { DEFAULT_PLAYER_DRAFT, createCharacterLifeSession } from '@haven/core';
import { describe, expect, it } from 'vitest';

const modules = import.meta.glob<typeof import('../npc-sheet-view.js')>('../npc-sheet-view.ts', { eager: true });

function project() {
  const module = modules['../npc-sheet-view.ts'];
  expect(module, 'NPC sheet projection is required').toBeDefined();
  return module.buildNpcSheetView;
}

function starter() {
  const created = createCharacterLifeSession(12345, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
  if (!created.success) throw Error(created.error.message);
  return created.value.npcs[0];
}

describe('NPC sheet projection', () => {
  it('projects the NPC profile and five skills from life and character data', () => {
    const npc = starter();
    npc.life.origin = 'frontier';
    npc.life.hobbies = ['reading', 'gardening'];
    npc.character.relationshipToPlayer.affection = 73;
    const before = JSON.stringify(npc);
    const { origin, hobbies, affection, skills } = project()(npc);
    expect({ origin, hobbies, affection, skills }).toStrictEqual({
      origin: 'Frontier',
      hobbies: ['Reading', 'Gardening'],
      affection: 73,
      skills: [
        { label: 'Management', score: 40 }, { label: 'Technical', score: 65 },
        { label: 'Medical', score: 15 }, { label: 'Combat', score: 30 }, { label: 'Negotiation', score: 25 },
      ],
    });
    expect(JSON.stringify(npc)).toBe(before);
  });

  it('assigns the exact Stress bands and reads working independently', () => {
    const npc = starter(), build = project();
    for (const [value, band] of [[0, 'Calm'], [49, 'Calm'], [50, 'Tired'], [79, 'Tired'], [80, 'Exhausted'], [100, 'Exhausted']] as const) {
      npc.life.stress = value;
      expect(build(npc).stress).toEqual({ value, band, notWorking: false });
    }
    npc.life.stress = 80;
    npc.life.working = false;
    expect(build(npc).stress).toEqual({ value: 80, band: 'Exhausted', notWorking: true });
  });

  it('assigns the exact Mind bands and meter value', () => {
    const npc = starter(), build = project();
    for (const [value, band] of [[0, 'Light'], [33, 'Light'], [34, 'Balanced'], [50, 'Balanced'], [66, 'Balanced'], [67, 'Dark'], [100, 'Dark']] as const) {
      npc.life.mind = value;
      expect(build(npc).mind).toEqual({ value, band });
    }
  });

  it('keeps the approved Sex-exp part order, labels and level caps', () => {
    const npc = starter();
    npc.life.sexExp.hand = { level: 'novice', exp: 17 };
    npc.life.sexExp.mouth = { level: 'professional', exp: 110 };
    npc.life.sexExp.breast = { level: 'expert', exp: 300 };
    expect(project()(npc).experience).toEqual([
      { label: 'Hand', level: 'Novice', exp: 17, cap: 100 },
      { label: 'Mouth', level: 'Professional', exp: 110, cap: 200 },
      { label: 'Breast', level: 'Expert', exp: 300, cap: 300 },
      { label: 'Vagina', level: 'Novice', exp: 0, cap: 100 },
      { label: 'Ass', level: 'Novice', exp: 0, cap: 100 },
    ]);
  });

  it('groups History counters and keeps the newest twenty in display order', () => {
    const npc = starter(), build = project();
    expect(build(npc).history.recent).toEqual([]);
    npc.life.history = {
      counters: { birthday: 7, 'travel-note': 3, recovered: 4, 'post-assigned': 10, exhausted: 6, 'post-cleared': 2 },
      recent: Array.from({ length: 20 }, (_, index) => ({ week: index + 1, kind: index % 2 ? 'birthday' : 'post-assigned' })),
    };
    const before = JSON.stringify(npc.life.history);
    expect(build(npc).history).toEqual({
      groups: [
        { label: 'Posts', counters: [{ label: 'Post assigned', count: 10 }, { label: 'Post cleared', count: 2 }] },
        { label: 'Wellbeing', counters: [{ label: 'Exhausted', count: 6 }, { label: 'Recovered', count: 4 }] },
        { label: 'Milestones', counters: [{ label: 'Birthday', count: 7 }] },
        { label: 'Other', counters: [{ label: 'Travel note', count: 3 }] },
      ],
      recent: Array.from({ length: 20 }, (_, index) => ({ week: 20 - index, label: index % 2 ? 'Post assigned' : 'Birthday' })),
    });
    expect(JSON.stringify(npc.life.history)).toBe(before);
  });
});
