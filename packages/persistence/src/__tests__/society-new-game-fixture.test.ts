import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createSocietyState, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../index.js';

it('pins the society new-game tile save bytes', () => {
 const state = createSocietyState();
 const bytes = readFileSync(new URL('./fixtures/society-v2/new-game.json', import.meta.url), 'utf8');
 const expected = JSON.parse(bytes) as { state: unknown };
 expect(state).toEqual(expected.state);
 const encoded = ({ success: true, text: JSON.stringify({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-society-02', state }) });
 expect(encoded.success).toBe(true);
 if (!encoded.success) throw Error('Export failed');
 expect(encoded.text).toBe(bytes);
});

it('pins the society new-game Character Life save bytes', () => {
 const created = createCharacterLifeSession(20261028, { ...DEFAULT_PLAYER_DRAFT, currentName: 'Synthetic Keeper' });
 expect(created.success).toBe(true);
 if (!created.success) throw Error('Factory failed');
 const encoded = serializeCharacterLifeSave(created.value);
 expect(encoded.success).toBe(true);
 if (!encoded.success) throw Error('Export failed');
 const bytes = readFileSync(new URL('./fixtures/society-v2/life-new-game.json', import.meta.url), 'utf8');
 expect(encoded.text).toBe(bytes);
});

it('round-trips the pinned v2 Character Life checkpoint',()=>{
 const bytes=readFileSync(new URL('./fixtures/society-v2/life-new-game.json',import.meta.url),'utf8');
 const decoded=deserializeCharacterLifeSave(bytes);expect(decoded.success).toBe(true);
 if(!decoded.success)throw Error(decoded.error.message);
 expect(serializeCharacterLifeSave(decoded.state)).toEqual({success:true,text:bytes});
});
