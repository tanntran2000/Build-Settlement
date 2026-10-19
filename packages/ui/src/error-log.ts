import { writable } from 'svelte/store';
import { version as appVersion } from '../package.json';

export const ERROR_LOG_KEY = 'haven.runtime-errors.v1';
const MAX_BYTES = 8192;
const CATALOG = {
  INVALID_WORKFORCE_INPUT: ['validation', 'Enter a valid workforce amount and try again.'],
  INVALID_COMMAND: ['validation', 'The action input was rejected. Check the form and try again.'],
  WEEK_MISMATCH: ['validation', 'The planning week changed. Review the current week before retrying.'],
  NO_ACTIVE_SETTLEMENT: ['validation', 'No active settlement is available for End Week.'],
  FORBIDDEN: ['validation', 'This action is not permitted for the current settlement.'],
  COMMAND_NOT_YET_IMPLEMENTED: ['validation', 'This action is not available in this version.'],
  INVALID_STATE: ['command_failure', 'The current game state failed validation. Download this log for review.'],
  OVERFLOW: ['command_failure', 'The action was rejected because a value exceeded the supported numeric range.'],
  INVARIANT_VIOLATION: ['command_failure', 'The action result failed validation. Download this log for review.'],
  UNKNOWN_COMMAND_FAILURE: ['command_failure', 'The action failed with an unrecognized error code. Download this log for review.'],
  EXECUTION_ERROR: ['exception', 'The simulation could not complete the action. Download this log for review.'],
  UNEXPECTED_ACTION_ERROR: ['exception', 'The action handler encountered an unexpected error. Download this log for review.'],
  UNCAUGHT_ERROR: ['exception', 'An unexpected runtime error occurred. Download this log for review.'],
  UNHANDLED_REJECTION: ['exception', 'An asynchronous operation failed unexpectedly. Download this log for review.'],
} as const;
type Mode = 'weekly' | 'r1';
type Action = 'END_WEEK' | 'ADVANCE_DAY' | 'RUNTIME';
type Code = keyof typeof CATALOG;
type Clock = Readonly<{ week: number }> | Readonly<{ day: number; week: number; year: number }>;
export type ErrorEntry = Readonly<{
  timestampUtc: string; lastSeenUtc: string; occurrences: number; appVersion: string; buildId: null;
  mode: Mode; clock: Clock | null; action: Action; kind: typeof CATALOG[Code][0]; code: Code; message: string;
}>;
type LogState = { entries: readonly ErrorEntry[]; persistence: 'ready' | 'saved' | 'pending' | 'ram-only'; discarded: boolean; download: '' | 'requested' | 'failed' };
const entryKeys = ['timestampUtc', 'lastSeenUtc', 'occurrences', 'appVersion', 'buildId', 'mode', 'clock', 'action', 'kind', 'code', 'message'];
const positive = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;
const knownCode = (value: unknown): value is Code => typeof value === 'string' && Object.hasOwn(CATALOG, value);
function exact(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return (proto === Object.prototype || proto === null) && Reflect.ownKeys(value).length === keys.length && keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor?.enumerable && Object.hasOwn(descriptor, 'value');
  });
}
function clockFor(mode: Mode, value: unknown): Clock | null {
  try {
    if (mode === 'weekly' && exact(value, ['week']) && positive(value.week)) return Object.freeze({ week: value.week });
    if (mode === 'r1' && exact(value, ['day', 'week', 'year']) && positive(value.day) && positive(value.week) && positive(value.year) &&
        value.week === Math.floor((value.day - 1) / 7) + 1 && value.year === Math.floor((value.day - 1) / 365) + 1) {
      return Object.freeze({ day: value.day, week: value.week, year: value.year });
    }
  } catch { /* Untrusted clock access never reaches the diagnostic record. */ }
  return null;
}
function utc(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 32 && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
function load(text: string): readonly ErrorEntry[] {
  if (text.length > MAX_BYTES || new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('Invalid log size');
  const data: unknown = JSON.parse(text);
  if (!exact(data, ['schemaVersion', 'entries']) || data.schemaVersion !== 1 || !Array.isArray(data.entries) || data.entries.length > 5) throw new Error('Invalid envelope');
  return Object.freeze(data.entries.map((item: unknown): ErrorEntry => {
    if (!exact(item, entryKeys) || !knownCode(item.code) || !utc(item.timestampUtc) || !utc(item.lastSeenUtc) || !positive(item.occurrences) ||
        typeof item.appVersion !== 'string' || item.appVersion.length > 64 || !/^\d{1,6}\.\d{1,6}\.\d{1,6}(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?$/.test(item.appVersion) ||
        item.buildId !== null || (item.mode !== 'weekly' && item.mode !== 'r1') ||
        (item.action !== 'RUNTIME' && item.action !== (item.mode === 'weekly' ? 'END_WEEK' : 'ADVANCE_DAY')) ||
        item.kind !== CATALOG[item.code][0] || item.message !== CATALOG[item.code][1]) throw new Error('Invalid entry');
    const clock = clockFor(item.mode, item.clock);
    if (item.clock !== null && clock === null) throw new Error('Invalid clock');
    return Object.freeze({ timestampUtc: item.timestampUtc, lastSeenUtc: item.lastSeenUtc, occurrences: item.occurrences,
      appVersion: item.appVersion, buildId: null, mode: item.mode, clock,
      action: item.action === 'RUNTIME' ? 'RUNTIME' : item.mode === 'weekly' ? 'END_WEEK' : 'ADVANCE_DAY',
      kind: CATALOG[item.code][0], code: item.code, message: CATALOG[item.code][1] });
  }));
}

export function createErrorLog() {
  let state: LogState = { entries: Object.freeze([]), persistence: 'ready', discarded: false, download: '' };
  const store = writable<LogState>(state);
  let context: { mode: Mode; clock: Clock | null } = { mode: 'r1', clock: null };
  let initialized = false;
  let storage: Storage | null = null;
  let dirty = false;
  let lastWrite: number | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const publish = () => store.set({ ...state });
  function ramOnly() {
    storage = null; dirty = false;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined; state.persistence = 'ram-only'; publish();
  }
  function serialize() {
    const text = JSON.stringify({ schemaVersion: 1, entries: state.entries });
    if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('Log exceeds size limit');
    return text;
  }
  function flush() {
    try {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      if (!storage || !dirty) return;
      storage.setItem(ERROR_LOG_KEY, serialize());
      dirty = false; lastWrite = Date.now(); state.persistence = 'saved'; publish();
    } catch { try { ramOnly(); } catch { /* Diagnostic failures never escape into gameplay. */ } }
  }
  return {
    subscribe: store.subscribe,
    initialize(mode: Mode) {
      try {
        context = { mode, clock: null };
        if (initialized) return;
        initialized = true;
        try { storage = window.localStorage; } catch { ramOnly(); return; }
        let text: string | null;
        try { text = storage.getItem(ERROR_LOG_KEY); } catch { ramOnly(); return; }
        if (text !== null) {
          try { state.entries = load(text); state.persistence = 'saved'; }
          catch {
            state.entries = Object.freeze([]); state.discarded = true;
            try { storage.removeItem(ERROR_LOG_KEY); } catch { ramOnly(); }
          }
        }
        publish();
      } catch { try { ramOnly(); } catch { /* No recursive logging. */ } }
    },
    setContext(mode: Mode, clock: unknown) {
      try { if (mode === 'weekly' || mode === 'r1') context = { mode, clock: clockFor(mode, clock) }; } catch { /* Context is optional. */ }
    },
    record(action: Action, rawCode: unknown): string {
      const code: Code = knownCode(rawCode) ? rawCode : 'UNKNOWN_COMMAND_FAILURE';
      const [kind, message] = CATALOG[code];
      try {
        if (action !== 'RUNTIME' && action !== (context.mode === 'weekly' ? 'END_WEEK' : 'ADVANCE_DAY')) return message;
        const now = new Date().toISOString();
        if (!utc(now)) return message;
        const last = state.entries.at(-1);
        const same = last && last.mode === context.mode && last.action === action && last.code === code && last.appVersion === appVersion && JSON.stringify(last.clock) === JSON.stringify(context.clock);
        const entry: ErrorEntry = Object.freeze(same ? { ...last, lastSeenUtc: now, occurrences: last.occurrences < Number.MAX_SAFE_INTEGER ? last.occurrences + 1 : last.occurrences } : {
          timestampUtc: now, lastSeenUtc: now, occurrences: 1, appVersion, buildId: null, ...context, action, kind, code, message,
        });
        state.entries = Object.freeze([...(same ? state.entries.slice(0, -1) : state.entries.slice(-4)), entry]);
        state.download = '';
        if (!storage) { state.persistence = 'ram-only'; publish(); return message; }
        dirty = true; state.persistence = 'pending'; publish();
        const elapsed = lastWrite === null ? 1000 : Math.max(0, Date.now() - lastWrite);
        if (elapsed >= 1000) flush();
        else if (timer === undefined) timer = setTimeout(flush, 1000 - elapsed);
      } catch { try { ramOnly(); } catch { /* Never replace a gameplay error with a logger error. */ } }
      return message;
    },
    flush,
    download() {
      let url: string | undefined; let anchor: HTMLAnchorElement | undefined;
      try {
        if (state.entries.length === 0) return;
        flush();
        const blob = new Blob([serialize()], { type: 'application/json' });
        url = URL.createObjectURL(blob);
        anchor = document.createElement('a'); anchor.href = url; anchor.download = 'haven-error-log.json';
        document.body.append(anchor); anchor.click(); state.download = 'requested';
      } catch { state.download = 'failed'; }
      finally {
        try { anchor?.remove(); } catch { state.download = 'failed'; }
        try { if (url !== undefined) URL.revokeObjectURL(url); } catch { state.download = 'failed'; }
        try { publish(); } catch { /* Export status cannot interrupt gameplay. */ }
      }
    },
  };
}
export const errorLog = createErrorLog();
