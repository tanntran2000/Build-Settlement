Owner (Tân), 2026-11-17, verbatim: "Approve full smoke rerun (Recommended)".

Scope: one full `CI=1 npm run test:smoke` at HEAD 56124513 (tree d2f31706), same shell recording `echo "CI=$CI"` first. Before it: CPU + top processes, ports 4173/4174 free, no other test/build/review job, and make sure the served build is the fresh HEAD production build (the stale-asset issue you found). Record sleep/resume events for the whole window. No code, test, timeout or config change.

If it passes: update README, results summary and SHA256SUMS (keep the first failed smoke and the comparison as history), and reply with the final report the brief lists. If anything fails: rerun each failed case alone once, report both, HOLD.
Do not push, open a PR or merge. Leave the branch clean and ports free.
