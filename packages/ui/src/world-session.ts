import { isWorldSessionState, WORLD_SESSION_CITY_RULESET, type WorldSessionState } from '@haven/core';
import { executeTileTrialCommand } from '@haven/simulation';

type Failure = { success: false; message: string };
const fail = (message: string): Failure => ({ success: false, message });

// Prepare accepts an already decoded session, without imposing an encoding size cap.
// Keep this capture local: codec round-tripping can reject valid compact JSON at its cap.
function captureLoadedSession(raw: unknown): WorldSessionState | null {
  const ancestors = new WeakSet<object>();
  function copy(value: unknown): unknown {
    if (value === null || ['string', 'boolean', 'number'].includes(typeof value)) return value;
    if (typeof value !== 'object' || !value || ancestors.has(value)) throw Error('Invalid loaded data.');
    const array = Array.isArray(value), prototype = Object.getPrototypeOf(value);
    if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) throw Error('Invalid loaded data.');
    const descriptors = Object.getOwnPropertyDescriptors(value);
    ancestors.add(value);
    try {
      if (array) {
        const length = descriptors.length?.value;
        if (!Number.isSafeInteger(length) || length < 0 || Reflect.ownKeys(descriptors).length !== length + 1) throw Error('Invalid loaded array.');
        const result: unknown[] = [];
        for (let i = 0; i < length; i++) {
          const entry = descriptors[String(i)];
          if (!entry?.enumerable || !('value' in entry)) throw Error('Invalid loaded array.');
          result.push(copy(entry.value));
        }
        return result;
      }
      const result: Record<string, unknown> = Object.create(null);
      for (const key of Reflect.ownKeys(descriptors)) {
        if (typeof key !== 'string') throw Error('Invalid loaded field.');
        const entry = descriptors[key];
        if (!entry.enumerable || !('value' in entry)) throw Error('Invalid loaded field.');
        result[key] = copy(entry.value);
      }
      return result;
    } finally { ancestors.delete(value); }
  }
  try { const snapshot = copy(raw); return isWorldSessionState(snapshot) ? snapshot : null; } catch { return null; }
}

export function prepareWorldSessionLoad(live: WorldSessionState, loaded: unknown, expectedRevision: number): { success: true; next: WorldSessionState } | Failure {
  try {
    const captured = captureLoadedSession(loaded);
    if (!captured) return fail('Checkpoint must contain a valid complete world session in Planning.');
    const result = executeTileTrialCommand(live.city, { type: 'LOAD_TRIAL', expectedRevision, snapshot: captured.city }, WORLD_SESSION_CITY_RULESET);
    return result.success ? { success: true, next: { city: result.nextState, outside: captured.outside } } : fail(result.error.message);
  } catch { return fail('Could not prepare the world checkpoint. Your game was preserved.'); }
}

