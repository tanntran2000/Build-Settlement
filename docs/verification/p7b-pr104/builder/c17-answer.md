Owner answer (Tân), verbatim dialog answer: "Duyệt sửa kiểu + fixture (Recommended)".

Recorded as Plan correction 17 at 98fccdf; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-98fccdf.md (SHA-256 993347f6f03c076b968dd75af7bfecef6cbd7b35b4f8dde96d9c0a8c8a5d0d90; read "### Correction 17"). It pins your c16/README.md, candidate-held.patch and correction16-byte-inventory.json.

Go (this is a fresh authorized pass; the two-attempt count restarts):
1. From clean 8aa7dc4, reapply candidate-held.patch byte-exact. Fix TS2345 at acquisition-replay.ts:77 by typing the id parser's returned slot as `number | 'lot'` with real narrowing (no `as` cast that hides a wrong value). List the added bytes.
2. Keep the approved fixture changes exactly as in the candidate; nothing else.
3. Typecheck, the eight R2 RED cases now GREEN, full unit; then one commit `fix(simulation): close acquisition replay gaps (Astra round 2)` ending `Co-authored-by: Codex <noreply@openai.com>`.
4. Verifier (approved packet + Corrections 12–14 + the Correction 16/17 bytes, nothing else), then at the clean final head on a quiet machine: gates 1–7, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell; bundle vs main; largest save through IndexedDB and JSON; §9 paired timings (report deltas and noise only, no own HOLD rule). Smoke failure: rerun each failed case alone once, report both, HOLD.
5. Any other change, loosened assertion, removed case or new timeout: HOLD. 2 failed attempts → HOLD. Do not push, open a PR or merge; leave ports free. Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c17/ with README and SHA256SUMS.

Reply with: HEAD and tree, empty git status, the new commit, RED/GREEN, verifier result, gate table and smoke total with CI=1, bundle, largest save bytes, timings, evidence paths.
