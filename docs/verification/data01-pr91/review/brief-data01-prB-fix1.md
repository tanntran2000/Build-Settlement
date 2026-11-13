[Claude -> Builder] DATA-01 PR B, review fix round 1. Astra review (thread mcp:263bb217-c6e9-42c9-8806-2372bb5c8551) is FAIL. PR #91 is open, and the head is 8c0657e (pushed). Make a new commit; no amend, no force push.

F1 (P2): validate.ts:292. The literal type for LAW_MESSAGES.VOTE_SHORT contains mojibake, U+00C3 U+201A U+00C2 U+00B7, where the original has a single U+00B7 '·'. Origin/main law.ts:48 reads: 'The vote would fail: For {F} · Against {A}.'. Claude confirmed it by byte dump. It is the only mojibake in the PR B files (grep for Ã/Â is 0 elsewhere).
- RED first: add to packages/core/src/__tests__/catalog-data.test.ts a type-level check, for example `expectTypeOf(LAW_MESSAGES.VOTE_SHORT).toEqualTypeOf<'The vote would fail: For {F} · Against {A}.'>()`. Show that `npm run typecheck` fails before the fix. If expectTypeOf is not checked by typecheck in this repo, use a typed assignment that fails to compile instead.
- Fix: correct the literal to the single '·' (U+00B7), with UTF-8 bytes C2 B7. Write the file as UTF-8 with no BOM, and verify with a byte dump. Change nothing in the JSON or the fixture.
- Also check every other literal type in validate.ts and all new files against origin/main: no other non-ASCII drift. Show a list of all non-ASCII code points in the new files, matched to their source in origin/main.

F2 (P3): catalog-data.test.ts:30 compares the JSON with constants built from the same JSON, so it proves wiring, not equality with the pre-extraction values. Strengthen it inside catalog-data.test.ts only (an allowlisted file; add no new fixture file):
- For each of the 16 extracted constants, assert that SHA-256 of its canonical JSON (`JSON.stringify(constant)`, which keeps key order) equals a hex hash literal computed from the ORIGINAL constants at origin/main 5cc2522. Compute those hashes from the base source, for example by reusing your capture of catalog-values at base. Record the script, its output and the base SHA in the evidence. Embed the 16 hashes in the test.
- Negative control in the same test: a structuredClone of one constant with one value changed must give a different hash.
- If any hash does not match today's constants, HOLD: that means an extraction value drift.

Commit: `fix(core): restore the vote message literal type and pin catalog values to base`. Body: Astra findings F1/F2, plus Co-authored-by trailer.

Then gates 1–7 sequentially at the new clean head (no full smoke; Claude runs it). Reply with HEAD, tree, git status (empty), the RED evidence for F1, the hash table (constant → base hash → match), the gate table and the evidence paths under local-drafts/data01-prB/fix1/. Anti-loop: if a fix fails twice, HOLD.
