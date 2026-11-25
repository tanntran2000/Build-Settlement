# Correction 20 smoke HOLD

The exact-head Chromium smoke ran with CI=1 and finished with 414 passed and one failed. The regression-build isolation test exceeded its 60,000 ms timeout. Playwright recorded 1.4 hours for that case and 2.0 hours for the full suite.

Windows recorded sleep from 2026-11-24 23:12:11.269 UTC until 2026-11-25 00:35:11.850 UTC, a span of 1 hour and 23 minutes during the smoke case.

The required single isolated CI=1 rerun passed. Playwright recorded 6.4 seconds for the test and 14.7 seconds for the isolated run, with exit 0. The full suite outcome still triggers the owner's HOLD rule.

The production and regression artifacts match the served hashes collected before smoke. Production JavaScript matches Correction 19 byte for byte after substituting the embedded Git revision. The worktree is clean, and both ports are free.

[Full smoke](gate-8-smoke.txt) · [Isolated rerun](smoke-isolated-01.txt) · [Windows sleep events](smoke-sleep-events.txt) · [Bundle proof](final-artifacts.txt)
