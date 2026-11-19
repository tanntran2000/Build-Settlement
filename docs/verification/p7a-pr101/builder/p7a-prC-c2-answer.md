C2 HOLD answer from the owner (Tân), verbatim choice: "Panel not a tab stop (Recommended)".

Recorded as Plan correction 10 at 21c4efa; binding copy C:/Users/Admin/.t3/local-drafts/p7a-prC/binding-plan-21c4efa.md (read "### Correction 10").

Fix round 1 on feat/p7a-npc-sheet (one new commit on top of 133d1f0, message `fix(ui): npc sheet panel is not a tab stop`, ending `Co-authored-by: Codex <noreply@openai.com>`):
1. NpcSheet.svelte: remove only the active panel's `tabindex="0"` (line 59). Tabs keep one tab stop, aria links, Left/Right wrap, Home/End.
2. tests/e2e/npc-sheet.spec.ts: change only the keyboard case so it asserts the new path (Tab from the selected sheet tab moves to the next focusable control, not the panel; the panel has no tabindex; Shift+Tab returns to the selected tab). Show this case RED against 133d1f0's product code and GREEN after.
3. No other product or test change; no existing test, assertion, timeout or threshold change. Anything else is a HOLD.
4. Run the 4 failed `life shell accessibility baseline` cases alone first (CI=1), then the focused NPC-sheet suite, then full C2 at the clean new head on a quiet machine: gates 1–7 (both diff checks), served-build hash check, `echo "CI=$CI"` + `CI=1 npm run test:smoke`, bundle; re-capture the 4 screenshots if anything visible changed. If the smoke fails, rerun each failed case alone once, report both, HOLD (this is fix round 1 of 2 under the anti-loop rule).
5. Evidence in C:/Users/Admin/.t3/local-drafts/p7a-prC/fix-round1/, parent README and SHA256SUMS updated (nested manifests included). Do not push, open a PR or merge; leave ports free.

Reply with: new HEAD/tree, the diff, RED/GREEN for the changed case, the 4 baseline cases, gate table, smoke total with CI=1, bundle, evidence paths.
