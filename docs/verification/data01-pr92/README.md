# DATA-01 PR C (#92): verification evidence

- **PR:** https://github.com/tanntran2000/Build-Settlement/pull/92
- **Branch:** `feat/data01-inspector`
- **Head:** `cd000039eb44cd76d8156ae3c2282d3f26b83d89`, tree `914488a9d93457a98ebd4b4cb2af5b0074bae7fa`
- **Base:** `main` `5ff521e` (PR B, #91, merged)
- **Plan:** `docs/superpowers/plans/2026-11-12-data01-game-data-storage.md` on this branch, at `6831e8f` with Plan correction 5. PR C = Tasks C1–C2, Decisions 13 and 14 (as amended). Spec §8.
- **Tester:** Claude (Orchestrator/Tester). **Date:** 2026-11-13.

## Result at the exact head (Claude, Tester)
`claude-tester/tester-gates-smoke-cd00003.txt` holds the full output.
- Runner: `claude-tester/run-gates-ci.sh`, run as `bash run-gates-ci.sh > tester-gates-smoke-cd00003.txt 2>&1`. The log shows `CI=1 (exported before the smoke)`.
- UTC 2026-11-13T11:32:52Z to 12:14:35Z, with a clean status.

| Gate | Exit | Result |
|---|---:|---|
| `git diff --check origin/main...HEAD` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run check:architecture` | 0 | PASS |
| `npm run test:architecture` | 0 | 154/154 |
| `npm test` | 0 | 2,258/2,258 (103 files) |
| `npm run build` | 0 | JS 108.46 kB gzip (+135 B vs main, from the error-log ref only), CSS 5.81 kB (unchanged) |
| `CI=1 npm run test:smoke` | 0 | 350/350 (36.7 min) |

**CI:** `quality-gate` run 43417848692 at this head: **success**, smoke 350 passed (16.0 min), finished 2026-11-13T11:49:42Z.

## What PR C does
- **Dev-only data inspector** at `?mode=data-inspector`.
  - Mounted only under `import.meta.env.DEV`, through a dynamic import.
  - Two read-only tabs: Save (the IndexedDB tables, with counts and id search) and Catalogs (5 files, with counts and id search).
  - It opens `haven` without a version and aborts on upgrade, so it never creates or upgrades the database. It uses read-only transactions only.
  - In inspector mode the app does not initialize the error log and does not register runtime handlers (fix round 1).
- **Production exclusion:** `inspector-build.test.ts` runs a real production build and scans `dist` for `data-inspector` and `DataInspector`. A control measurement shows the inspector adds 0 production bytes (`builder/inspector-zero-byte*.txt`).
- **Error-log refs:**
  - the optional `ref` must match `^[a-z-]+:[A-Za-z0-9_.#-]{1,64}$`, otherwise it is dropped;
  - it is persisted and loaded with the entry, and old entries without it still load;
  - de-duplication includes it;
  - no call site is wired yet (correction 5).

## Builder (Codex gpt-6.1-sol, xhigh), thread `mcp:a89d0453`
`builder/` holds:
- RED (8 failed / 69 passed) and GREEN (77/77);
- the timeout HOLD and its measurements;
- the dev screenshot `dev-inspector.png` and the text dumps;
- the gates and the bundle sizes;
- fix round 1 (`builder/fix1/`: RED 1 failed / 79 passed, GREEN 81/81).

The Builder's smoke at `cd00003` could not start: two leftover `vite preview` servers from this worktree held ports 4173/4174. Claude stopped them and ran the smoke (above).

## Measurement scripts and raw artifacts (AGENTS.md §6.2)
Added after dot's G5 HOLD (2026-11-13). These are the files the Builder actually ran or produced. Nothing was re-measured.
- **Bundle measurement scripts:**
  - `builder/measure-base-bundle.mjs`: main `5ff521e` baseline;
  - `builder/measure-final-bundle.mjs` and `builder/fix1/measure-final-bundle.mjs`: final heads;
  - `builder/measure-inspector-zero.mjs` and `builder/fix1/measure-inspector-zero.mjs`: the control build with the original `main.ts`, without the inspector route.
- **Dev capture:** `builder/capture-dev.mjs` and `builder/dev-server.mjs` produced `dev-inspector.png` and the text dumps.
- **Runners:** `builder/{gates,run,run-smoke,finalize}.py` and the same files under `builder/fix1/`.
- **Raw artifacts (committed):**
  - `builder/fix1/final-bundle-artifacts/index-B19EJRvO.js` and `index-DdNtS9j1.css`: the production bundle at head `cd00003`. The JS file's SHA-256 is `9cabd390…c191`, identical to the `dist` built by Claude's gate 7 at the same head.
  - `builder/fix1/without-inspector-control.js`: the control bundle without the inspector route.
  - `builder/baseline-bundle-artifacts/index-D_plm-J3.js` and `index-DdNtS9j1.css`: the main `5ff521e` baseline.
- **Not committed:** the remaining raw artifacts (first-round `abf206a` bundles and an extra baseline build). They are listed with SHA-256 and size in `builder/LOCAL-ONLY-ARTIFACTS.txt`; the files stay in the Builder's local drafts.

## Independent review (Astra, gpt-6-astra), thread `mcp:263bb217`
| Round | Head | Verdict |
|---|---|---|
| 1 | `abf206a` | FAIL, P2: the inspector route still ran error-log initialization and its handlers, which could delete or write localStorage |
| 2 | `cd00003` | **PASS**, no P0–P3 over `5ff521e..cd00003`. The regression is non-vacuous; the normal path is unchanged; production exclusion holds. |

## Approvals
See `owner-approval-record.md`.

## Limits
- Smoke runs on Chromium only.
- The startup regression mocks Svelte mounting. The inspector UI itself was checked by the Builder's dev capture, not by an e2e test (none was planned).
- The top-level `await` in the DEV-only branch needs a browser that supports it in dev.
- The error-log ref is not wired to any call site yet. That is a P6-A/P7 follow-up (correction 5).

`SHA256SUMS.txt` covers every file in this folder except itself, hashed from the committed git blobs.
