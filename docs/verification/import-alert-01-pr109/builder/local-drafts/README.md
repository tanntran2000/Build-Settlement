# IMPORT-ALERT-01 Step 0 package

The Builder’s preflight is at **HOLD** on detached base `bcd643fcd66a787904989051b08e85e4304608a2`, tree `0ac0120539e03a9a1ed2e1ab05ce7dbc63428095`.

| File | Contents |
| --- | --- |
| [STEP0-HOLD.md](C:/Users/Admin/.t3/local-drafts/import-alert-01/STEP0-HOLD.md) | Owner’s recorded decisions, current import paths, assertion-by-assertion review, proposed viewport cases, expected RED, and allowlist. |
| [byte-inventory.json](C:/Users/Admin/.t3/local-drafts/import-alert-01/byte-inventory.json) | Exact UTF-8 replacements in five existing Git blobs and the complete proposed Playwright file. |
| [SHA256SUMS.txt](C:/Users/Admin/.t3/local-drafts/import-alert-01/SHA256SUMS.txt) | SHA-256 digests for the three delivered files and the verified binding WP input. |
| [binding-plan-a486150.md](C:/Users/Admin/.t3/local-drafts/import-alert-01/binding-plan-a486150.md) | Existing binding plan. Its bytes match the committed plan at `a486150`. |

The JSON offsets refer to the original Git blobs with LF separators. Use each edit’s `beforeUtf8` and `afterUtf8` together with the offset and sizes. The rest of the original bytes carry forward, including the BOM in the existing session helper. The proposed new spec is the entire `afterUtf8` value for the added file.

The two expected RED cases are malformed JSON and a valid v14 envelope with an invalid robbery card. The prediction comes from the baseline source. No application tests ran in Step 0.
