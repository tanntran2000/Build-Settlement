# Existing PR #83 body snapshot

- PR: https://github.com/tanntran2000/Build-Settlement/pull/83
- Head: `ebb0d2a252624abfadbd25bf0579742ceb7d7a47`.
- Original body authored before the Codex takeover. Saved for the return audit; this snapshot does not open or update a PR.

## PR body (verbatim)

## UI-LEDGER-01 Lord's ledger — PR A: ledger shell

WP UI-LEDGER-01, PR A of 2 (pixel sprites follow in a later art PR). Spec `docs/superpowers/specs/2026-11-03-ui-ledger-redesign-design.md` v0.4 (owner: "Approve G1") and plan `docs/superpowers/plans/2026-11-06-ui-ledger-redesign.md` (owner: "Approve, Builder A"), both on branch `docs/ui-ledger-redesign`.

### What changes
- `packages/ui/src/ledger-theme.css`: spec §4.2 tokens and `--px`; every existing shell colour token re-valued; flat materials (walnut board with brass-nail corners, oak plaques, parchment cards, red wax buttons); wood page background with reading content on parchment; unfaded disabled controls (muted ink, dashed border, `aria-disabled`).
- Pixelify Sans: the upstream variable TTF from google/fonts `8b0a1d0` shipped byte-identical (79,160 bytes, SHA-256 `9ba86cd0…e8a5`), with its OFL licence (one trailing space removed). One `@font-face`, applied to the shell only; `app.css` untouched.
- `CharacterLifeShell.svelte`: stylesheet import and class hooks only. No behaviour or visible text change — the Report is still a dialog (PR B moves it).
- Tests: `ledger-contrast.test.ts` (9 WCAG pairs); e2e checks for the font family at 1280 px and a blocked-font layout at 375 px; pre-ledger colour/opacity pins in `character-life-navigation.spec.ts` now read the ledger tokens.

### Owner decisions during the build (2026-11-06, verbatim)
- "Dùng thẳng file TTF (Recommended)" — no WOFF2 converter on the machine; ship the upstream TTF (spec §4.3 / plan Decision 2 amended).
- "Xóa dấu cách thừa (Recommended)" — the upstream OFL.txt trailing space failed `git diff --check`.
- "Kiểu mới, sửa test opacity (Recommended)" — the old 50 % white fade read 1.19:1 on parchment; disabled controls are not faded (spec §4.1 amended).
- Only `--focus` departs from the spec's indicative values: `#79719f` (3.19:1 on parchment, 3.24:1 on wood).

### Evidence (head `ebb0d2a`)
- Builder (Codex Sol 6.1 xhigh): gates 1–8 exit 0; unit 1,930 (+9); full smoke `CI=1 npm run test:smoke` **275 passed**; accessibility + reference layouts 20/20.
- Claude (tester), gates 1–7: all exit 0 (the 60-week unit test timed out once at 5.8 s under concurrent load and passed on rerun, 17/17; full rerun 1,930/1,930, R-012); build JS 94.71 kB, CSS 5.01 kB gzip. Browser pass at 1280 px: board, plaques, wax End Week, parchment cards and Pixelify Sans render as specified.
- Astra (independent review): **PASS**, no P0–P3; verified the font byte-for-byte against upstream and the licence diff, contrast values, and that only authorized assertions changed.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
