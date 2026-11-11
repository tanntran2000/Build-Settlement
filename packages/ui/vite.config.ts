import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify((await import('./package.json')).default.version),
    __BUILD_SHA__: await (async () => {
      try { return JSON.stringify((await import('node:child_process')).execSync('git rev-parse --short HEAD').toString().trim()); }
      catch { return JSON.stringify('unknown'); }
    })(),
  },
  server: {
    port: 3000,
  },
});
