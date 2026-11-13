/// <reference types="vite/client" />
import './app.css';
import { mount } from 'svelte';
import CharacterLifeApp from './CharacterLifeApp.svelte';
import { errorLog } from './error-log.js';

const inspectorMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get('mode') === 'data-inspector';
let app;
if (inspectorMode) {
  if (import.meta.env.DEV) {
    const { default: DataInspector } = await import('./DataInspector.svelte');
    mount(DataInspector, { target: document.getElementById('app')! });
  }
} else {
  errorLog.initialize('weekly');
  window.addEventListener('error', event => {
    if (event instanceof ErrorEvent) errorLog.record('RUNTIME', 'UNCAUGHT_ERROR');
  });
  window.addEventListener('unhandledrejection', () => errorLog.record('RUNTIME', 'UNHANDLED_REJECTION'));
  window.addEventListener('pagehide', () => errorLog.flush());
  app = mount(CharacterLifeApp, { target: document.getElementById('app')! });
}

export default app;
