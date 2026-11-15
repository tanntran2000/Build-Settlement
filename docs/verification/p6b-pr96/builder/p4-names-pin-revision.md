# P4 after-text revision — Plan correction 3

Owner Tân, 2026-11-15, verbatim: "Lord's / Retainer's prefix (Recommended)".

File: packages/core/src/__tests__/catalog-data.test.ts:106. This supersedes only P4's effective after-text; original Step 0 package files are retained unchanged as historical evidence. P1–P3, P5–P58 and P59 remain exact.

Previous approved after pin: 7d1cc84733e7b5837cb596ea04b558943e8927689f7352fc35ea555e95581635
New after pin: 7fdeadb141aba95586555f531e044fcdc8a5eccd2c2766fab94c48714793f96d

Base before-text:
```ts
  expect(catalogHash(ITEM_CATALOG)).toBe('fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6');
```

Revised after-text:
```ts
  expect(catalogHash(ITEM_CATALOG)).toBe('7fdeadb141aba95586555f531e044fcdc8a5eccd2c2766fab94c48714793f96d');
```

Reason: prefix the 32 new definitions with straight-apostrophe Lord's / Retainer's names so every item has a unique display name. No other data field changes.
