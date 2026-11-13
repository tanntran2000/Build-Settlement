# DATA-01 PR C edit inventory

Base: `5ff521e3971739ecde05a22dd96c74827c0ae363`.

| File | Change |
| --- | --- |
| packages/ui/src/DataInspector.svelte | New read-only Save/Catalogs view. Existing IndexedDB stores are opened without a version and read using readonly transactions; missing-database creation is aborted. Filters slot main. English copy, tabs, keyboard navigation and ID search. |
| packages/ui/src/data-inspector.ts | Pure table counts, case-insensitive ID lookup, five catalog views built from existing typed core constants. |
| packages/ui/src/main.ts | Vite environment types and DEV-only dynamic inspector import at ?mode=data-inspector. |
| packages/ui/src/error-log.ts | Optional validated ref, persistence/load compatibility, ref-aware adjacent deduplication. No call-site wiring. |
| packages/ui/src/__tests__/data-inspector.test.ts | New pure-logic and ref API/persistence tests. Existing error-log tests remain unchanged. |
| packages/ui/src/__tests__/inspector-build.test.ts | New Node test builds production itself and scans every output file for inspector markers. Owner-approved 60_000 ms on this case and completion hook only. Logs completed child duration. |

No dependency, schema, core/simulation, existing-test, fixture or configuration edits.
