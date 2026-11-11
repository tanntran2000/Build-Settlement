import { expect, it } from 'vitest';
import { versionLabel } from '../version.js';
it('formats the release label', () => expect(versionLabel('0.1.0', 'Alpha')).toBe('v0.1.0 Alpha'));
