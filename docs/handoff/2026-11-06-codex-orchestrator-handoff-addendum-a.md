# Codex Orchestrator Handoff — Addendum A (2026-11-06)

This addendum extends `docs/handoff/2026-11-06-codex-orchestrator-handoff.md`. Section numbers like "§5.6" refer to that file.

Claude wrote it at the owner's request. The owner's words, verbatim:

> "Codex vừa đặt một số câu hỏi cần bạn trả lời trong T3 hãy hướng dẫn và trả lời thật kỹ để codex điều tiết công việc cho đúng. Cách đặt tên và cách mở 1 PR mới cũng cần hướng dẫn giống của bạn để sau khi reset bạn có thể nắm được Codex thời gian qua làm gì"

## A1. Role mapping (supersedes handoff §1)

The incoming Orchestrator reported this mapping from Tân on 2026-11-06. Use it:

| Role | Model | Thread |
|---|---|---|
| Orchestrator | Codex `gpt-6.1-sol`, **max** | Your own session; no product code |
| Builder | Codex `gpt-6.1-sol`, xhigh | One fresh T3 thread per PR (§A4) |
| **Tester** (separate, new) | Codex `gpt-6.1-sol`, xhigh | One fresh T3 thread per PR test pass (§A5) |
| Reviewer | Codex `gpt-6-astra`, xhigh | One fresh read-only T3 thread per review |
| Merger (G5) | dot or Tân | Shared thread `mcp:f972da44-…` |

Everything else in handoff §1 still applies:
- The Builder, Tester and Reviewer are always different threads.
- The Orchestrator never merges.
- The Orchestrator never counts its own reading as the review.

## A2. Answers to the incoming Orchestrator's three questions

1. **Is PR #83 waiting only on dot's G5?** Yes.
   - There is no unrecorded blocker or owner amendment.
   - All three amendments are in the spec and plan on `docs/ui-ledger-redesign`: "Dùng thẳng file TTF (Recommended)", "Xóa dấu cách thừa (Recommended)" and "Kiểu mới, sửa test opacity (Recommended)".
   - A Codex GitHub review never ran on #83. In earlier PRs it ran only after the owner's account commented `@codex review`. It is **not a G5 requirement**. Do not post that comment yourself; the owner or dot may.
   - After the merge, run G6 against the tested tree **`9aabc4919c2f7d45414354071e1b6179f888ea72`**.

2. **Where do clarification requests go?** Keep using the shared thread `mcp:f972da44-2380-4966-a4f2-b4f969c703e6`, prefixed `[Codex (Orchestrator) -> Claude]`.
   - Claude reads it only when Tân opens a Claude session. Otherwise Claude is away until about 2026-11-10, so **do not wait for Claude on anything that blocks work.**
   - Decisions inside an approved spec or plan are yours (handoff §3 item 11, §5.4).
   - Scope, value, order and copy changes go to **Tân**, in Vietnamese, with options and a recommendation.
   - Claude answers in this thread as `[Claude (Orchestrator/Tester) -> Codex]`. Relay ACKs are not answers.

3. **Is there a T3 interface to set reasoning effort?** No working one is known.
   - `t3 thread start/send` has no effort flag, and `t3_thread_configuration` does not exist.
   - CLI threads send `effort: null`, so Codex uses `model_reasoning_effort` in `C:/Users/Admin/.codex/config.toml` (line 19, now `"xhigh"`). Builder, Tester and Reviewer threads started by CLI therefore run at **xhigh**, which matches the mapping.
   - **Do not edit `config.toml`.** It is global, and the owner chose xhigh.
   - Orchestrator at max is set by the owner in the T3 UI model picker for your own session. That picker only affects turns sent from the UI.
   - To verify a thread's effort:
     1. Open the newest provider log, `C:/Users/Admin/.t3/userdata/logs/provider/events.<id>.log`. One file may hold several threads.
     2. Find the `"model":"gpt-6.1-sol","reasoningEffort":"<x>"` entry next to the new thread id.
     3. In `turn/start`, `"effort":null` means the config default applies.

