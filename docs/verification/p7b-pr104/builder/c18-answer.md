Owner answer (Tân), verbatim dialog answer: "Duyệt + cho sửa kiểu nhỏ (Recommended)".

Recorded as Plan correction 18 at 9a66d06; binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB3/binding-plan-9a66d06.md (SHA-256 ff406413cbf3e00bcf2880b4a102fb2f912b9c308ef816a793f15d45ffb05d77; read "### Correction 18").

Go (fresh authorized pass):
1. From clean 8aa7dc4, reapply c17/candidate-held.patch plus the approved 85-byte parser annotation, then type the character-life-command.test.ts fixture result as the existing `WorldNpcCityResult`.
2. Standing rule (Correction 18 item 2): further type-only errors you may fix without HOLD only if no emitted runtime code changes, no `as`, `any`, `@ts-ignore` or `@ts-expect-error`, no assertion changes, and every byte is listed. Anything else: HOLD.
3. Typecheck, the eight R2 cases GREEN, full unit; commit `fix(simulation): close acquisition replay gaps (Astra round 2)` ending `Co-authored-by: Codex <noreply@openai.com>`.
4. Verifier (approved packet + Corrections 12–14 + Corrections 16–18 bytes, nothing else), then at the clean final head on a quiet machine: gates 1–7, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell; bundle vs main; largest save through IndexedDB and JSON; §9 paired timings (deltas and noise only). Smoke failure: rerun each failed case alone once, report both, HOLD.
5. Do not push, open a PR or merge; leave ports free. Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB3/builder-b3/c18/ with README and SHA256SUMS.

Reply with: HEAD and tree, empty git status, the new commit, RED/GREEN, verifier result with the type-only byte list, gate table and smoke total with CI=1, bundle, largest save bytes, timings, evidence paths.
