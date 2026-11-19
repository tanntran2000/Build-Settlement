Answer to HOLD-after-correction-4 from the owner (Tân), verbatim dialog answers: "Duyệt sửa helper (Recommended)" and "Sửa trong B1 (Recommended)".

Recorded as Plan correction 5 at dbc0db7; new binding copy C:/Users/Admin/.t3/local-drafts/p7b-prB1/binding-plan-dbc0db7.md (SHA-256 6134496b5fa548d7d9ca87aa7bd80956028bdf601eafae3d46f8f6990f3f26bd; read "### Correction 5"). It pins your HOLD-after-correction-4.md (SHA-256 97b9530e1d4f779a69a3d14a722bfa89e2b7b9253b3a18ee234e91a3df26fa8f).

Two changes, nothing else:
1. `tests/e2e/character-life-navigation.helpers.ts`: in `expectReport`, when the "Household upkeep" ledger row is present, set `actual.householdUpkeep = { paidMilli, unpaidMilli }` from its "N Gold paid" text and the optional "· N Gold unpaid" text (unpaid 0 when absent). Use the same text-to-milli helper the file already uses. Keep `expect(actual).toEqual(baseReport)` exactly as it is: no field excluded or destructured out, no matcher loosened.
2. `packages/ui/src/CharacterLifeCity.svelte`: for a building with NPC beds (Mansion, Retainers' Hall), replace the line "Upkeep: … Gold/week. Farm batch Gold credits this Farm's upkeep." with exactly "Household upkeep: N Gold/week, paid after city operations. Skipped when Gold runs short." (N = upkeep × level, same `units(...)` formatting). Every other building keeps the old line byte-identical. In your new B1 case in `tests/e2e/society.spec.ts`, assert the Mansion text with an exact matcher.

Steps:
- RED first: run the new society.spec.ts case with the exact Mansion text assertion (fails), and one of the 56 failed smoke cases alone (fails as before). Record both.
- Apply the two changes. Amend the single local commit (it is unpushed), keeping the message `feat(core): ring 4, estates and acquisition buildings` and the Codex trailer. Extend your verifier to list the two Correction 5 changes as approved additions; every other byte unchanged.
- GREEN: the RED cases pass; full `npm test` green.
- Retake the Mansion panel screenshot (1280×900) with the new text.
- B1.2 again at the amended head on a quiet machine: gates 1–7, served-build hash check, `echo "CI=$CI"` and `CI=1 npm run test:smoke` in the same shell. If any smoke case fails, rerun each failed case alone once, report both, HOLD. Bundle vs main as before.
- Any other change, loosened assertion, removed case or new timeout: HOLD. Anti-loop: 2 failed attempts → HOLD; a queued message never overrides a HOLD.
- Evidence in C:/Users/Admin/.t3/local-drafts/p7b-prB1/builder-b1/ (new files named for Correction 5; update README and SHA256SUMS). No docs/ files on the product branch. Do not push, open a PR or merge; leave ports 4173/4174 free.

Reply with: HEAD and tree, empty git status, RED and GREEN, verifier result, gate table, smoke total with CI=1, bundle, the new screenshot path, evidence paths.
