import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { CATALOG_SEEDS, runCatalogScenario } from './fixtures/make-catalog-golden.js';

const golden = JSON.parse(readFileSync(new URL('./fixtures/catalog-golden.json', import.meta.url), 'utf8')) as ReturnType<typeof runCatalogScenario>[];

it.each(CATALOG_SEEDS)('keeps seed %i byte-identical through 60 weeks of catalog commands', seed => {
  const actual = runCatalogScenario(seed);
  expect(actual).toEqual(golden.find(entry => entry.seed === seed));
  expect(actual.crimeEvents).toBeGreaterThan(0);
  expect(actual.crisisReports).toBe(60);
  expect(actual.outsideReports).toBe(60);
}, 20_000);

it('detects one extra milli of Hospital upkeep in a cloned catalog', async () => {
  vi.resetModules();
  vi.doMock('../../../core/src/trial/catalog.js', async importOriginal => {
    const original = await importOriginal<typeof import('@haven/core')>();
    const buildings = structuredClone(original.TRIAL_BUILDINGS);
    buildings.hospital.upkeepMilli += 1;
    return { ...original, TRIAL_BUILDINGS: buildings, trialBuilding: (id: string) => Object.hasOwn(buildings, id) ? buildings[id] : undefined };
  });
  try {
    const { runCatalogScenario: mutated } = await import('./fixtures/make-catalog-golden.js');
    const actual = mutated(CATALOG_SEEDS[0]);
    expect(actual.session).not.toBe(golden[0].session);
  } finally {
    vi.doUnmock('../../../core/src/trial/catalog.js');
    vi.resetModules();
  }
}, 20_000);
