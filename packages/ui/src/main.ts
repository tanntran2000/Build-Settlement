import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import WeeklyManagement from './WeeklyManagement.svelte';

const app = mount(new URLSearchParams(window.location.search).get('mode') === 'weekly' ? WeeklyManagement : App, {
  target: document.getElementById('app')!,
});

export default app;
