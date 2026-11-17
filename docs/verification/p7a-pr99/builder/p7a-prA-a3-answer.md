A3 HOLD answer from the owner (Tân), 2026-11-17, verbatim: "Approve baseline comparison (Recommended)".

Scope (diagnostic only, no code, test, timeout or config change):
1. Record CPU load and top processes first; start only when no other test, build or review job runs and ports 4173/4174 are free. Also record Windows sleep/resume events for the whole window (as you did before).
2. In the same worktree, check out base 753e450 detached (the feature branch stays at 56124513, untouched), run `npm ci` only if the lockfile differs (it should not), build exactly as the smoke does, then run each of the 3 cases alone, one worker, `CI=1`: the 375 px life-shell accessibility baseline, "fulfillment states match strip and report", and "U9 local and portable saves".
3. Switch back to feat/p7a-npc-life-data at 56124513 and run the same 3 cases alone again, same way.
4. Table: case × (base, HEAD) → pass/fail, duration, error line. Keep logs and traces in local-drafts (traces in the LOCAL-ONLY folder), update README and SHA256SUMS.
5. HOLD with the table. If a case fails on base too, say so plainly; if it passes on base and fails on HEAD, name the likely PR A cause from the trace, without fixing it.

Do not push, open a PR or merge. Leave the worktree on the feature branch, clean, ports free.
