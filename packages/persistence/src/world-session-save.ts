import { cityEconomyRuleset, GOODS_STOCK_RULESET, SOCIETY_RULESET } from '@haven/core';
import { hasWeeklyKeys, isWorldSessionState, outsideProvenance, WORLD_SESSION_CITY_RULESET, type WorldSessionState } from '@haven/core';
import { TILE_SAVE_MAX_BYTES } from './tile-trial-save.js';

export const WORLD_SESSION_SAVE_FORMAT = 'haven.world-session.save';
export type WorldSaveFailure = { success: false; error: { code: 'INVALID_SAVE' | 'INCOMPATIBLE_SAVE' | 'INVALID_SAVE_STATE' | 'SAVE_TOO_LARGE' | 'SAVE_FAILED'; message: string } };
const fail = (code: WorldSaveFailure['error']['code'], message: string): WorldSaveFailure => ({ success: false, error: { code, message } });
const tooLarge = (text: string) => text.length > TILE_SAVE_MAX_BYTES || new TextEncoder().encode(text).byteLength > TILE_SAVE_MAX_BYTES;

// The save boundary accepts data, not active property reads or JSON callbacks.
// Capture nested descriptors first, then validate and encode only this detached tree.
export function captureSaveData(raw: unknown): unknown {
  const ancestors = new WeakSet<object>();
  function copy(value: unknown): unknown {
    if (value === null || ['string', 'boolean', 'number'].includes(typeof value)) return value;
    if (typeof value !== 'object' || !value || ancestors.has(value)) throw Error('Invalid save data.');
    const array = Array.isArray(value), prototype = Object.getPrototypeOf(value);
    if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) throw Error('Invalid save data.');
    const descriptors = Object.getOwnPropertyDescriptors(value);
    ancestors.add(value);
    try {
      if (array) {
        const length = descriptors.length?.value;
        if (!Number.isSafeInteger(length) || length < 0 || Reflect.ownKeys(descriptors).length !== length + 1) throw Error('Invalid save array.');
        const result: unknown[] = [];
        for (let i = 0; i < length; i++) {
          const entry = descriptors[String(i)];
          if (!entry?.enumerable || !('value' in entry)) throw Error('Invalid save array.');
          result.push(copy(entry.value));
        }
        return result;
      }
      const result: Record<string, unknown> = Object.create(null);
      for (const key of Reflect.ownKeys(descriptors)) {
        if (typeof key !== 'string') throw Error('Invalid save field.');
        const entry = descriptors[key];
        if (!entry.enumerable || !('value' in entry)) throw Error('Invalid save field.');
        result[key] = copy(entry.value);
      }
      return result;
    } finally { ancestors.delete(value); }
  }
  try { return copy(raw); } catch { return undefined; }
}

export function serializeWorldSessionSave(session: unknown): { success: true; text: string } | WorldSaveFailure {
  try {
    const snapshot = captureSaveData(session);
    const city = snapshot && typeof snapshot === 'object' ? Object.getOwnPropertyDescriptor(snapshot, 'city')?.value : undefined;
    if (city && typeof city === 'object' && (!Object.hasOwn(city, 'society') || cityEconomyRuleset(city, WORLD_SESSION_CITY_RULESET) !== SOCIETY_RULESET)) return fail('INCOMPATIBLE_SAVE', 'Unsupported city economy.');
    if (!isWorldSessionState(snapshot)) return fail('INVALID_SAVE_STATE', 'Export requires a valid world session in Planning.');
    const text = JSON.stringify({ format: WORLD_SESSION_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: cityEconomyRuleset(snapshot.city, WORLD_SESSION_CITY_RULESET), state: snapshot });
    if (tooLarge(text)) return fail('SAVE_TOO_LARGE', 'Checkpoint exceeds the 1 MiB limit.');
    return { success: true, text };
  } catch { return fail('SAVE_FAILED', 'Could not export this checkpoint. Your game was preserved.'); }
}

export function deserializeWorldSessionSave(text: unknown): { success: true; state: WorldSessionState } | WorldSaveFailure {
  try {
    if (typeof text !== 'string') return fail('INVALID_SAVE', 'Choose a world session checkpoint JSON file.');
    if (tooLarge(text)) return fail('SAVE_TOO_LARGE', 'Checkpoint exceeds the 1 MiB limit.');
    const value: unknown = JSON.parse(text);
    if (!hasWeeklyKeys(value, ['format', 'schemaVersion', 'cityRulesetId', 'state']) || value.format !== WORLD_SESSION_SAVE_FORMAT || value.schemaVersion !== 1 || value.cityRulesetId !== SOCIETY_RULESET) {
      return fail('INCOMPATIBLE_SAVE', 'Unsupported world checkpoint format, version or city ruleset. No migration was performed.');
    }
    const state = value.state;
    const city = state && typeof state === 'object' ? Object.getOwnPropertyDescriptor(state, 'city')?.value : undefined;
    if (city && typeof city === 'object' && (!Object.hasOwn(city, 'society') || cityEconomyRuleset(city, WORLD_SESSION_CITY_RULESET) !== SOCIETY_RULESET)) return fail('INCOMPATIBLE_SAVE', 'Unsupported city economy.');
    const provenance = state && typeof state === 'object' ? outsideProvenance(Object.getOwnPropertyDescriptor(state, 'outside')?.value) : 'malformed';
    if (provenance === 'malformed') return fail('INVALID_SAVE_STATE', 'Checkpoint has malformed outside world provenance.');
    if (provenance === 'unsupported') return fail('INCOMPATIBLE_SAVE', 'Unsupported outside world generator or scenario. No migration was performed.');
    if (!isWorldSessionState(state)) return fail('INVALID_SAVE_STATE', 'Checkpoint must contain a valid complete world session in Planning.');
    if (value.cityRulesetId !== cityEconomyRuleset(state.city, WORLD_SESSION_CITY_RULESET)) return fail('INCOMPATIBLE_SAVE', 'Checkpoint ruleset does not match its city.');
    return { success: true, state };
  } catch { return fail('INVALID_SAVE', 'Could not read a valid checkpoint JSON. Your game was preserved.'); }
}
