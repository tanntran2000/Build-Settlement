# B4 — Gate 6 HOLD

Approve the [test-only contract expectation patch](proposed-gate6-contract-expectation.patch) to resume.

Tân’s Correction 23 approval was “Duyệt sửa locator (Recommended)”. The single approved locator edit was applied byte-for-byte. Both desktop cases passed at 1280 and 1600. B4.2 was committed as `c9c382750d0871f57c09a18e7beca454b62581ff`, tree `a40af360493b8fbb253a4cc5d79016c16a370920`. The clean branch contains the B4.1 and B4.2 commits. All 24 committed paths match the packet and Corrections 21–23. All three roads completed 40 weeks each. [Desktop GREEN](b42-green-c23-e2e.txt) · [Exact bytes](exact-head-bytes.txt) · [Road verification](b42-road-completeness.txt)

| Exact-head check | Result |
| --- | --- |
| Diff, lint and typecheck | Exit 0 each. Svelte reported 0 errors and 0 warnings. |
| Architecture scan and architecture tests | Exit 0 each. 154/154 architecture tests passed. |
| [Gate 6, full unit suite](gate-6-unit.txt) | Exit 1. 3,285 passed and one failed of 3,286 tests. |
| [Gate 6, isolated assertion](gate-6-confirm.txt) | Exit 1. The same test failed in isolation. |

The failed assertion is in `packages/simulation/src/__tests__/society-stock-integrity.test.ts:124`, “projects detached stock flow without assigning manager buffs”. Its whole-roster comparison builds expected NPCs from the opening roster and updates only Arousal. End Week correctly lowers all three Guild servants’ terms from 20 to 19. Both diffs show exactly those three `weeksLeft` mismatches. The earlier assertions, including the 8,550 Goods stock pin, passed.

The proposed patch sets the expected term to 19, preserving the existing full NPC equality, Arousal and stock checks. It touches one test hunk. Product code, other assertions and timeouts stay unchanged. SHA-256 `c2ec85aa8f555a8b86c923cf3ef59cd4b7078841a533236a2f648b62dd204d39`. [Before and after bytes](proposed-gate6-contract-expectation.json) · [Patch application check](gate6-hold-patch-apply-check.txt)

CPU and top-process samples were recorded before the gates with ports 4173/4174 free. The process-scoped Windows sleep request was released when gate 6 exited. The gates stopped before the build and full smoke. The final gzip, real IndexedDB and JSON checkpoint measurements, paired timing runs, and push remain pending. The two worktrees are retained as found with 0 bytes reclaimed. [Gate environment](environment-before-gates.txt) · [Clean held head](gate6-held-worktree.txt) · [SHA-256 manifest](SHA256SUMS.txt)
