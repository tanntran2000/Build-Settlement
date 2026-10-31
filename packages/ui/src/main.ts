import './app.css';
import { mount } from 'svelte';
import CharacterLifeApp from './CharacterLifeApp.svelte';
import { errorLog } from './error-log.js';

errorLog.initialize('weekly');
window.addEventListener('error', event => {
  if (event instanceof ErrorEvent) errorLog.record('RUNTIME', 'UNCAUGHT_ERROR');
});
window.addEventListener('unhandledrejection', () => errorLog.record('RUNTIME', 'UNHANDLED_REJECTION'));
window.addEventListener('pagehide', () => errorLog.flush());

const app = mount(CharacterLifeApp, { target: document.getElementById('app')! });

export default app;
