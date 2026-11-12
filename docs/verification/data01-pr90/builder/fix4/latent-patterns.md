# Read-only Save locally audit

These files were inspected and are not edited in round 4.

| File:line at base c1faf87 | Same missing-result-wait pattern |
| --- | --- |
| tests/e2e/world-npc-session.spec.ts:29 | Save, export, reload, Continue; no visible save-result wait. |
| tests/e2e/ledger.spec.ts:148 | Two parameterized fall cases: Save, navigate to city and End Week, then inspect stored save. No result wait before navigation. |
| tests/e2e/society.spec.ts:39 | Save, export, immediate storedSaveText assertion and reload; no visible save-result wait. |
| tests/e2e/character-life.spec.ts:330 | Save, export and End Week/navigation without a result wait. The separate Save paths at 265 and 317 already wait for success. |
| tests/e2e/world-session.spec.ts:10 | Shared save helper returns after click. Callers at 24 (U2), 27 (three U3 variants) and 42 (U9) export, read slots or continue/navigate without a visible save-result wait. |

No matching missing Save-result wait was found in the requested scopes of character-life-boundary.spec.ts (no Save click), autosave.spec.ts (no manual Save click), or storage.spec.ts. Storage's save helper at line 12 already waits for success; its direct failure Save waits for the alert, and deliberate race cases coordinate held transaction completion and/or release before asserting their intended result. Those deliberate pending-operation cases should not receive an unconditional success wait.

The grep/source evidence is retained in latent-pattern-source.txt. No claim is made that these unedited patterns have been reproduced with the delay; this is the requested source audit.
