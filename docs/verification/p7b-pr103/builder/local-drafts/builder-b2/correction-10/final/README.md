# P7-B B2 Builder final evidence

**PASS** at `63cbdca96fc7a326d2d1204c0b0871dc34a6d14e`, tree `312797f184f6414064e5ecf81eb1fba7a7bc55d0`, on `feat/p7b-npc-generator`. Base `origin/main` `f73595b449db84b988d44a44cd33620efca9ecad`. Git porcelain is empty, ports 4173 and 4174 are free, and the detached comparison checkout was removed. [Final environment and commits](b2-3-environment-after.txt)

Owner Correction 10 decision, verbatim: “Sửa test + đo so sánh (Recommended)”. The Orchestrator authorized direct Playwright launch recovery under the existing Correction 10. The exact approved patch produced the final tree. [Correction 10 verifier](../verifier-final.json) · [Patch](../storage-fixture.patch)

## Storage RED and GREEN

- RED at `f31310c` hit the seven-versus-four assertion in the full suite and once in isolation. [Full RED](../../b2-3-smoke.txt) · [Isolated RED](../../b2-3-isolated/001.txt)
- GREEN was collected as exactly one test before execution. The direct runner recorded `CI=1` and passed the case without changing its seven-row, migration or save-parity assertions. [Collection](../storage-authorized-list.txt) · [Run log](../storage-green-verified.txt) · [Result JSON](../storage-green-verified.json)
- Both implementation commits and the fixture commit carry the Codex co-author trailer. The verifier covers 112 paths. The third commit changes only the test fixture call and its helper import. The prior golden path audit covered three seeds, 83 byte-identical historical fixtures and ten v12 fixtures. [Golden audit](../../b2-3-path-diff-final.txt)

## Exact-head gates

| Gate | Command | Exit |
| --- | --- | --- |
| 1 | `git diff --check origin/main...HEAD` | [0](b2-3-gate-1.txt) |
| 2 | `npm run lint` | [0](b2-3-gate-2.txt) |
| 3 | `npm run typecheck` | [0](b2-3-gate-3.txt) |
| 4 | `npm run check:architecture` | [0](b2-3-gate-4.txt) |
| 5 | `npm run test:architecture` | [0](b2-3-gate-5.txt) |
| 6 | `npm test` | [0](b2-3-gate-6.txt) |
| 7 | `npm run build` | [0](b2-3-gate-7.txt) |
| Smoke | `CI=1 npm run test:smoke` | [0](b2-3-smoke.txt) |

The full smoke ran 409 cases in 33.7 minutes with one Chromium worker. 409 passed, 0 failed, 0 skipped and 0 flaky. Git Bash printed `CI=1` immediately before launching npm in the same shell. [JSON results](b2-3-smoke.json) · [Launcher](run-final-smoke.sh)

[Quiet-machine record before gates](b2-3-environment-before.txt) · [Before smoke](b2-3-environment-before-smoke.txt) · [After testing](b2-3-environment-after.txt)

## Served build and artifacts

Production and regression HTML matched their corresponding disk bytes. Both served builds agreed on JS and CSS SHA-256 hashes. [Served-build check](b2-3-served-check-and-bundle.txt) · [Raw measurements](b2-3-measurements.json) · [Script](measure-bundle.mjs)

| Metric | Result |
| --- | --- |
| JS gzip | 150.865 kB vs 145.737 kB on main. [Raw gzip](b2-3-index-CEFG8Xfl.js.gz) |
| CSS gzip | 7.567 kB vs 7.528 kB on main. [Raw gzip](b2-3-index-BJ9v1KVg.css.gz) |
| Combined gzip | 158.432 kB vs 153.265 kB on main. 41.568 kB of budget headroom. |
| 100-NPC save | 300,168 bytes, byte-identical across the comparison probe round trip. No serialization source or fixture save bytes changed in the test-only commit. [Prior save probe](../benchmark-probes.json) |
| 100-NPC End Week | Paired warm median difference +1.21 ms against 4.68 ms of observed same-revision variation. The accepted R-026 addendum covers both revisions' budget misses. [R-026 addendum](../R-026-addendum.md) |

The compiled JS build stamp changed from `f31310c` to `63cbdca`. The remaining JS and CSS bytes matched. Both screenshots were retaken at 1280×900. [Characters](b2-3-characters-empty-1280x900.png) · [Hall Move](b2-3-hall-move-1280x900.png) · [Capture log](b2-3-screenshots.txt)

[Final evidence manifest](SHA256SUMS.txt) · [Builder manifest](../../SHA256SUMS.txt)
