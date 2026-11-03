import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createSocietyState, createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../index.js';

it('pins the society new-game tile save bytes', () => {
 const state = createSocietyState();
 const bytes = readFileSync(new URL('./fixtures/society-v3/new-game.json', import.meta.url), 'utf8');
 const expected = JSON.parse(bytes) as { state: unknown };
 expect(state).toEqual(expected.state);
 const encoded = ({ success: true, text: JSON.stringify({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-society-03', state }) });
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
 const bytes = readFileSync(new URL('./fixtures/society-v3/life-new-game.json', import.meta.url), 'utf8');
 expect(encoded.text).toBe(bytes);
});

it('round-trips the pinned v3 Character Life checkpoint',()=>{
 const bytes=readFileSync(new URL('./fixtures/society-v3/life-new-game.json',import.meta.url),'utf8');
 const decoded=deserializeCharacterLifeSave(bytes);expect(decoded.success).toBe(true);
 if(!decoded.success)throw Error(decoded.error.message);
 expect(serializeCharacterLifeSave(decoded.state)).toEqual({success:true,text:bytes});
});

it.each(['high','negative','fractional','missing score','extra score','missing research','unknown completed'])('refuses edited v3 %s without changing the checkpoint', kind => {
 const bytes = readFileSync(new URL('./fixtures/society-v3/life-new-game.json',import.meta.url),'utf8');
 const envelope = JSON.parse(bytes), society = envelope.state.city.society;
 if (kind === 'high') society.order.security = 101;
 if (kind === 'negative') society.order.security = -1;
 if (kind === 'fractional') society.order.security = 1.5;
 if (kind === 'missing score') delete society.order.security;
 if (kind === 'extra score') society.order.extra = 0;
 if (kind === 'missing research') delete society.research.progressMilli['watch-patrols'];
 if (kind === 'unknown completed') society.research.completed = ['unknown'];
 const edited = JSON.stringify(envelope), before = structuredClone(envelope);
 expect(() => deserializeCharacterLifeSave(edited)).not.toThrow();
 expect(deserializeCharacterLifeSave(edited)).toMatchObject({success:false,error:{code:'INVALID_SAVE_STATE'}});
 expect(envelope).toEqual(before);
 expect(deserializeCharacterLifeSave(bytes).success).toBe(true);
});
