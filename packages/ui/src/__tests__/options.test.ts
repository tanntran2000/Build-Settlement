import { afterEach, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS, parseOptions, readOptions, writeOptions, applyOptions } from '../options.js';
afterEach(() => vi.unstubAllGlobals());
it.each([null, '{', '[]', '{"textSize":"bad","reduceMotion":null,"autosave":true}', '{"textSize":"normal","reduceMotion":null,"autosave":1}', '{"textSize":"normal","reduceMotion":null,"autosave":true,"extra":1}'])('rejects invalid options %s', raw => expect(parseOptions(raw)).toEqual(DEFAULT_OPTIONS));
it('round trips every valid combination', () => {
  for (const textSize of ['normal', 'large'] as const) for (const reduceMotion of [null, true, false]) for (const autosave of [true, false]) {
    const value = { textSize, reduceMotion, autosave }; expect(parseOptions(JSON.stringify(value))).toEqual(value);
  }
});
it('contains storage failures', () => {
  vi.stubGlobal('localStorage', { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } });
  expect(readOptions()).toEqual(DEFAULT_OPTIONS); expect(writeOptions(DEFAULT_OPTIONS)).toBe(false);
});
it('applies attributes', () => {
  const attrs: Record<string, string> = {};
  const el = { setAttribute(k: string, v: string) { attrs[k] = v; } } as HTMLElement;
  applyOptions({ textSize: 'large', reduceMotion: true, autosave: true }, el);
  expect(attrs).toEqual({ 'data-text-size': 'large', 'data-reduce-motion': 'true' });
});
