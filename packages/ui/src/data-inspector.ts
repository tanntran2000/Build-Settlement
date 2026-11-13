import {
  TRIAL_BUILDINGS, SOCIETY_BUILDINGS, LAW_CATALOG, LAW_TRIAL, LAW_MESSAGES, RESEARCH_TOPICS,
  OUTSIDE_PLOTS, ORDER_TRIAL, GARRISON_TRIAL, CRIME_TRIAL, CRISIS_TRIAL, SOCIETY_TRIAL,
  GOODS_STOCK_TRIAL, TILE_TRIAL_BALANCE, IMMIGRATION_TRIAL_DEFAULTS, OUTSIDE_TRIAL,
} from '@haven/core';
import { GAME_DB, type StoredRecord, type TableName } from '@haven/persistence';

export interface InspectorRow { id: string; value: unknown }
export interface InspectorCatalog { file: string; count: number; rows: InspectorRow[] }

export function listTables(records: readonly StoredRecord[]): { table: TableName; count: number; rows: StoredRecord[] }[] {
  return GAME_DB.stores.map(table => {
    const rows = records.filter(record => record.table === table);
    return { table, count: rows.length, rows };
  });
}

export function findById<T extends { id: string }>(rows: readonly T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  return rows.filter(row => row.id.toLowerCase().includes(needle));
}

export function listCatalogs(): InspectorCatalog[] {
  const buildings = [...new Set([...Object.keys(TRIAL_BUILDINGS), ...Object.keys(SOCIETY_BUILDINGS)])].map(id => ({
    id, value: {
      ...(Object.hasOwn(TRIAL_BUILDINGS, id) ? { trial: TRIAL_BUILDINGS[id] } : {}),
      ...(Object.hasOwn(SOCIETY_BUILDINGS, id) ? { society: SOCIETY_BUILDINGS[id] } : {}),
    },
  }));
  const catalogs: { file: string; rows: InspectorRow[] }[] = [
    { file: 'buildings.json', rows: buildings },
    { file: 'laws.json', rows: [
      ...Object.entries(LAW_CATALOG).map(([id, value]) => ({ id, value })),
      { id: 'LAW_TRIAL', value: LAW_TRIAL }, { id: 'LAW_MESSAGES', value: LAW_MESSAGES },
    ] },
    { file: 'research.json', rows: RESEARCH_TOPICS.map(id => ({ id, value: { id } })) },
    { file: 'outside-plots.json', rows: OUTSIDE_PLOTS.map(value => ({ id: value.id, value })) },
    { file: 'tuning.json', rows: Object.entries({ ORDER_TRIAL, GARRISON_TRIAL, CRIME_TRIAL, CRISIS_TRIAL,
      SOCIETY_TRIAL, GOODS_STOCK_TRIAL, TILE_TRIAL_BALANCE, IMMIGRATION_TRIAL_DEFAULTS, OUTSIDE_TRIAL,
    }).map(([id, value]) => ({ id, value })) },
  ];
  return catalogs.map(catalog => ({ ...catalog, count: catalog.rows.length }));
}
