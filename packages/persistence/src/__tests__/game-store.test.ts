import { createMemoryGameStore } from '../memory-store.js';
import { runGameStoreSuite } from './game-store-suite.js';
runGameStoreSuite('memory', createMemoryGameStore);
