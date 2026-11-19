import { P7A_TRIAL, type NpcLife, type TileTrialReport, type WorldNpc } from '@haven/core';

export type NpcLifeWeekReport = NonNullable<TileTrialReport['npcLife']>;
type EventKind = 'post-assigned' | 'post-cleared' | 'exhausted' | 'recovered' | 'birthday';

// Callers own this life object: the weekly step clones input, and command results
// already detach NPC records before recording a successful post transition.
export function recordNpcLifeEvent(life: NpcLife, week: number, kind: EventKind): void {
  const previous = Object.hasOwn(life.history.counters, kind) ? life.history.counters[kind] : 0;
  const count = previous + 1;
  if (!Number.isSafeInteger(count)) throw Error('NPC history counter overflow.');
  life.history.counters = { ...life.history.counters, [kind]: count };
  life.history.recent = [...life.history.recent, { week, kind }].slice(-P7A_TRIAL.recentCap);
}

export function runNpcLifeWeek(npcs: WorldNpc[], input: { week: number; authority: number }): { npcs: WorldNpc[]; report: NpcLifeWeekReport } {
  const next = structuredClone(npcs);
  const report: NpcLifeWeekReport = { exhausted: [], recovered: [], birthdays: [] };
  for (const npc of next) {
    const life = npc.life, wasWorking = life.working;
    const halved = input.authority >= P7A_TRIAL.stressHalveAuthority &&
      npc.character.relationshipToPlayer.affection >= P7A_TRIAL.stressHalveAffection;
    const work = halved ? Math.floor(P7A_TRIAL.stressWork / 2) : P7A_TRIAL.stressWork;
    life.stress = Math.max(0, Math.min(100, life.stress + (npc.postTileId === null ? -P7A_TRIAL.stressRest : work)));
    if (life.stress === 100) life.working = false;
    else if (!life.working && life.stress <= P7A_TRIAL.stressResume) life.working = true;
    life.arousal = Math.max(0, Math.min(100, life.arousal + Math.floor(life.lust / P7A_TRIAL.arousalDivisor)));
    if (wasWorking && !life.working) {
      report.exhausted.push(npc.character.id);
      recordNpcLifeEvent(life, input.week, 'exhausted');
    } else if (!wasWorking && life.working) {
      report.recovered.push(npc.character.id);
      recordNpcLifeEvent(life, input.week, 'recovered');
    }
    if ((input.week - life.birthWeek) % P7A_TRIAL.weeksPerYear === 0) {
      report.birthdays.push(npc.character.id);
      recordNpcLifeEvent(life, input.week, 'birthday');
    }
  }
  return { npcs: next, report };
}
