import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { createErrorLog, ERROR_LOG_KEY } from '../error-log.js';

const instant = '2026-10-19T10:00:00.000Z';
const secret = 'TOKEN-secret https://private.invalid/?token=secret#save <script>save-payload</script>';
let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn> };
function setup() {
  const log = createErrorLog(); log.initialize('weekly'); log.setContext('weekly', { week: 1 }); return log;
}
function entry() {
  return { timestampUtc: instant, lastSeenUtc: instant, occurrences: 1, appVersion: '0.1.0', buildId: null, mode: 'weekly', clock: { week: 1 }, action: 'END_WEEK', kind: 'validation', code: 'INVALID_WORKFORCE_INPUT', message: 'Enter a valid workforce amount and try again.' };
}
function loaded(value: unknown) { values.set(ERROR_LOG_KEY, JSON.stringify(value)); return setup(); }

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(instant); values = new Map([['unrelated-save', secret]]);
  storage = { getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => values.set(key, value)), removeItem: vi.fn((key: string) => values.delete(key)) };
  vi.stubGlobal('window', { localStorage: storage });
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('safe diagnostic records', () => {
  it('records only the fixed catalog and a cloned pre-action clock, never a payload', () => {
    const log = setup(); const clock = { day: 8, week: 2, year: 1 }; log.setContext('r1', clock);
    const poison = { toString() { throw new Error(secret); }, get message() { throw new Error(secret); } };
    expect(() => log.record('ADVANCE_DAY', poison)).not.toThrow(); clock.day = 100;
    expect(get(log).entries[0]).toMatchObject({ mode: 'r1', clock: { day: 8, week: 2, year: 1 }, action: 'ADVANCE_DAY', kind: 'command_failure', code: 'UNKNOWN_COMMAND_FAILURE', appVersion: '0.1.0', buildId: null, occurrences: 1 });
    expect(JSON.stringify(get(log))).not.toContain('TOKEN');
    expect(values.get('unrelated-save')).toBe(secret);
  });
  it.each([
    ['INVALID_COMMAND', 'validation'], ['WEEK_MISMATCH', 'validation'], ['NO_ACTIVE_SETTLEMENT', 'validation'], ['FORBIDDEN', 'validation'], ['COMMAND_NOT_YET_IMPLEMENTED', 'validation'],
    ['INVALID_STATE', 'command_failure'], ['OVERFLOW', 'command_failure'], ['INVARIANT_VIOLATION', 'command_failure'], ['EXECUTION_ERROR', 'exception'], ['UNEXPECTED_ACTION_ERROR', 'exception'], ['UNCAUGHT_ERROR', 'exception'], ['UNHANDLED_REJECTION', 'exception'],
  ])('normalizes %s to %s', (code, kind) => {
    const log = setup(); log.record('END_WEEK', code); expect(get(log).entries[0]).toMatchObject({ code, kind });
  });
  it('keeps the last five adjacent groups, with A-B-A separate and safe counters', () => {
    const log = setup();
    for (const code of ['INVALID_COMMAND', 'OVERFLOW', 'INVALID_COMMAND', 'INVALID_STATE', 'EXECUTION_ERROR', 'FORBIDDEN']) log.record('END_WEEK', code);
    expect(get(log).entries.map(e => e.code)).toEqual(['OVERFLOW', 'INVALID_COMMAND', 'INVALID_STATE', 'EXECUTION_ERROR', 'FORBIDDEN']);
    const max = { ...entry(), occurrences: Number.MAX_SAFE_INTEGER };
    const capped = loaded({ schemaVersion: 1, entries: [max] }); capped.record('END_WEEK', 'INVALID_WORKFORCE_INPUT');
    expect(get(capped).entries[0].occurrences).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('updates RAM immediately and throttles 10000 events to first plus trailing storage writes', () => {
    const log = setup();
    for (let i = 0; i < 10000; i++) log.record('END_WEEK', 'INVALID_COMMAND');
    expect(get(log).entries).toHaveLength(1); expect(get(log).entries[0].occurrences).toBe(10000);
    expect(storage.setItem).toHaveBeenCalledTimes(1); expect(get(log).persistence).toBe('pending');
    vi.advanceTimersByTime(1000);
    expect(storage.setItem).toHaveBeenCalledTimes(2); expect(get(log).persistence).toBe('saved');
    expect(new TextEncoder().encode(values.get(ERROR_LOG_KEY)!).length).toBeLessThanOrEqual(8192);
  });
  it('dedupes only identical adjacent mode/clock/action/code/version and records latest UTC', () => {
    const log = setup(); log.record('END_WEEK', 'INVALID_COMMAND'); vi.advanceTimersByTime(50); log.record('END_WEEK', 'INVALID_COMMAND');
    expect(get(log).entries[0]).toMatchObject({ timestampUtc: instant, lastSeenUtc: '2026-10-19T10:00:00.050Z', occurrences: 2 });
    log.setContext('weekly', { week: 2 }); log.record('END_WEEK', 'INVALID_COMMAND');
    log.setContext('r1', { day: 8, week: 2, year: 1 }); log.record('ADVANCE_DAY', 'INVALID_COMMAND');
    expect(get(log).entries).toHaveLength(3);
    expect(get(log).entries.map(e => e.clock)).toEqual([{ week: 1 }, { week: 2 }, { day: 8, week: 2, year: 1 }]);
  });
  it.each([undefined, {}, { week: 0 }, { week: 1, seed: secret }, { week: 1.5 }, { week: Number.MAX_SAFE_INTEGER + 1 }])('uses null for an invalid weekly clock %j', clock => {
    const log = setup(); log.setContext('weekly', clock); log.record('RUNTIME', 'UNCAUGHT_ERROR'); expect(get(log).entries[0].clock).toBeNull();
  });
  it('uses null for inconsistent R1 clocks and contains throwing clock access', () => {
    const log = setup(); log.setContext('r1', { day: 1, week: 2, year: 1 }); log.record('RUNTIME', 'UNCAUGHT_ERROR');
    expect(get(log).entries[0].clock).toBeNull();
    expect(() => log.setContext('weekly', new Proxy({}, { ownKeys() { throw new Error(secret); } }))).not.toThrow();
    log.record('RUNTIME', 'UNCAUGHT_ERROR'); expect(get(log).entries.at(-1)?.clock).toBeNull();
  });
});

describe('bounded storage and corruption boundary', () => {
  it('loads valid records through reload without changing their version or saving game data', () => {
    const log = setup(); log.record('END_WEEK', 'INVALID_WORKFORCE_INPUT');
    const reloaded = setup(); expect(get(reloaded).entries).toEqual(get(log).entries);
    expect(Object.keys(JSON.parse(values.get(ERROR_LOG_KEY)!))).toEqual(['schemaVersion', 'entries']);
    expect(Object.isFrozen(get(reloaded).entries[0])).toBe(true);
  });
  it.each([
    null, [], {}, { schemaVersion: 2, entries: [] }, { schemaVersion: 1, entries: [], save: secret }, { schemaVersion: 1, entries: Array(6).fill(entry()) },
    ...[{ code: secret }, { message: secret }, { kind: 'exception' }, { stack: secret }, { buildId: secret }, { appVersion: secret }, { occurrences: 0 }, { occurrences: 1.5 }, { occurrences: Number.MAX_SAFE_INTEGER + 1 }, { timestampUtc: 'bad' }, { lastSeenUtc: '2026-02-31T00:00:00.000Z' }, { clock: { week: 1, url: secret } }, { mode: 'future' }, { action: 'IMPORT_SAVE' }].map(defect => ({ schemaVersion: 1, entries: [{ ...entry(), ...defect }] })),
  ])('discards corrupt schema %j and removes only its own key', payload => {
    const log = loaded(payload); expect(get(log).entries).toEqual([]); expect(get(log).discarded).toBe(true);
    expect(storage.removeItem).toHaveBeenCalledWith(ERROR_LOG_KEY); expect(values.get('unrelated-save')).toBe(secret);
  });
  it.each(['{not json', ' '.repeat(8193), JSON.stringify({ schemaVersion: 1, entries: [], x: 'é'.repeat(4096) })])('bounds malformed/oversized text before accepting storage', text => {
    values.set(ERROR_LOG_KEY, text); const log = setup(); expect(get(log).entries).toEqual([]); expect(get(log).discarded).toBe(true);
  });
  it.each([' '.repeat(8193), JSON.stringify({ entries: 'é'.repeat(4096) })])('checks oversized string/UTF-8 bytes before JSON.parse', text => {
    values.set(ERROR_LOG_KEY, text); const parse = vi.spyOn(JSON, 'parse'); setup(); expect(parse).not.toHaveBeenCalled();
  });
  it.each(['getter', 'getItem', 'setItem', 'removeItem'])('contains storage %s failures, keeps RAM and never retries', failure => {
    if (failure === 'getter') Object.defineProperty(window, 'localStorage', { get() { throw new Error(secret); } });
    else storage[failure as 'getItem' | 'setItem' | 'removeItem'].mockImplementation(() => { throw new Error(secret); });
    if (failure === 'removeItem') values.set(ERROR_LOG_KEY, '{bad');
    const log = setup();
    expect(() => { for (let i = 0; i < 10000; i++) log.record('END_WEEK', 'INVALID_COMMAND'); log.flush(); vi.advanceTimersByTime(5000); }).not.toThrow();
    expect(get(log).persistence).toBe('ram-only'); expect(get(log).entries[0].occurrences).toBe(10000);
    expect(storage.setItem.mock.calls.length).toBeLessThanOrEqual(1);
    expect(JSON.stringify(get(log))).not.toContain('TOKEN');
  });
});

describe('explicit safe JSON download', () => {
  function browser() {
    const anchor = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal('document', { createElement: vi.fn(() => anchor), body: { append: vi.fn() } });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:synthetic'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    return anchor;
  }
  it('flushes and downloads normalized bounded JSON with fixed filename/MIME, then revokes URL', async () => {
    const anchor = browser(); const log = setup(); log.record('END_WEEK', 'INVALID_COMMAND'); log.record('END_WEEK', 'OVERFLOW');
    log.download(); expect(storage.setItem).toHaveBeenCalledTimes(2); expect(anchor.download).toBe('haven-error-log.json'); expect(anchor.click).toHaveBeenCalledOnce();
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json'); expect(blob.size).toBeLessThanOrEqual(8192);
    const exported = JSON.parse(await blob.text()); expect(exported.entries).toEqual(get(log).entries);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic'); expect(get(log).download).toBe('requested');
  });
  it.each(['Blob', 'URL', 'click'])('contains %s export failure and preserves records without recursive entries', failure => {
    const anchor = browser(); const log = setup(); log.record('END_WEEK', 'INVALID_COMMAND'); const before = get(log).entries;
    if (failure === 'Blob') vi.stubGlobal('Blob', class { constructor() { throw new Error(secret); } });
    else if (failure === 'URL') vi.mocked(URL.createObjectURL).mockImplementation(() => { throw new Error(secret); });
    else anchor.click.mockImplementation(() => { throw new Error(secret); });
    expect(() => log.download()).not.toThrow(); expect(get(log).entries).toEqual(before); expect(get(log).download).toBe('failed');
    expect(JSON.stringify(get(log))).not.toContain('TOKEN'); if (failure === 'click') expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
  });
});
