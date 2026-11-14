Astra, READ-ONLY re-review round 3 of P6-A PR A after review fix round 2. Do not run tests or builds (read-only artifact scripts like before are fine); Claude is running gates 1–7 and the full CI=1 smoke in this worktree now.

Worktree: C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch feat/p6a-item-core (pushed). Confirm HEAD == 4afe92763856cc3f82445803298beacc7ccedf68, tree 8e95ed5e017bff02d4ff43d61789244ce2ff6519. Your round 2 reviewed f1944ce completely (66 files) and found two P2. New range f1944ce..4afe927: 2 commits, 4 files, +135/−5 (items.ts, character/validate.ts, two new tests).

Binding plan: C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-ba75ec8.md — **Plan correction 4** allows `packages/core/src/character/validate.ts` in PR A only for the equipment-owner check. Owner (Tân), 2026-11-14, verbatim: "Allow validate.ts in PR A (Recommended)". All earlier owner quotes stand as in round 2.

Builder evidence: C:/Users/Admin/.t3/local-drafts/p6a-prA/fix2/README.md (RED 12 failed / 3 passed at f1944ce, GREEN 15/15; 0 existing-test edits this round; immutable-check.txt: 21 golden/fixture files and the pin files byte-identical to f1944ce).

Check:
1. **Round-2 finding 1 closed.** `isItemsState` (items.ts:59 onward) now accepts only the form the item-table rebuild (session-records.ts ~105–125) produces. Verify against the rebuild code exactly: item-state key order, `{id, defId}` key order, `{item, expiresWeek}` key order, slot order inside an owner (the validator now requires ascending item id across slots — is that exactly the rebuild order?), owner-entry order including JS integer-like key enumeration. Are `market`, `goals` and `materials` stored as-is in the city record (so their order needs no check), or rebuilt?
2. **No accepted command produces a state the validator now refuses.** Find how each item command orders equipment slots and owner entries (your round 2 said "every successful item command sorts equipment entries and slots" — sorted by what key?). If commands sort slots by slot name while the validator wants ascending item id, that is a defect: give a concrete command sequence.
3. **Round-2 finding 2 closed.** `isCharacterLifeSessionState` (character/validate.ts:86) refuses unknown equipment owners and accepts the Player and real NPCs; the UI and persistence checkpoint import both go through it. Edit limited to that check (correction 4). Any other caller that now refuses a state it used to accept, and is that correct?
4. **Scope:** only those 4 files changed since f1944ce; no golden/fixture/pin byte change; no docs/ files; whole-PR allowlist still holds with correction 4.
5. The two new tests (item-owner-import.test.ts, items-rebuild-order.test.ts) actually exercise the failing shapes and the real import path, and assert bytes, not just deep equality.
6. Anything else in the new code, P0–P3 with file:line.

Reply PASS or FAIL for the whole PR at 4afe927 (your round 2 full review plus this delta), with findings, what you read, and limits. Do not edit, install, run tests or builds, push or merge.
