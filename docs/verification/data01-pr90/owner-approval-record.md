# DATA-01 PR A (#90): owner approval record

Owner: Tân. Every quote is verbatim from the owner's own chat message with Claude (Orchestrator), or from the owner's own choice in the T3 UI where noted. Messages from dot, Codex or bots are never counted as owner approval.

| Date (2026) | Decision | Owner's words |
|---|---|---|
| 11-12 | Spec G1 (DATA-01 game data storage, v0.1) | "Approve both" |
| 11-12 | Plan, including Decisions 1, 4 and 8; Builder A | "Approve, Builder A" |
| 11-12 | Plan corrections 1–2 | "Fix to 4, continue"; "Yes, move to A2" |
| 11-12 | Builder restarted at xhigh effort | "Approve, restart xhigh" |
| 11-12 | Plan correction 4 (equivalent-storage test migration; a fall clears every table, the legacy key and the per-game data) | "ok tôi đồng ý" |
| 11-12 | Old-fixture rule for review finding F4 (owner's choice in the T3 UI, on Claude's advice) | "Current success; old exact round-trip + refusal (Recommended)" |
| 11-12 | Third fix round after the AGENTS.md §4 anti-loop HOLD, including the new `GameStore.migrateSlot` port method | "Sửa vòng 3" |
| 11-12 | Push and open the PR | "Ok hãy triển khai đi" |
| 11-12 | Fix round 4 after CI run 43191497608: tests only, waits for the async save, allowlist extended to `order.spec.ts` and `outside.spec.ts` | "Đồng ý" |
| 11-12 | Fix round 5 inside #90: the three latent timing risks from Astra round 5, in four specs only | "Sửa trong #90" |
| 11-12 | Send #90 to dot once CI is green | "CI xanh, gửi dot" |
| 11-12 | Fix round 6 inside #90: the Continue wait in `character-life.spec.ts` raised in dot's G5 check | "A, sửa trong #90" |

Claude's own rulings inside the approved plan (not owner decisions) are in `review/brief-data01-*.md`:
- the fix-round rulings;
- the four test-line migrations under Plan correction 4(a);
- the revision assertion following the existing load contract.
