# Owner-approved full smoke rerun

Owner Tân, 2026-11-17, verbatim: "Approve full smoke rerun (Recommended)".

Authorized scope: one unfiltered full `CI=1 npm run test:smoke` at HEAD `56124513aef2d85de128fe76bf3001654290c1c0`, tree `d2f31706d77d308a310b61857a8b293a898280e7`, with CPU/top processes and quiet-machine/port checks first, a fresh HEAD production build, the CI echo in the same shell, and sleep/resume records for the whole window. If cases fail, each failed case is rerun alone once, followed by HOLD. No code, test, timeout or configuration change, push, PR or merge is authorized.

The full invocation uses only `--output` to place artifacts in the sibling LOCAL-ONLY folder. It has no test selector, grep, shard, retry or timeout override. The unchanged Playwright configuration runs all 387 tests with one worker and zero retries.

`production-build.txt` records the fresh normal production build. `built-assets.json` records its disk hashes. `served-assets.json` independently records HTTP response bytes and SHA-256 from both Playwright preview servers, compared with the pinned HEAD production artifact. Read-only HTTP observation does not add a test or server.

`ci-echo.txt` and `full-smoke.txt` record `CI=1`. `start-machine.json` and `pre-smoke-machine.json` contain CPU, top processes, competing-job and port checks. `sleep-resume-events.json` covers the full wrapper window. Historical first-smoke and baseline-comparison evidence remains intact.
