import { afterEach, expect, it, vi } from 'vitest';
import { platform, setQuitHandler } from '../platform.js';
afterEach(() => vi.unstubAllGlobals());
it('handles unavailable fullscreen', async () => { vi.stubGlobal('document', { documentElement: {} }); expect(await platform.setFullscreen(true)).toBe(false); });
it('handles refused fullscreen', async () => { vi.stubGlobal('document', { documentElement: { requestFullscreen: () => Promise.reject(Error('denied')) } }); expect(await platform.setFullscreen(true)).toBe(false); });
it('dispatches quit', () => { const handler = vi.fn(); setQuitHandler(handler); platform.quit(); expect(handler).toHaveBeenCalledOnce(); });
