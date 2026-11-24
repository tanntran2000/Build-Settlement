# P7-B B2 — HOLD before the second commit

**Status: B2.1 committed. B2.2 is on HOLD for approval of the 23 byte adjustments in [b2-2-amendment-proposal.json](b2-2-amendment-proposal.json).** The worktree and index are clean. The archived B2.2 patch reapplies to the exact B2.1 HEAD and the candidate tree was independently byte-verified before restore.

| Identity | Value |
| --- | --- |
| Owner Correction 8, verbatim | “Duyệt 3 chỗ sửa (Recommended)” |
| Binding plan | `binding-plan-c6448c5.md` SHA-256 `a4d8e922aa45387168d79a0f75bf73d8a0de9fd2670799bdee0493108926576b` |
| Base | `origin/main` `f73595b449db84b988d44a44cd33620efca9ecad`, tree `fd04e1f2d7f6f47270a2e7ac82d18b68729a6372` |
| Branch HEAD | `feat/p7b-npc-generator` `58b4f2d59b1dddff5841db67970b561f3679bfbd`, tree `95e2bac1a748b98b7be52ef09f3795c5516baa18` |
| B2.1 commit | `feat(core): seeded npc generator and price` with `Co-authored-by: Codex <noreply@openai.com>` |
| B2.2 candidate | Tree `62c34cb35c597b26f936f938f924d6449e0094ad`. 111 paths verified across B1 → candidate. Diff from B2.1 is 109 paths. [Candidate byte verifier](b2-2-candidate-verifier.json) · [Reapplicable patch](b2-2-candidate.patch) |

## Tests and gates

| Check | Observed result |
| --- | --- |
| B2.1 | Original RED 33/33 expected failures. GREEN 32/32, with the exact 45000 comparison moved to B2.2, and core typecheck exit 0. [Original RED](b2-1-red-recorded.txt) · [GREEN](b2-1-green.txt) · [Typecheck](b2-1-core-types.txt) · [Verifier](verifier-b2-1.json) |
| B2.2 RED | Nine unit cases failed, including the preserved 45000 exact-error case, and three browser cases failed at the absent new UI. The desktop RED run used the B1 checkpoint fixture through real import with the same home assertions. The final desktop test bytes use the approved generated fixture helper. The extra real New Game RED proved the empty-roster hint later captured in the existing amended creation test and the screenshot. [Unit RED](b2-2-red-unit.txt) · [Browser RED](b2-2-red-browser.txt) |
| B2.2 focused GREEN | 41/41 generator and homes unit cases, 2/2 Chromium desktop homes cases at 1280 and 1600 with `CI=1`. [Unit](b2-2-green-unit.txt) · [Browser](b2-2-candidate-homes-browser.txt) |
| v12 and golden | 55/55 fixture generation checks, 4/4 golden tests. Audit verified 3 seeds, 83 byte-identical historical fixtures, and 10 v12 fixtures. Forbidden paths 0. [v12](b2-2-v12-generation.txt) · [Golden](b2-2-golden-generation.txt) · [Path diff](b2-2-path-diff.txt) |
| Candidate precommit | Lint exit 0. Workspace typecheck exit 2 at simulation. Persistence independently shows the same rootDir issue. UI and content typechecks exit 0. Broader unit diagnostic 3,180/3,186. [Lint](b2-2-precommit-lint.txt) · [Workspace types](b2-2-precommit-typecheck.txt) · [Persistence types](b2-2-persistence-types.txt) · [Unit diagnostics](b2-2-candidate-unit.txt) |
| B2.3 exact-head | Final gates 1–7 and the full `CI=1` smoke remain pending at a later clean B2.2 commit. The candidate tests and measurement artifacts are separate from final gate evidence. |

The workspace typecheck exposed 17 approved relative imports of the core NPC fixture helper in simulation and persistence tests. That imports the core source as a local file beyond each consumer's `rootDir`. The read-only TypeScript overlay substitutes a dedicated `@haven/core/testing/npcs` subpath using the existing workspace package resolution. Both TypeScript projects then report zero diagnostics. The package export and exact 17 import replacements require approval. [Compiler overlay proof](b2-2-test-helper-overlay.txt)

The broader unit run found five fixture or expectation defects affecting six cases. All are included in the proposed bytes.

1. The zero-manager-slot observation fixture removes both required homes. Retain the estates while clearing all other buildings.
2. The five-week law test still compares Gold to 36,890. Account for the approved +75,000 opening grant and retain the estate upkeep debit. The new exact value is 111,890.
3. Both pending-migration variants expect seven saved rows while their now-empty New Game fixtures produce four. Populate the fixtures with the existing three-NPC helper and preserve the seven-row assertions.
4. Data Inspector still searches an old starter prefix after the fixture IDs changed. Use a mixed-case substring shared by both generated IDs.
5. The core NPC boundary test mutates index zero of the empty New Game list. Seed one valid NPC before each mutation.

## Candidate measurements and screenshots

These measurements were taken on the byte-verified candidate tree before restoring the working copy to B2.1. The production and regression Vite builds agreed on the JavaScript and CSS asset names. Both served production assets matched their disk SHA-256 values. [Raw measurements](candidate-measurements.json) · [Measurement script](measure-candidate.mjs)

| Metric | Candidate |
| --- | --- |
| Bundle, gzip | JS 150.866 kB and CSS 7.567 kB, total 158.433 kB. Main total 153.265 kB. Candidate headroom 41.567 kB. |
| End Week, 100 NPCs | Cold 54.271 ms. Twenty warm ticks range from 37.604 ms to 44.962 ms, with the cold tick reported separately. |
| Save, 100 NPCs | 300,168 UTF-8 bytes and byte-identical after serialize → deserialize → serialize. [Raw save](candidate-100npc-roundtrip.json) |

Both screenshots are native 1280×900. The Hall screenshot shows three residents with Mansion selected for the first resident and the Move action available. [Characters empty state](candidate-characters-empty-1280x900.png) · [Hall Move](candidate-hall-move-1280x900.png)

The B1 base and assigned worktree were retained. The B2.2 changes were archived after their byte verification, then restored from the index to leave B2.1 clean. Ports 4173 and 4174 are free. [Builder manifest](SHA256SUMS.txt)

