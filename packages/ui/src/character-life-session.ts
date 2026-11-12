import { SOCIETY_RULESET, type CharacterLifeSessionState, isCharacterLifeSessionState } from '@haven/core';
import { captureSaveData, deserializeCharacterLifeSave, serializeCharacterLifeSave, createMemoryGameStore, sessionToRecords, recordsToSession, type GameStore, type StoredRecord } from '@haven/persistence';
import { createIndexedDbGameStore } from './indexeddb-store.js';
import { prepareNpcWorldSessionLoad } from './world-npc-session.js';
export const CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY = 'haven.character-life-session-society.checkpoint.v1';
export const OLD_CHECKPOINT_MESSAGE = 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
export function isPlayableCheckpoint(state: CharacterLifeSessionState): boolean { return state.city.society?.rulesetId === SOCIETY_RULESET; }
type Failure = { success: false; message: string };
const fail = (message: string): Failure => ({ success: false,message });
const BLOCKED = 'Could not save in this browser (storage blocked or full). Your game and any earlier local checkpoint were preserved. Use Export checkpoint instead.';
const NONE = 'No local checkpoint in this browser yet. Choose Save locally first.';
const OLD = `Local checkpoint not loaded; it was left unchanged. ${OLD_CHECKPOINT_MESSAGE}`;
const MARKER = 'migration:legacy-local-checkpoint';
export interface CheckpointDeps { store: GameStore; legacy: Pick<Storage,'getItem' | 'removeItem'> | null }
let defaults: CheckpointDeps | undefined;
const warnings = new WeakSet<CheckpointDeps>();
let checkpointQueue: Promise<void> = Promise.resolve();
function enqueueCheckpoint<T>(operation: () => Promise<T>): Promise<T> {
  const pending = checkpointQueue.then(operation);
  checkpointQueue = pending.then(() => undefined,() => undefined);
  return pending;
}
export function createCheckpointDeps(factory: () => GameStore, legacy: CheckpointDeps['legacy']): CheckpointDeps {
  try { return { store: factory(),legacy }; }
  catch { const deps = { store: createMemoryGameStore(),legacy }; warnings.add(deps); return deps; }
}
function defaultDeps(): CheckpointDeps {
  if (defaults) return defaults;
  let legacy: CheckpointDeps['legacy'] = null;
  try { legacy = window.localStorage; } catch { /* Blocked legacy storage. */ }
  defaults = createCheckpointDeps(() => createIndexedDbGameStore(),legacy); return defaults;
}
export function prepareCharacterLifeLoad(live: CharacterLifeSessionState, loaded: unknown, expectedRevision: number): { success: true; next: CharacterLifeSessionState } | Failure {
  try {
    const captured = captureSaveData(loaded);
    if (!isCharacterLifeSessionState(captured)) return fail('Checkpoint must contain a valid complete Character Life session in Planning.');
    const base = prepareNpcWorldSessionLoad(live, { city: captured.city,outside: captured.outside,npcs: captured.npcs },expectedRevision);
    if (!base.success) return base;
    const next = { ...base.next,player: structuredClone(captured.player),profiles: structuredClone(captured.profiles) };
    return isCharacterLifeSessionState(next) ? { success: true,next } : fail('Checkpoint player or profiles do not match its characters.');
  } catch { return fail('Could not prepare the Character Life checkpoint. Your game was preserved.'); }
}
export function saveLocalCharacterLife(session: unknown, deps?: CheckpointDeps): Promise<{ success: true; replaced: boolean } | Failure> {
  // Capture the invocation's state before waiting behind earlier storage work.
  const result = serializeCharacterLifeSave(session);
  return enqueueCheckpoint(async () => {
  if (!result.success) return fail(result.error.message);
  const d = deps ?? defaultDeps();
  try { const replaced = (await d.store.read('main')) !== null; await d.store.replaceSlot('main',sessionToRecords('main',JSON.parse(result.text).state)); return { success: true,replaced }; }
  catch { return fail(BLOCKED); }
  });
}
export function readLocalCharacterLife(deps?: CheckpointDeps): Promise<{ success: true; state: CharacterLifeSessionState } | Failure> {
  return enqueueCheckpoint(async () => {
  const d = deps ?? defaultDeps();
  try {
    let marker: StoredRecord | null;
    try { marker = await d.store.getSystem(MARKER); }
    catch (error) { if (deps) throw error; d.store = createMemoryGameStore(); warnings.add(d); marker = null; }
    let records = await d.store.read('main');
    let invalid = false;
    if (!marker) {
      const text = d.legacy?.getItem(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY) ?? null;
      if (text !== null) {
        const loaded = deserializeCharacterLifeSave(text);
        if (loaded.success) records = sessionToRecords('main',loaded.state);
        else {
          // Preserve valid old-ruleset data without making it playable or rewriting its ruleset.
          try { const raw = JSON.parse(text); if (raw.format === 'haven.character-life-session.save' && raw.schemaVersion === 1 && raw.cityRulesetId !== SOCIETY_RULESET && raw.state?.city?.society?.rulesetId === raw.cityRulesetId) records = sessionToRecords('main',raw.state); else invalid = true; } catch { invalid = true; }
        }
      }
      await d.store.replaceSlot('main',records ?? [],[{ slotId: '_',id: MARKER,table: 'system',schemaVersion: 1,value: true }]);
    }
    if (warnings.has(d)) { warnings.delete(d); return fail(BLOCKED); }
    if (invalid) return fail(OLD);
    if (!records) return fail(NONE);
    let state: CharacterLifeSessionState;
    try { state = recordsToSession(records); } catch { return fail(OLD); }
    return isPlayableCheckpoint(state) && isCharacterLifeSessionState(state) ? { success: true,state } : fail(OLD);
  } catch { return fail('Could not read browser storage. Your game was preserved. Use Import checkpoint instead.'); }
  });
}
export function clearFallenCharacterLifeCheckpoint(confirmed: boolean,stage: import('@haven/core').CrisisStage,deps?: CheckpointDeps): Promise<{ success: true } | Failure> {
  return enqueueCheckpoint(async () => {
  if (!confirmed || stage !== 'fallen') return { success: true };
  const d = deps ?? defaultDeps();
  try { await d.store.clear('main'); d.legacy?.removeItem(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY); return { success: true }; }
  catch { return fail('Could not clear the local checkpoint. Browser storage is unavailable.'); }
  });
}
