# DATA-01 PR B decisions and execution deviations

Owner approvals supplied in the Builder brief, verbatim:
- Plan: "Approve, Builder A" (covers A?C).
- PR B start: "Giao Builder B" (2026-11-13).

## Skill-rule correction (Claude)

HOLD resolved: use executing-plans in this thread, no subagents, no other skills. The brief's no-skill-read restriction was corrected for this one skill. The plan was unchanged.

## B1 correction (Claude)

Claude independently reproduced TS6059 at original B1 with B2 stashed. Authorized precisely one type-only import change, verification, and amendment of unpushed B1, with B2 safely stashed/restored. Old B1:349e9d777e6df098ea6d15a54f4d38e5da0b9d83. Corrected B1:9d2e111d076cfee9b92b6b6d36de55f1a87259d4. Both fixture blobs:64c18a2688573e3fe3b8ec0b131cd0318f4d4855.

## Runner concurrency deviation (Claude ruling)

The optional focused Vitest run (b2-formatted-focused.txt) overlapped the Node architecture-test run (b2-test-architecture.txt). Both passed. No Playwright run, product edit, fixture edit or TDD-order change was involved. Builder disclosed the mistake, started no more runners, and requested a ruling. Claude authorized recording the deviation and continuing, because final gates rerun sequentially at the clean head. The final B3 sequence waits for each command's process exit before the next starts. No optional test reruns during B3.

## Development failures retained

B1 generation first rejected an overstaffed scenario, without writing a fixture. One setup correction, then GREEN and the sole fixture write. B2 full RED preceded product edits. First focused GREEN attempt found a new-test matcher issue and two sparse-array schema gaps; one fix pass, then24/24. Initial B2 typecheck exposed the pre-existing B1 defect above. A supplementary value-comparison helper needed a JSON default-export interop correction; it then verified all16 constants including key order. These are development runs, not final-head gate results; all logs remain available.

## Skill application boundaries

The explicit brief supersedes skill helper reads, subagent review, scratch workspace and finishing-branch instructions. Evidence stays in the requested local-drafts directory, the assigned worktree is retained, and Astra handles independent review. Private deepFreeze helpers cannot be imported without edits outside the allowlist; validate.ts reuses their implementation. No new dependencies or config changes.

## JSON import attributes (Claude ruling)

HOLD released for fix attempt1: add only `with { type: 'json' }` to new JSON imports, use recorded isolated discovery failure as RED, pass the isolated storage case, commit separately, then all gates and full smoke at the new clean head. Applied12 attributes across9 allowlisted modules with no other product edit. Isolated GREEN1/1; committed3a2759f46ffe883db857f878aa97930caa979be6.

## Required unit gate rerun

At3a2759f, gate6 first run passed2215 cases and timed out golden seed0 at the existing5000ms default. No byte mismatch reported. One rerun of the required gate at the same head passed2216/2216. No source, assertion, timeout or runner-config edit. First failure retained as gate-6-unit-attempt1-timeout.txt; gate7 followed the successful rerun. Full smoke remains a separate subsequent run.
