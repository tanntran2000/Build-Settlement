import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const pairs: [string, string, number][] = [
  ['ink', 'parchment', 4.5], ['ink-muted', 'parchment', 4.5],
  ['ink-gain', 'parchment', 4.5], ['ink-loss', 'parchment', 4.5],
  ['oak-text', 'oak', 7], ['wax-text', 'wax', 4.5],
  ['oak', 'wood-dark', 3], ['focus', 'parchment', 3], ['focus', 'wood-dark', 3],
];
function luminance(hex: string): number {
  const channels = hex.match(/../g)!.map(c => parseInt(c, 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
for (const [foreground, background, minimum] of pairs) {
  test(`ledger --${foreground} against --${background} >= ${minimum}`, () => {
    const css = readFileSync(new URL('../ledger-theme.css', import.meta.url), 'utf8');
    const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*#([\da-f]{6})/gi)].map(m => [m[1], m[2]]));
    expect(tokens[foreground]).toBeDefined(); expect(tokens[background]).toBeDefined();
    const values = [luminance(tokens[foreground]), luminance(tokens[background])].sort((a, b) => b - a);
    expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(minimum);
  });
}
