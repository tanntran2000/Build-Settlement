import { isNpcWorldSessionState, isWorldNpcList, type NpcWorldSessionState } from '@haven/core';
import { captureSaveData } from '@haven/persistence';
import { prepareWorldSessionLoad } from './world-session.js';

type Failure = { success: false; message: string };
const fail = (message: string): Failure => ({ success: false, message });

// One detached capture feeds city, outside and npcs, so all three come from the same validated data.
export function prepareNpcWorldSessionLoad(live: NpcWorldSessionState, loaded: unknown, expectedRevision: number): { success: true; next: NpcWorldSessionState } | Failure {
  try {
    const captured = captureSaveData(loaded);
    if (!isNpcWorldSessionState(captured)) return fail('Checkpoint must contain a valid complete NPC world session in Planning.');
    const prepared = prepareWorldSessionLoad({ city: live.city, outside: live.outside }, { city: captured.city, outside: captured.outside }, expectedRevision);
    if (!prepared.success) return prepared;
    const npcs = structuredClone(captured.npcs);
    return isWorldNpcList(npcs, prepared.next.city) ? { success: true, next: { ...prepared.next, npcs } } : fail('Checkpoint NPC posts do not match its city.');
  } catch { return fail('Could not prepare the NPC world checkpoint. Your game was preserved.'); }
}

