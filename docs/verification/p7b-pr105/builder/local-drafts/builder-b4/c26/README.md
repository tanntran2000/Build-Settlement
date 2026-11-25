# P7-B B4 Correction 26 · Builder verification

Builder Codex · 2026-11-25  
Branch `feat/p7b-servants-wages`  
Tested head `90519b682846de9ad336c30db53f4b0b07afb2a2` · tree `b138254d44b76e3b2c8c6eb853449608a3bbc094`  
Base `origin/main` `95821832a8c95988c3203b4c38f5f9ae665978e9`

Owner (Tân), verbatim — “Duyệt patch P2 (Recommended)”.

The F2 commit applies patch SHA-256 `c50a6a311ba3dfb962c87c0bea9531dc2cbbc37d319095c9d68bb10899a35caa` above `0bd1b245262e4801b052f7eabbebbe2beec7d884`. The spec pins 4,000 milli of wages in each report and 30,000 milli of five-week debit after subtracting wages. [Commit and blob proof](commit.txt) · [Exact approved bytes](../c25/f2-proposal-byte-inventory.json) · [F2 RED](../c25/f2-red.txt) · [F2 GREEN](../c25/f2-green.txt)

| Verification | Result |
| --- | --- |
| Gates 1–7 | Pass · diff check, lint, typecheck, architecture, architecture tests, unit, build |
| Architecture tests | 154/154 passed |
| Unit tests | 3286/3286 passed |
| Full smoke with `CI=1` | 417/417 passed |

[Full gates log](gates-1-7.txt) · [Full smoke log](gate-8-smoke.txt) · [Pre-gates CPU and ports](environment-before-gates.txt) · [Pre-smoke CPU and ports](environment-before-smoke.txt) · [Post-smoke environment](environment-after-smoke.txt)

Windows system sleep inhibition was held for the full smoke command and released when it finished. The Playwright configuration, test timeouts and product sources retain their previous bytes.

## Measurements from `15cfc2c`

Only `goods-stock.spec.ts` and `household.spec.ts` changed since `15cfc2c71aba0799e4d936c09b77529a53724272`. The production bundle, largest-save and paired End Week measurements were reused under Correction 26. Gate 7 still ran on `90519b682846de9ad336c30db53f4b0b07afb2a2`.

- Bundle was 173,844 bytes gzip. [Bundle measurement](../bundle/bundle-and-served-hashes.json)
- The 100-NPC and 86-notice checkpoint measured 294,186 bytes as JSON and 309,847 bytes as serialized IndexedDB. [Largest save](../save-size/largest-notice-measurement.json)
- The paired End Week measurements carry forward, including main-to-main noise. R-026 remains open. [Paired timings](../timings/comparison.json) · [Raw timings](../timings/raw-timings.json)

The branch was pushed and the remote ref was verified against the tested SHA. No pull request was opened. [Push](push.txt) · [Remote ref](remote-head.txt)
