import { SOCIETY_RULESET, type CharacterLifeSessionState, isCharacterLifeSessionState } from '@haven/core';
import { captureSaveData, deserializeCharacterLifeSave, serializeCharacterLifeSave, createMemoryGameStore, sessionToRecords, recordsToSession, savedCityRuleset, savedSessionWeek, upgradeV14Session, V14_RULESET, type GameStore, type StoredRecord } from '@haven/persistence';
import { createIndexedDbGameStore } from './indexeddb-store.js';
import { prepareNpcWorldSessionLoad } from './world-npc-session.js';
export const CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY = 'haven.character-life-session-society.checkpoint.v1';
export const OLD_CHECKPOINT_MESSAGE = 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
export const DAMAGED_CHECKPOINT_MESSAGE = 'This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved.';
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
const volatileStores = new WeakSet<CheckpointDeps>();
let checkpointQueue: Promise<void> = Promise.resolve();
function enqueueCheckpoint<T>(operation: () => Promise<T>): Promise<T> {
  const pending = checkpointQueue.then(operation);
  checkpointQueue = pending.then(() => undefined,() => undefined);
  return pending;
}
export function createCheckpointDeps(factory: () => GameStore, legacy: CheckpointDeps['legacy']): CheckpointDeps {
  try { return { store: factory(),legacy }; }
  catch { const deps = { store: createMemoryGameStore({ allowExistingOnMigration }),legacy }; markVolatile(deps); return deps; }
}
function markVolatile(deps: CheckpointDeps): void {
  volatileStores.add(deps);
  warnings.add(deps);
}
function defaultDeps(): CheckpointDeps {
  if (defaults) return defaults;
  // Resolve browser storage on use: a blocked getter must not become a cached absence.
  const legacy: NonNullable<CheckpointDeps['legacy']> = {
    getItem(key) { return window.localStorage.getItem(key); },
    removeItem(key) { window.localStorage.removeItem(key); }
  };
  defaults = createCheckpointDeps(() => createIndexedDbGameStore(undefined, allowExistingOnMigration),legacy); return defaults;
}
export function prepareCharacterLifeLoad(live: CharacterLifeSessionState, loaded: unknown, expectedRevision: number): { success: true; next: CharacterLifeSessionState } | Failure {
  try {
    const snapshot = captureSaveData(loaded);
    const captured = savedCityRuleset(snapshot) === V14_RULESET ? upgradeV14Session(snapshot, savedSessionWeek(snapshot)) : snapshot;
    if (!isCharacterLifeSessionState(captured)) return fail('Checkpoint must contain a valid complete Character Life session in Planning.');
    const base = prepareNpcWorldSessionLoad(live, { city: captured.city,outside: captured.outside,npcs: captured.npcs },expectedRevision);
    if (!base.success) return base;
    const next = { ...base.next,player: structuredClone(captured.player),profiles: structuredClone(captured.profiles) };
    return isCharacterLifeSessionState(next) ? { success: true,next } : fail('Checkpoint player or profiles do not match its characters.');
  } catch { return fail('Could not prepare the Character Life checkpoint. Your game was preserved.'); }
}
export function saveLocalCharacterLife(session: unknown, deps?: CheckpointDeps): Promise<{ success: true; replaced: boolean; volatile?: true } | Failure> {
  // Capture the invocation's state before waiting behind earlier storage work.
  const result = serializeCharacterLifeSave(session);
  return enqueueCheckpoint(async () => {
  if (!result.success) return fail(result.error.message);
  const d = deps ?? defaultDeps();
  try {
    const replaced = (await d.store.read('main')) !== null;
    await d.store.replaceSlot('main',sessionToRecords('main',JSON.parse(result.text).state));
    // An injected store's save confirms that store accepted the snapshot.
    // Browser callers also need to know whether their default store persists.
    return !deps && volatileStores.has(d) ? { success: true,replaced,volatile: true } : { success: true,replaced };
  }
  catch { return fail(BLOCKED); }
  });
}
function identifiesV14(rows: StoredRecord[]): boolean {
  return rows.some(({ value }) => {
    if (!value || typeof value !== 'object') return false;
    return Object.getOwnPropertyDescriptor(value, 'rulesetId')?.value === V14_RULESET ||
      savedCityRuleset({ city: value }) === V14_RULESET;
  });
}

function readStoredCheckpoint(rows: StoredRecord[]): { success: true; state: CharacterLifeSessionState } | Failure {
  try {
    const state = recordsToSession(rows);
    if (!isPlayableCheckpoint(state)) return fail(OLD);
    if (isCharacterLifeSessionState(state)) return { success: true, state };
  } catch { /* Classify the failure from the surviving version fields. */ }
  return fail(identifiesV14(rows) ? OLD : DAMAGED_CHECKPOINT_MESSAGE);
}

function allowExistingOnMigration(rows: StoredRecord[]): boolean {
  return !identifiesV14(rows) && readStoredCheckpoint(rows).success;
}

export function readLocalCharacterLife(deps?: CheckpointDeps): Promise<{ success: true; state: CharacterLifeSessionState; warning?: string } | Failure> {
  return enqueueCheckpoint(async () => {
  const d = deps ?? defaultDeps();
  try {
    let marker: StoredRecord | null;
    try { marker = await d.store.getSystem(MARKER); }
    catch (error) { if (deps) throw error; d.store = createMemoryGameStore({ allowExistingOnMigration }); markVolatile(d); marker = null; }
    const records = await d.store.read('main');
    let loaded = records ? readStoredCheckpoint(records) : fail(NONE);
    if (!marker && (!records || (loaded.success && !identifiesV14(records)))) {
      let candidate: StoredRecord[] | null = null;
      let invalid = false;
      // A save made while migration was blocked is newer than the legacy backup.
      if (!records) {
        if (!d.legacy) return fail('Could not read browser storage. Your game was preserved. Use Import checkpoint instead.');
        const text = d.legacy.getItem(CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY);
        if (text !== null) {
          let raw;
          try { raw = JSON.parse(text); } catch { /* The legacy reader handles invalid JSON. */ }
          const loaded = deserializeCharacterLifeSave(text);
          if (raw?.cityRulesetId === V14_RULESET || savedCityRuleset(raw?.state) === V14_RULESET) {
            if (!loaded.success) return fail(OLD);
            return warnings.delete(d) ? { ...loaded, warning: BLOCKED } : loaded;
          }
          if (loaded.success) candidate = sessionToRecords('main',loaded.state);
          // Preserve valid old-ruleset data without making it playable or rewriting its ruleset.
          else if (raw?.format === 'haven.character-life-session.save' && raw.schemaVersion === 1 &&
              raw.cityRulesetId !== SOCIETY_RULESET && savedCityRuleset(raw.state) === raw.cityRulesetId && raw.state?.city?.society) {
            try { candidate = sessionToRecords('main',raw.state); } catch { invalid = true; }
          } else invalid = true;
        }
      }
      // Recheck within the transaction. A different tab may have filled the slot since the read.
      const migrated = await d.store.migrateSlot('main',candidate,{ slotId: '_',id: MARKER,table: 'system',schemaVersion: 1,value: true });
      loaded = migrated ? readStoredCheckpoint(migrated) : fail(invalid ? OLD : NONE);
    }
    return warnings.delete(d) ? fail(BLOCKED) : loaded;
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
