Perf HOLD answer from the owner (Tân), 2026-11-17, verbatim: "Remove the extra clone (Recommended)".

Recorded as Plan correction 5 at 25b82ac; new binding copy C:/Users/Admin/.t3/local-drafts/p7a-prB/binding-plan-25b82ac.md (read "### Correction 5").

Scope of fix round 1 on feat/p7a-npc-life-week (one new commit on top of cf94804, message `perf(simulation): drop redundant npc clone in weekly life step`, ending `Co-authored-by: Codex <noreply@openai.com>`):
1. Remove only the redundant full `structuredClone(npcs)` at packages/simulation/src/npc-life-week.ts:17. Behaviour, outputs and every existing test stay the same. Callers must not see their input mutated: if no existing test pins that for runNpcLifeWeek (or its Character Life caller), add one in npc-life-week.test.ts first (RED is not required for a pure perf refactor, but show the test passes before and after).
2. No other product, test, timeout, threshold or config change. Anything else is a HOLD.
3. Re-run the same base-vs-head profile (same harness, seed 42, 100 NPCs, alternating base/head ×3, fresh processes, CPU and sleep/resume recorded) against the new head and report the same tables plus the change from the previous head.
4. Then full gates at the new clean head on a quiet machine (CPU, top processes, sleep/resume record, served-build hash check before the smoke): gates 1–7, then `echo "CI=$CI"` and `CI=1 npm run test:smoke`. If the smoke fails, rerun each failed case alone once, report both, HOLD.
5. Update evidence in C:/Users/Admin/.t3/local-drafts/p7a-prB/ (fix-round1/ subfolder: diff, test logs, profile, gates, smoke, bundle), README, SHA256SUMS (nested manifests included).

Do not push, open a PR or merge. Reply with: new HEAD/tree, the diff, test totals, the profile tables, the gate table and smoke total with CI=1, bundle, evidence paths.
