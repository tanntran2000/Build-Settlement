import type { CharacterLifeSessionState, CharacterProfile, WorldNpc, PlayerCharacter, TileTrialState } from '@haven/core';
import { CHARACTER_LIFE_SAVE_FORMAT } from './character-life-save.js';
import { createSocietyState, isNamedCharacterRecord, isNpcLife, managerSlotTileIds, npcAge, WORLD_TRAITS, GOODS_STOCK_RULESET, hasWeeklyKeys, isCanonicalGameState, isCharacterProfile, isPlayerCharacter, isSocietyState, isTileTrialState, isWorldNpcList, isWorldSessionState, SOCIETY_RULESET } from '@haven/core';
import type { StoredRecord, TableName } from './game-store.js';
import { ITEM_CATALOG, RECIPES, isItemsState, isOpenItemSlot, isWearable, type ItemsState, type ItemInstance } from '@haven/core';
export class StoreRecordError extends Error {
  constructor(public readonly ref: string) { super(`Invalid store record: ${ref}`); this.name = 'StoreRecordError'; }
}
const count = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
const historicalSocietyRuleset = /^tile-society-(0[1-9]|1[01])$/;
const historicalNpcLifeRuleset = /^tile-society-1[01]$/;
// Historical records remain readable for the caller's existing old-ruleset refusal.
// Validate their original shape without migrating or returning a current-ruleset view.
function isStoredCity(raw: unknown): raw is CharacterLifeSessionState['city'] {
  try {
    if (!hasWeeklyKeys(raw, ['world','revision','phase','tiles','happiness','goodsStock','society']) ||
        !raw.society || typeof raw.society !== 'object') return false;
    const ruleset = Object.getOwnPropertyDescriptor(raw.society, 'rulesetId')?.value;
    if (ruleset === SOCIETY_RULESET) return isTileTrialState(raw);
    const version = typeof ruleset === 'string' ? historicalSocietyRuleset.exec(ruleset) : null;
    if (!version || !isCanonicalGameState(raw.world) || !raw.world.activeSettlementId || !count(raw.revision) ||
        !['planning','report'].includes(raw.phase as string) || typeof raw.happiness !== 'number' ||
        !Number.isFinite(raw.happiness) || raw.happiness < 0 || raw.happiness > 100 ||
        !hasWeeklyKeys(raw.goodsStock, ['rulesetId','amountMilli']) || raw.goodsStock.rulesetId !== GOODS_STOCK_RULESET || !count(raw.goodsStock.amountMilli)) return false;
    const v = Number(version[1]);
    const keys = v >= 7
      ? ['rulesetId','standing','laws','crisis','pendingCard','order','classes','satisfaction','desperation','tension','debtPressure','corruption','luxuryStockMilli','training','wallRing','stocksMilli','outside','research']
      : ['rulesetId','classes','satisfaction','desperation','tension','debtPressure','corruption','luxuryStockMilli','training','wallRing'];
    if (v < 7) {
      if (v >= 2) keys.push('stocksMilli','outside','research');
      if (v >= 3) keys.push('order');
      if (v >= 4) keys.push('crisis','pendingCard');
      if (v >= 5) keys.push('standing');
      if (v >= 6) keys.push('laws');
    }
    if (v >= 8) keys.push('items');
    if (!hasWeeklyKeys(raw.society, keys)) return false;
    const defaults = createSocietyState().society!;
    const validation: Record<string, unknown> = { ...defaults, ...raw.society, rulesetId: SOCIETY_RULESET };
    if (v === 2) {
      const research = raw.society.research;
      if (!hasWeeklyKeys(research, ['topic','progressMilli','paid','completed']) || !hasWeeklyKeys(research.progressMilli, ['deep-mining'])) return false;
      validation.research = { ...research, progressMilli: { ...defaults.research.progressMilli, ...research.progressMilli } };
    }
    if (v === 4) {
      const crisis = raw.society.crisis;
      if (!hasWeeklyKeys(crisis, ['stage','weeksInStage','hungerStreak','calmStreak','promise','lastChoice'])) return false;
      validation.crisis = { fallCause: null, ...crisis };
    }
    if (!isSocietyState(validation)) return false;
    const tiles = raw.tiles;
    if (!Array.isArray(tiles) || Object.getPrototypeOf(tiles) !== Array.prototype || Reflect.ownKeys(tiles).length !== tiles.length + 1) return false;
    const ids = new Set<string>();
    for (let i = 0; i < tiles.length; i++) {
      const entry = Object.getOwnPropertyDescriptor(tiles, String(i));
      if (!entry?.enumerable || !('value' in entry)) return false;
      const tile = entry.value;
      if (!hasWeeklyKeys(tile, ['id','terrain','building']) || typeof tile.id !== 'string' || !tile.id.trim() || ids.has(tile.id) || typeof tile.terrain !== 'string' || !tile.terrain.trim()) return false;
      ids.add(tile.id);
      const b = tile.building;
      if (b !== null && (!hasWeeklyKeys(b, ['typeId','level','workers','enabled']) || typeof b.typeId !== 'string' || !b.typeId.trim() || !count(b.level) || b.level < 1 || !count(b.workers) || typeof b.enabled !== 'boolean')) return false;
    }
    return true;
  } catch { return false; }
}
export function sessionToRecords(slotId: string, session: CharacterLifeSessionState): StoredRecord[] {
  const record = (table: TableName, id: string, value: unknown): StoredRecord => ({ slotId,id,table,schemaVersion: 1,value });
  const profile = (id: string) => ({ profile: session.profiles.find(p => p.id === id), profileOrder: session.profiles.findIndex(p => p.id === id) });
  const city = structuredClone(session.city), itemRecords:StoredRecord[]=[];
  if (city.society?.rulesetId === SOCIETY_RULESET) {
    const items=city.society.items;
    const add=(item:ItemInstance,place:string)=>itemRecords.push(record('items',`item:${item.id}`,{defId:item.defId,place}));
    for(const item of items.inventory)add(item,'inventory');
    for(const item of items.consumables)add(item,'consumables');
    for(const {item,expiresWeek} of items.storage)add(item,`storage:${expiresWeek}`);
    for(const [characterId,worn] of Object.entries(items.equipped))for(const [slot,item] of Object.entries(worn))add(item,`equipped:${characterId}:${slot}`);
    for(const [tileId,workshop] of Object.entries(items.workshops??{})){
      workshop.orders.forEach((order,index)=>{for(const item of order.items)add(item,`order:${tileId}:${index}`);order.items=[];});
      workshop.ready.forEach((output,index)=>{if('item' in output){add(output.item,`ready:${tileId}:${index}`);(output as {item:ItemInstance|null}).item=null;}});
    }
    const {inventory,consumables,storage,equipped,...rest}=items;
    // Only this detached storage representation omits the instance collections.
    (city.society as unknown as {items:unknown}).items=rest;
    itemRecords.sort((a,b)=>Number(a.id.slice(5))-Number(b.id.slice(5)));
  }
  return structuredClone([
    record('meta','session',{ saveFormat: CHARACTER_LIFE_SAVE_FORMAT, rulesetId: session.city.society?.rulesetId, revision: session.city.revision, phase: session.city.phase }),
    record('city','city',city),record('world','outside',session.outside),
    record('characters',session.player.character.id,{ kind: 'player', player: session.player, profile: session.player.profile }),
    ...session.npcs.map((npc,order) => record('characters',npc.character.id,{ kind: 'npc',npc,order,...profile(npc.character.id) })),
    ...itemRecords,
  ]);
}
export function recordsToSession(records: StoredRecord[]): CharacterLifeSessionState {
  const bad = (r: StoredRecord): never => { throw new StoreRecordError(`${r.table}:${r.id}`); };
  const seen = new Set<string>();
  for (const r of records) { const k = `${r.table}:${r.id}`; if (r.schemaVersion !== 1 || seen.has(k)) bad(r); seen.add(k); }
  const get = (table: TableName,id: string) => { const r = records.find(r => r.table === table && r.id === id); if (!r || !r.value || typeof r.value !== 'object') throw new StoreRecordError(`${table}:${id}`); return r.value; };
  const meta = get('meta','session');
  if (!hasWeeklyKeys(meta, ['saveFormat','rulesetId','revision','phase']) || meta.saveFormat !== CHARACTER_LIFE_SAVE_FORMAT ||
      typeof meta.rulesetId !== 'string' || !count(meta.revision) || !['planning','report'].includes(meta.phase as string)) throw new StoreRecordError('meta:session');
  const city = structuredClone(get('city','city'));
  const storedSociety=Object.getOwnPropertyDescriptor(city,'society')?.value;
  const storedRuleset=storedSociety&&typeof storedSociety==='object'?Object.getOwnPropertyDescriptor(storedSociety,'rulesetId')?.value:undefined;
  if(typeof storedRuleset==='string'&&storedRuleset!==meta.rulesetId)throw new StoreRecordError('meta:session');
  const itemRows=records.filter(r=>r.table==='items');
  const storedItems = storedSociety && typeof storedSociety === 'object' ? Object.getOwnPropertyDescriptor(storedSociety,'items')?.value : undefined;
  const detachedItems = hasWeeklyKeys(storedItems,['nextItemId','materials','market','goals']) || hasWeeklyKeys(storedItems,['nextItemId','materials','market','goals','workshops']);
  if (meta.rulesetId === SOCIETY_RULESET || (historicalNpcLifeRuleset.test(meta.rulesetId) && detachedItems)) {
    const society=Object.getOwnPropertyDescriptor(city,'society')?.value;
    if(!society||typeof society!=='object'||!detachedItems)throw new StoreRecordError('city:city');
    const rest=storedItems as Record<string, unknown>;
    const items:ItemsState={nextItemId:rest.nextItemId as number,inventory:[],consumables:[],materials:rest.materials as ItemsState['materials'],storage:[],equipped:{},market:rest.market as ItemsState['market'],goals:rest.goals as ItemsState['goals']};
    if(Object.hasOwn(rest,'workshops')){
      const workshops=rest.workshops;
      const dense=(v:unknown):v is unknown[]=>Array.isArray(v)&&Object.getPrototypeOf(v)===Array.prototype&&Reflect.ownKeys(v).length===v.length+1&&Array.from({length:v.length},(_,i)=>Object.getOwnPropertyDescriptor(v,String(i))).every(d=>d?.enumerable&&'value' in d);
      if(!workshops||typeof workshops!=='object'||!hasWeeklyKeys(workshops,Object.keys(workshops)))throw new StoreRecordError('city:city');
      for(const workshop of Object.values(workshops)){
        if(!hasWeeklyKeys(workshop,['orders','ready'])||!dense(workshop.orders)||!dense(workshop.ready))throw new StoreRecordError('city:city');
        for(const order of workshop.orders)if(!hasWeeklyKeys(order,['recipeId','items','materials','feeMilli'])||!dense(order.items)||order.items.length)throw new StoreRecordError('city:city');
        for(const output of workshop.ready)if(!(hasWeeklyKeys(output,['item'])&&output.item===null)&&!hasWeeklyKeys(output,['material','count']))throw new StoreRecordError('city:city');
      }
      // Detached placeholders preserve mixed ready-list indices; only table rows
      // can fill them. The completed live state is validated after all rows land.
      items.workshops=workshops as unknown as ItemsState['workshops'];
    }
    const characterIds=records.filter(r=>r.table==='characters').map(r=>r.id);
    for(const r of [...itemRows].sort((a,b)=>Number(a.id.slice(5))-Number(b.id.slice(5)))){
      const value=r.value;
      if(!/^item:[1-9]\d*$/.test(r.id)||!Number.isSafeInteger(Number(r.id.slice(5)))||!hasWeeklyKeys(value,['defId','place'])||typeof value.defId!=='string'||!Object.hasOwn(ITEM_CATALOG,value.defId)||typeof value.place!=='string')bad(r);
      const v=value as {defId:string;place:string},item={id:Number(r.id.slice(5)),defId:v.defId};
      if(items.workshops&&(item.id>=items.nextItemId||!isWearable(ITEM_CATALOG[item.defId])&&ITEM_CATALOG[item.defId].category!=='consumable'))bad(r);
      if(v.place==='inventory')items.inventory.push(item);
      else if(v.place==='consumables')items.consumables.push(item);
      else if(/^storage:[1-9]\d*$/.test(v.place))items.storage.push({item,expiresWeek:Number(v.place.slice(8))});
      else if(v.place.startsWith('order:')||v.place.startsWith('ready:')){
        const match=/^(order|ready):(.+):(0|[1-9]\d*)$/.exec(v.place);
        if(!match||!Number.isSafeInteger(Number(match[3]))||!items.workshops||!Object.hasOwn(items.workshops,match[2]))bad(r);
        const [,place,tileId,indexText]=match!,index=Number(indexText),workshop=items.workshops![tileId];
        if(place==='order'){
          const order=workshop.orders[index],recipe=order&&Object.hasOwn(RECIPES,order.recipeId)?RECIPES[order.recipeId]:undefined;
          if(!order||order.items.length||!recipe?.inputs.some(i=>i.defId===item.defId&&ITEM_CATALOG[i.defId].category!=='material'))bad(r);
          order.items.push(item);
        }else {
          const output=workshop.ready[index];if(!output||!('item' in output)||output.item!==null)bad(r);
          workshop.ready[index]={item};
        }
      }else {
        const match=/^equipped:(.+):([^:]+)$/.exec(v.place);
        if(!match||!characterIds.includes(match[1])||!isOpenItemSlot(match[2]))bad(r);
        const [,characterId,slot]=match!;
        const worn=Object.hasOwn(items.equipped,characterId)?items.equipped[characterId]:{};
        Object.defineProperty(items.equipped,characterId,{value:worn,enumerable:true,writable:true,configurable:true});
        if(Object.hasOwn(worn,slot))bad(r);
        Object.assign(worn,{[slot]:item});
      }
      if(!items.workshops&&!isItemsState(items,characterIds))bad(r);
    }
    if(!isItemsState(items,characterIds))throw new StoreRecordError('city:city');
    society.items=items;
  } else if(itemRows.length)bad(itemRows[0]);
  if (!isStoredCity(city)) throw new StoreRecordError('city:city');
  if (meta.rulesetId !== city.society?.rulesetId || meta.revision !== city.revision || meta.phase !== city.phase) throw new StoreRecordError('meta:session');
  const outside = get('world','outside');
  if (!isWorldSessionState({ city: createSocietyState(), outside })) throw new StoreRecordError('world:outside');
  let player: PlayerCharacter | undefined;
  const npcs: { npc: WorldNpc; order: number }[] = [], profiles: { profile: CharacterProfile; order: number }[] = [];
  for (const r of records.filter(r => r.table === 'characters')) {
    const v = r.value as { kind: string; player: PlayerCharacter; npc: WorldNpc; order: number; profile: CharacterProfile; profileOrder: number };
    if (!v || !v.profile || v.profile.id !== r.id) bad(r);
    if (v.kind === 'player') { if (player || !isPlayerCharacter(v.player) || v.player.character.id !== r.id || !isCharacterProfile(v.profile,v.player.character)) bad(r); player = v.player; }
    else if (v.kind === 'npc') {
      const candidate = [...npcs.map(n => n.npc), v.npc];
      const validNpcList = meta.rulesetId === SOCIETY_RULESET
        ? isWorldNpcList(candidate, city)
        : historicalSocietyRuleset.test(meta.rulesetId) &&
          isHistoricalNpcList(candidate, city, historicalNpcLifeRuleset.test(meta.rulesetId));
      if (!validNpcList || v.npc.character.id !== r.id || !isCharacterProfile(v.profile, v.npc.character) ||
          !Number.isInteger(v.order) || v.order < 0 || !Number.isInteger(v.profileOrder) || v.profileOrder < 0) bad(r);
      npcs.push({ npc: v.npc, order: v.order });
    }
    else bad(r);
    if (v.kind === 'npc') profiles.push({ profile: v.profile,order: v.profileOrder });
  }
  if (!player) throw new StoreRecordError('characters:player');
  return structuredClone({ city,outside,npcs: npcs.sort((a,b) => a.order-b.order).map(v => v.npc),player,profiles: profiles.sort((a,b) => a.order-b.order).map(v => v.profile) }) as CharacterLifeSessionState;
}

