Builder C, PR C fix round 1. PR #95 is open (branch feat/p6a-item-ui, head f046e36, pushed by Claude). Astra round 1 at f046e36: FAIL, one P2 and one P3, no P0/P1. Everything else (scope, LAW-02, P1–P11, C1/C2 behaviour, shops, reports, copy, silhouette) was accepted.

Binding plan is now C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-037d7ee.md: read Plan correction 10. Owner (Tân), 2026-11-14, dialog choice, verbatim: "Approve, incl. P7 line (Recommended)".

Finding 1 (P2), EquipmentView.svelte:22 and :67: the Destroy dialog stores the clicked Destroy button as `opener`; after a successful destroy `onapply(r.next)` removes that card, yet `close()`/`onclose` focus the removed button. Fix: after a confirmed Destroy, move focus to a control that still exists (for example the next item's action, else the Inventory section heading/control); Cancel and Escape keep returning focus to the opener. RED first: a new e2e (in items.spec.ts) that confirms Destroy by keyboard and asserts `document.activeElement` is connected, visible and inside Equipment; and that Cancel/Escape returns focus to the opener.

Finding 2 (P3), items-view.ts:52: `authority:'Authority 100'` is wrong; the goal is Authority 90 or more for 4 weeks in a row (spec §7.4). Change the label to exactly "Authority 90+ for 4 weeks" in items-view.ts and in your new items-view.test.ts expectation, and change only the `'Authority 100': 'authority'` key in the label-to-goal map at tests/e2e/character-life-navigation.helpers.ts:243 (inside approved P7) to the same text. Do not touch packages/ui/src/__tests__/society-view.test.ts (its "Authority 100" lines are a different, real effect). RED first: the unit expectation with the new label fails before the product edit.

Rules:
- No other file, existing-test edit, timeout or threshold change; nothing loosened. Update edit-inventory.md and the verifier so P7 records this one approved line change; P1–P6 and P8–P11 stay byte-identical.
- One commit `fix(ui): destroy focus and authority goal label`, ending `Co-authored-by: Codex <noreply@openai.com>`.
- Gates at the clean final head: before starting, record CPU load and the top processes; start only when no other test, build or review job runs on the machine (Claude and Astra are idle now; wait and re-check if load is high). Then gates 1–7 sequentially, `echo "CI=$CI"`, `CI=1 npm run test:smoke`. Every 5 s limit unchanged. If lord-health or society-renewable-support times out again, measure each alone three times and HOLD. If any smoke case fails, rerun it alone once and HOLD.
- Refresh at the final head: the 1280px screenshots (NPC and Player Equipment, Market, potions, Steward Details), accessibility summary, bundle (script + raw artifact), immutable check, edit inventory, README and SHA256SUMS (all files except the top manifest, including nested ones).
- Do not push, open or update a PR, or merge. Leave ports 4173/4174 free. Anti-loop: a finding still failing after 2 attempts is a HOLD.

Reply with: HEAD, tree, empty status; the commit; RED and GREEN per finding; the inventory/immutable result; CPU load at start; gate table and smoke total with CI=1; bundle; evidence paths.
