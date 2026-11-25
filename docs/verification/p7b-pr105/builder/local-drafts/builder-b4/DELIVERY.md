# B4 delivery evidence

Head `15cfc2c71aba0799e4d936c09b77529a53724272`, tree `d9225177b6c416384112f6bf340a4b11b8302273`, branch `feat/p7b-servants-wages`. Tested against main `95821832a8c95988c3203b4c38f5f9ae665978e9`.

Tân’s approvals include “Duyệt P7-B”, “Duyệt, giao B1”, “Start B4 Step 0”, “Gold của city (Recommended)”, “Cô ấy mang đồ đi (Recommended)”, “Làm tròn lên 1 Gold (Recommended)”, “Duyệt tất cả (Recommended)”, “Duyệt 2 chỗ sửa (Recommended)”, “Duyệt sửa locator (Recommended)” and “Duyệt + cho sửa kỳ vọng nhỏ (Recommended)”. The [26-path verifier](exact-head-bytes-delivery.txt) checks all approved changes against Git blobs.

| Check | Exact-head result |
| --- | --- |
| [1. Diff](gate-1-diff-delivery.txt), [2. lint](gate-2-lint-delivery.txt), [3. typecheck](gate-3-typecheck-delivery.txt) | All exit 0 |
| [4. Architecture](gate-4-architecture-delivery.txt), [5. architecture tests](gate-5-architecture-tests-delivery.txt) | Exit 0. 154 tests passed. |
| [6. Unit](gate-6-unit-delivery.txt), [7. build](gate-7-build-delivery.txt) | Exit 0. 3,286 tests passed. |
| [8. Full Chromium smoke with CI=1](gate-8-smoke-delivery-retry.txt) | Exit 0. 417 passed. |

[CPU and ports before gates](environment-before-gates-delivery.txt) · [Before smoke](environment-before-smoke-delivery-retry.txt) · [After smoke](environment-after-smoke-delivery-retry.txt)

The approved B4.1 and B4.2 commits passed their focused unit and desktop runs. Correction 24 preserved whole-roster equality and updated the expected countdown to 19. The earlier full smoke run passed 415 checks and found two viewport cases with the same stale Gold total. Correction 24 item 2 allowed the exact 20,000-milli wage addition. It leaves the previous 30,000-milli total, whole-report/whole-checkpoint parity, stock pins, and timeouts in place. [Exact expectation amendment](c24-goods-stock-expectation.json) · [Original failing smoke](gate-8-smoke-c24.txt) · [Five-week debit proof](c24-goods-scope-proof.txt) · [Both viewports passing](c24-goods-stock-green.txt)

The machine entered Button or Lid sleep during the previous exact-head smoke run. That run recorded 416 passes and one timeout. The timed-out case passed in isolation after wake, followed by the full retry on the same bytes. [Interrupted run](gate-8-smoke-delivery.txt) · [Windows events](smoke-forced-sleep-events.txt) · [Isolated result](workforce-after-wake.txt)

All three roads completed 40 contiguous weeks each before B4.2 was committed. [Road data](road-balance.txt) · [Road verification](b42-road-completeness.txt)

## Measurements

- **Bundle** 173,844 bytes gzip, 166,080 JS plus 7,764 CSS. Main was 169,863 bytes. Headroom to 200,000 bytes is 26,156. [Served asset hashes](bundle/bundle-and-served-hashes.json)
- **Checkpoint** 100 NPCs, 86 notices in the synthetic capacity fixture, 12 stock rows, 2 lots and 14 departures. JSON is 294,186 bytes. Serialized browser IndexedDB is 309,847 bytes across 104 rows. Browser Continue and export reproduced the exact input bytes. [Measurement](save-size/largest-notice-measurement.json) · [JSON](save-size/largest-notice-save.json) · [IndexedDB rows](save-size/largest-notice-indexeddb-rows.json)
- **End Week** Main and B4 ran the same v13 checkpoint bytes per case. Each fresh process measured one cold and 20 warm ticks. Five alternating pairs per case included a second main process for noise. [Comparison](timings/comparison.json) · [Raw times](timings/raw-timings.json) · [Inputs and equipment exit proof](timings/inputs.json) · [CPU before](environment-before-timings.txt) · [CPU after](environment-after-timings.txt)

| Case | Main warm median | B4 warm median | Median paired change | Largest main-to-main gap |
| --- | ---: | ---: | ---: | ---: |
| control | 57.58 ms | 52.29 ms | -5.74 ms | 20.60 ms |
| market | 55.15 ms | 55.62 ms | -2.11 ms | 47.74 ms |
| short-gold | 57.46 ms | 54.05 ms | -1.10 ms | 25.45 ms |
| departing-equipped | 55.00 ms | 55.94 ms | -0.23 ms | 26.01 ms |

The manifest covers verification output, exact amendments, benchmark source and inputs, and raw artifacts. The assigned branch worktree and primary checkout are retained. Project storage reclaimed 0 bytes. [Pre-push scope and credential signature check](push-scope.txt) · [Manifest](SHA256SUMS.txt)

The remote branch resolves to the same head. [Push log](branch-push.txt) · [Remote head proof](remote-head.txt)
