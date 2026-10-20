import '../src/app.css';
import { mount } from 'svelte';
import App from '../src/App.svelte';
import { errorLog } from '../src/error-log.js';

errorLog.initialize('r1');
window.addEventListener('error', event => {
  if (event instanceof ErrorEvent) errorLog.record('RUNTIME', 'UNCAUGHT_ERROR');
});
window.addEventListener('unhandledrejection', () => errorLog.record('RUNTIME', 'UNHANDLED_REJECTION'));
window.addEventListener('pagehide', () => errorLog.flush());

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