## A3. Naming conventions (use exactly these)

| Thing | Pattern | Examples |
|---|---|---|
| WP id | Roadmap id (`P<n>`, `P<n>-<A/B/C>`, `P<n>-B<n>`), or a short caps id plus a 2-digit number | `P8-B2`, `P8-C`, `SOLDIER-01`, `UI-LEDGER-01`, `UI-TITLE-01` |
| Docs branch (spec + plan) | `docs/<wp-slug>-design` | `docs/p8c-town-hall-laws-design`, `docs/soldier-garrison-design` (UI-LEDGER-01 uses `docs/ui-ledger-redesign`) |
| Spec file | `docs/superpowers/specs/YYYY-MM-DD-<wp-slug>-design.md` | `2026-11-05-soldier-garrison-design.md` |
| Plan file | `docs/superpowers/plans/YYYY-MM-DD-<wp-slug>.md` | `2026-11-05-soldier-garrison.md` |
| Feature branch, one per PR | `feat/<wp-slug>-<part>` (`<part>` describes the PR) | `feat/p8c-law-state`, `feat/p8c-law-week`, `feat/p8c-law-ui`, `feat/soldier-garrison-engine`, `feat/ui-ledger-shell`; next is `feat/ui-ledger-report` |
| Fix-only branch | `fix/<wp-slug>-<what>` | `fix/laws-e2e-iron-margin` |
| T3 thread titles | `<WP> PR <X> Builder (<scope>)`, `<WP> PR <X> Tester (<scope>)`, `<WP> Astra: review PR <X>`, `<WP> Astra: delta review PR <X>` | `UI-LEDGER-01 PR B Builder (report view and letters)` |
| Commit message | Conventional Commits, `type(scope): subject` | `feat(simulation): weekly law effects, costs and the law promise` |
| PR title | `type(scope): <WP> <what> (PR <X>)` | `feat(ui): UI-LEDGER-01 ledger shell theme with Pixelify Sans (PR A)` |
| Plan task commits | Exactly the subject the plan gives; if it gives none, choose one and say so in the reply | — |
| Fixtures | `packages/persistence/src/__tests__/fixtures/society-v<ruleset>/<name>.json` | `society-v7/life-laws.json` |
| Ruleset | `tile-society-0<n>`; bump only when a spec says so | Now `tile-society-07` |
| Amendment line in a doc | `**Amendment (owner Tân, YYYY-MM-DD, verbatim: "<words>"):** <what changed and why>` | See P8-C plan Decision 10 |

Commit message rules:
- Types: `feat`, `fix`, `test`, `docs`, `chore`.
- Scopes: `core`, `simulation`, `persistence`, `ui`, `e2e`.
- Subject in lower case, imperative mood, no full stop.
- The body says why.
- The last line is the agent attribution line.

## A4. How to open a PR (step by step, like Claude)

1. **Builder push.** The Builder has pushed `feat/<…>`. Its reply gives the final HEAD, the gates and the full smoke total.
2. **Tester pass** on that exact head (§A5), plus a browser pass for UI changes (handoff §6.3).
3. **Astra review** on that exact head (handoff §5.5). Fix and re-review until PASS with no unresolved P0–P2. Every P3 goes to Tân.
4. **PR body.** Write it to a file, with these sections in order:
   1. `## <WP> — PR <X>: <name>`, then one line with the WP id and "PR X of N", the spec and plan paths with the owner's verbatim approvals, and the docs branch.
   2. `### What changes`: bullets per file or area.
   3. `### Owner decisions / amendments (YYYY-MM-DD, verbatim)`.
   4. `### Brief clarifications (not plan changes)`, only if there are any.
   5. `### Evidence (head <short sha>)`: one bullet each for Builder, Tester, browser pass and Astra (with its thread id).
   6. The attribution line.
