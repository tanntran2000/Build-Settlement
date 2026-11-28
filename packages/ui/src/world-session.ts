import { isWorldSessionState, type WorldSessionState } from '@haven/core';
import { captureSaveData, savedCityRuleset, upgradeV14WorldSession, V14_RULESET } from '@haven/persistence';
import { executeTileTrialCommand } from '@haven/simulation';

type Failure = { success: false; message: string };
const fail = (message: string): Failure => ({ success: false, message });

export function prepareWorldSessionLoad(live: WorldSessionState, loaded: unknown, expectedRevision: number): { success: true; next: WorldSessionState } | Failure {
  try {
    const snapshot = captureSaveData(loaded);
    const captured = savedCityRuleset(snapshot) === V14_RULESET ? upgradeV14WorldSession(snapshot) : snapshot;
    if (!isWorldSessionState(captured)) return fail('Checkpoint must contain a valid complete world session in Planning.');
    const result = executeTileTrialCommand(live.city, { type: 'LOAD_TRIAL', expectedRevision, snapshot: captured.city });
    return result.success ? { success: true, next: { city: result.nextState, outside: captured.outside } } : fail(result.error.message);
  } catch { return fail('Could not prepare the world checkpoint. Your game was preserved.'); }
}
