import './app.css';
import { mount } from 'svelte';
import WeeklyManagement from './WeeklyManagement.svelte';
import TileManagement from './TileManagement.svelte';
import CharacterLifeApp from './CharacterLifeApp.svelte';
import { LEGACY_TILE_RULESET, POPULATION_TILE_RULESET } from '@haven/core';
import { errorLog } from './error-log.js';

errorLog.initialize('weekly');
window.addEventListener('error', event => {
  if (event instanceof ErrorEvent) errorLog.record('RUNTIME', 'UNCAUGHT_ERROR');
});
window.addEventListener('unhandledrejection', () => errorLog.record('RUNTIME', 'UNHANDLED_REJECTION'));
window.addEventListener('pagehide', () => errorLog.flush());

const mode = new URLSearchParams(window.location.search).get('mode');
const world = mode === 'world' || mode === 'world-npc';
const app = mode === 'world-life'
  ? mount(CharacterLifeApp, { target: document.getElementById('app')! })
  : mode === 'tiles' || mode === 'population' || world
  ? mount(TileManagement, { target: document.getElementById('app')!, props: { ruleset: mode === 'population' || world ? POPULATION_TILE_RULESET : LEGACY_TILE_RULESET, world, npcMode: mode === 'world-npc' } })
  : mount(WeeklyManagement, { target: document.getElementById('app')! });

export default app;