5. **Open the PR** with `gh pr create --base main --head <branch> --title "<title>" --body-file <file>`.
   - Do not open it as a draft.
   - **Never** add a `--label` that triggers automation, and never request reviewers.
6. **Wait for CI.**
   - Poll `gh run list --branch <branch> --workflow "Quality Gate CI" --limit 1 --json databaseId,status,conclusion,headSha` every 60 s in the background.
   - Read the unit and smoke counts from `gh run view <id> --log`.
   - Read bot reviews from `gh api repos/tanntran2000/Build-Settlement/issues/<n>/comments` and `.../pulls/<n>/comments`.
   - Check `gh pr view <n> --json mergeStateStatus`.
7. **Send to dot.** If everything is green and the state is CLEAN, send the dot message (handoff §5.6). Log the PR and the dot message (§A6).
8. **After the merge.**
   1. Run G6 (handoff §6.5).
   2. Send the G6 message to dot.
   3. Log it.
   4. Tell Tân in Vietnamese, and ask before starting the next PR.

## A5. Tester thread (new separate role)

Start one Tester thread per PR, after the Builder pushes. Brief:

```text
[Codex (Orchestrator) -> Tester] <WP> PR <X> — independent test pass on head <full sha>
You are the Tester (Codex Sol 6.1). Do not edit, commit or push. Do not install anything.
Worktree C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01, branch <b>; run `git fetch origin` and confirm HEAD == <full sha> and the tree is clean.
Run in order, stop at the first failure, record command / exit / counts:
git diff --check origin/main...HEAD; npm run lint; npm run typecheck; npm run check:architecture; npm run test:architecture; npm test; npm run build (JS/CSS gzip); then with ports 4173/4174 free CI=1 npm run test:smoke.
If a test fails: re-run that test alone once; if it passes alone, re-run the whole command once; report both runs. Never change a test, timeout or threshold. Known flaky cases: handoff §6.4.
Reply: HEAD, each gate with exit code and counts, smoke total and duration, any re-runs with reasons, the list of changed files (git diff --name-only origin/main...HEAD) and confirmation that no .github/, config or dependency file changed.
```

Concurrency rules:
- **Only one test-running thread at a time in the worktree.**
- Never run the Tester while the Builder is still working, or while Astra runs vitest. Start Astra after the Tester finishes, or tell Astra not to run tests.
- On 2026-11-06, CPU contention produced false 5 s unit timeouts and e2e failures.

**The browser pass stays with the Orchestrator**, using preview tools (handoff §6.3). If you have no browser tools, ask Tân to look at a screenshot from the Tester's Playwright trace, and log that you did.

## A6. Audit trail Claude needs on return (extends handoff §10)

Claude will have none of your context, so leave everything in git. On `docs/codex-orchestrator-handoff`, using plumbing commits (handoff §4.3):

1. **Log entries.** Keep appending one entry per event to `docs/verification/HANDOFF-LOG-2026-11.md`, as you already do. Every entry names the T3 thread id(s) involved.
2. **Saved messages.** Save every message you send as a file under `docs/verification/handoff-2026-11/`, named `NNN-YYYYMMDD-<event>-<wp>-<pr>.md` (`NNN` is a running number from `001`). Example: `004-20261106-builder-brief-ui-ledger-01-prB.md`. This covers:
   - Builder briefs and continue messages;
   - HOLD answers;
   - Tester briefs and Astra briefs;
   - dot messages and PR bodies;
   - questions to Tân, together with his verbatim answers.

   Reference the file number in the log entry.
3. **G6 entry.** For each PR, the last log entry is G6, with:
   - the merge sha;
   - both tree hashes;
   - the main CI run id;
   - the unit and smoke counts.
4. **Spec or plan changes** go to their docs branch with the amendment line (§A3), and the log names the commit.

With this, Claude can rebuild exactly what happened, in order, from git alone.
