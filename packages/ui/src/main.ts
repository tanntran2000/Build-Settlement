import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import WeeklyManagement from './WeeklyManagement.svelte';
import { errorLog } from './error-log.js';

const mode = new URLSearchParams(window.location.search).get('mode') === 'weekly' ? 'weekly' : 'r1';
errorLog.initialize(mode);
window.addEventListener('error', event => {
  if (event instanceof ErrorEvent) errorLog.record('RUNTIME', 'UNCAUGHT_ERROR');
});
window.addEventListener('unhandledrejection', () => errorLog.record('RUNTIME', 'UNHANDLED_REJECTION'));
window.addEventListener('pagehide', () => errorLog.flush());

const app = mount(mode === 'weekly' ? WeeklyManagement : App, {
  target: document.getElementById('app')!,
});

export default app;
