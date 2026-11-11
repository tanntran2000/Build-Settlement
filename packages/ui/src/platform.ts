export interface Platform { readonly kind: 'web' | 'exe'; quit(): void; setFullscreen(on: boolean): Promise<boolean>; isFullscreen(): boolean }
let quitHandler = () => {};
export function setQuitHandler(fn: () => void): void { quitHandler = fn; }
export const platform: Platform = {
  kind: 'web',
  quit() { quitHandler(); },
  async setFullscreen(on) {
    try {
      if (on) { if (!document.documentElement.requestFullscreen) return false; await document.documentElement.requestFullscreen(); }
      else { if (!document.exitFullscreen) return false; await document.exitFullscreen(); }
      return true;
    } catch { return false; }
  },
  isFullscreen() { return typeof document !== 'undefined' && !!document.fullscreenElement; },
};
