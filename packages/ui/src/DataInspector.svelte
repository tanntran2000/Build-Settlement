<script lang="ts">
  import { onMount } from 'svelte';
  import { GAME_DB, type StoredRecord } from '@haven/persistence';
  import { findById, listCatalogs, listTables } from './data-inspector.js';

  let tab = $state<'save' | 'catalogs'>('save');
  let query = $state('');
  let records = $state<StoredRecord[]>([]);
  let loading = $state(true);
  let error = $state('');
  let selectedTable = $state<string>('meta');
  let selectedCatalog = $state('buildings.json');
  const catalogs = listCatalogs();
  const tables = $derived(listTables(records));
  const rows = $derived(tab === 'save'
    ? tables.find(table => table.table === selectedTable)?.rows ?? []
    : catalogs.find(catalog => catalog.file === selectedCatalog)?.rows ?? []);
  const matching = $derived(findById(rows, query));

  // Opening a missing database is aborted: inspection never creates a schema,
  // migrates a slot or uses a readwrite transaction.
  async function readSlot(): Promise<StoredRecord[]> {
    const db = await new Promise<IDBDatabase | null>((resolve, reject) => {
      let missing = false;
      const request = indexedDB.open(GAME_DB.name);
      request.onupgradeneeded = () => { missing = true; request.transaction?.abort(); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => missing ? resolve(null) : reject(request.error);
      request.onblocked = () => reject(Error('Database unavailable'));
    });
    if (!db) return [];
    try {
      return await new Promise<StoredRecord[]>((resolve, reject) => {
        const stores = GAME_DB.stores.filter(table => db.objectStoreNames.contains(table));
        if (!stores.length) { resolve([]); return; }
        const tx = db.transaction(stores, 'readonly');
        const result: StoredRecord[] = [];
        for (const table of stores) {
          const request = tx.objectStore(table).getAll();
          request.onsuccess = () => result.push(...(request.result as StoredRecord[]).filter(record => record.slotId === 'main'));
        }
        tx.oncomplete = () => resolve(result);
        tx.onabort = tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }

  onMount(() => {
    let active = true;
    readSlot().then(value => { if (active) records = value; })
      .catch(() => { if (active) error = 'Could not read local data. Browser storage may be unavailable.'; })
      .finally(() => { if (active) loading = false; });
    return () => { active = false; };
  });

  function tabKey(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    tab = event.key === 'Home' ? 'save' : event.key === 'End' ? 'catalogs' : tab === 'save' ? 'catalogs' : 'save';
    document.getElementById(`inspector-tab-${tab}`)?.focus();
  }
</script>

<main class="inspector">
  <header>
    <p class="eyebrow">HAVEN / DEVELOPER TOOLS</p>
    <h1>Data inspector</h1>
    <p>Read-only view of the local save slot and validated game catalogs.</p>
  </header>
  <div class="tabs" role="tablist" aria-label="Data source">
    <button id="inspector-tab-save" role="tab" aria-selected={tab === 'save'} aria-controls="inspector-panel"
      tabindex={tab === 'save' ? 0 : -1} onclick={() => tab = 'save'} onkeydown={tabKey}>Save</button>
    <button id="inspector-tab-catalogs" role="tab" aria-selected={tab === 'catalogs'} aria-controls="inspector-panel"
      tabindex={tab === 'catalogs' ? 0 : -1} onclick={() => tab = 'catalogs'} onkeydown={tabKey}>Catalogs</button>
  </div>
  <div id="inspector-panel" role="tabpanel" tabindex="0" aria-labelledby={`inspector-tab-${tab}`}>
    <label for="inspector-search">Search by id</label>
    <input id="inspector-search" type="search" bind:value={query} placeholder="Filter record ids" />
    <div class="layout">
      <nav aria-label={tab === 'save' ? 'Save tables' : 'Catalog files'}>
        {#if tab === 'save'}
          <h2>Local slot: main</h2>
          {#each tables as table}
            <button class:chosen={selectedTable === table.table} aria-pressed={selectedTable === table.table}
              onclick={() => selectedTable = table.table}>{table.table} <span>{table.count}</span></button>
          {/each}
        {:else}
          <h2>Catalog files</h2>
          {#each catalogs as catalog}
            <button class:chosen={selectedCatalog === catalog.file} aria-pressed={selectedCatalog === catalog.file}
              onclick={() => selectedCatalog = catalog.file}>{catalog.file} <span>{catalog.count}</span></button>
          {/each}
        {/if}
      </nav>
      <div class="records" aria-live="polite">
        {#if tab === 'save' && loading}
          <p role="status">Reading local save data...</p>
        {:else if tab === 'save' && error}
          <p role="alert">{error}</p>
        {:else}
          <h2>{tab === 'save' ? selectedTable : selectedCatalog}</h2>
          <p>{matching.length} of {rows.length} records shown</p>
          {#each matching as row (row.id)}
            <article><h3>{row.id}</h3><pre>{JSON.stringify(tab === 'save' ? row : row.value, null, 2)}</pre></article>
          {:else}
            <p>No matching records.</p>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</main>

<style>
  .inspector { max-width: 1200px; margin: 0 auto; padding: 24px; color: #30291f; background: #f5edd8; min-height: 100vh; }
  .eyebrow { font-size: 12px; letter-spacing: .12em; }
  h1 { margin: 8px 0; } h2 { font-size: 18px; } h3 { font-size: 16px; overflow-wrap: anywhere; }
  .tabs { display: flex; gap: 8px; margin: 24px 0 16px; }
  button, input { font: inherit; padding: 10px 12px; border: 1px solid #847356; border-radius: 4px; background: #fffaf0; color: inherit; }
  button { cursor: pointer; min-height: 44px; } button[aria-selected="true"], .chosen { background: #dfcfaa; font-weight: bold; }
  button:focus-visible, input:focus-visible { outline: 3px solid #3a5a37; outline-offset: 2px; }
  label { display: block; margin-bottom: 6px; } input { width: 100%; box-sizing: border-box; }
  .layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 24px; margin-top: 16px; }
  nav button { display: flex; justify-content: space-between; gap: 8px; width: 100%; margin-bottom: 6px; text-align: left; overflow-wrap: anywhere; }
  article { border-top: 1px solid #b4a381; } pre { padding: 12px; overflow: auto; max-height: 50vh; background: #fffaf0; font-size: 13px; }
  .records { min-width: 0; } @media (max-width: 650px) { .layout { grid-template-columns: 1fr; } .inspector { padding: 16px; } }
</style>
