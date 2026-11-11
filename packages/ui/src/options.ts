import { writable, type Writable } from 'svelte/store';
export type TextSize = 'normal' | 'large';
export interface GameOptions { textSize: TextSize; reduceMotion: boolean | null; autosave: boolean }
export const OPTIONS_KEY = 'haven.options.v1';
export const DEFAULT_OPTIONS: GameOptions = { textSize: 'normal', reduceMotion: null, autosave: true };
export function parseOptions(raw: string | null): GameOptions {
  try {
    const o = JSON.parse(raw ?? 'null');
    if (!o || Array.isArray(o) || Object.keys(o).sort().join(',') !== 'autosave,reduceMotion,textSize' || !['normal', 'large'].includes(o.textSize) || !(o.reduceMotion === null || typeof o.reduceMotion === 'boolean') || typeof o.autosave !== 'boolean') return { ...DEFAULT_OPTIONS };
    return { textSize: o.textSize, reduceMotion: o.reduceMotion, autosave: o.autosave };
  } catch { return { ...DEFAULT_OPTIONS }; }
}
export function readOptions(): GameOptions { try { return parseOptions(localStorage.getItem(OPTIONS_KEY)); } catch { return { ...DEFAULT_OPTIONS }; } }
export function writeOptions(next: GameOptions): boolean { try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(next)); return true; } catch { return false; } }
export function applyOptions(o: GameOptions, root?: HTMLElement): void {
  const el = root ?? (typeof document === 'undefined' ? undefined : document.documentElement);
  if (!el) return;
  const motion = o.reduceMotion ?? (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  el.setAttribute('data-text-size', o.textSize); el.setAttribute('data-reduce-motion', String(motion));
}
export const options: Writable<GameOptions> = writable(readOptions());
options.subscribe(o => { writeOptions(o); applyOptions(o); });