function isHistoricalNpcList(raw: unknown, city: TileTrialState, hasLife: boolean): boolean {
  try {
    if (!Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype ||
        Reflect.ownKeys(raw).length !== raw.length + 1) return false;
    const slots = managerSlotTileIds(city), traitIds = WORLD_TRAITS.map(t => t.id);
    const ids = new Set<string>(), posts = new Set<string>();
    for (let i = 0; i < raw.length; i++) {
      const entry = Object.getOwnPropertyDescriptor(raw, String(i));
      if (!entry?.enumerable || !('value' in entry)) return false;
      const npc = entry.value;
      const keys = hasLife ? ['character', 'traits', 'postTileId', 'life'] : ['character', 'traits', 'postTileId'];
      if (!hasWeeklyKeys(npc, keys)) return false;
      const c = npc.character, traits = npc.traits;
      if (!isNamedCharacterRecord(c) || ids.has(c.id) || !Array.isArray(traits) ||
          Object.getPrototypeOf(traits) !== Array.prototype || Reflect.ownKeys(traits).length !== traits.length + 1) return false;
      if (hasLife && (!isNpcLife(npc.life) || c.gender !== 'female' || c.age < 18 || npcAge(npc.life, city.world.week) < 18)) return false;
      const seenTraits = new Set<string>();
      for (let j = 0; j < traits.length; j++) {
        const trait = Object.getOwnPropertyDescriptor(traits, String(j));
        if (!trait?.enumerable || !('value' in trait) || typeof trait.value !== 'string' ||
            !traitIds.includes(trait.value) || seenTraits.has(trait.value)) return false;
        seenTraits.add(trait.value);
      }
      const post = npc.postTileId;
      if (post !== null && (typeof post !== 'string' || !slots.includes(post) || posts.has(post))) return false;
      ids.add(c.id); if (post !== null) posts.add(post);
    }
    return true;
  } catch { return false; }
}
