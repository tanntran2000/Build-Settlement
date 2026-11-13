# DATA-01 PR B review fix round1: F1/F2

Status: Builder fixes and gates complete; independent re-review and Tester smoke pending. No full smoke, push, amend, force-push, GitHub edit or merge performed.

| Identity | Value |
|---|---|
| PR | https://github.com/tanntran2000/Build-Settlement/pull/91 |
| Branch | feat/data01-catalogs |
| Tested local HEAD | 7a92d4cab8e87967ec90e8e986d8223de27d6c76 |
| Tested tree | 9b1082da1a427175e6d7636ac4001017e769dff6 |
| Parent | 8c0657e3558c3657b70ab71b1038e33fec1f6e9a |
| Original value base | 5cc2522f27e01b49baaa6e44bba01904edcea5c0 |
| Builder / UTC | Codex / 2026-11-13T06:45:54.184662+00:00 |
| git status --short | Empty |

## Findings and exact changes

[Astra review](https://app.t3.codes/threads/82f1d24c-48b3-45c2-816a-f3148433510a/mcp%3A263bb217-c6e9-42c9-8806-2372bb5c8551) supplied F1(P2) and F2(P3); this fix claims neither a new independent verdict nor resolution of the reviewer's separate diff-coverage limitation.

F1: change only LAW_MESSAGES.VOTE_SHORT's literal type in validate.ts from U+00C3 U+201A U+00C2 U+00B7 to the single U+00B7 separator. UTF-8 bytes now **C2 B7**, with no BOM. The runtime JSON already had the correct message and was not changed. Add expectTypeOf against the exact original message in catalog-data.test.ts.

F2: add16 SHA-256 hex literals to catalog-data.test.ts, one per original constant; compare SHA-256 of UTF-8 JSON.stringify(constant), preserving key order. Add a structuredClone mutation control (Hospital upkeep+1 must differ). Existing schema tests remain intact. Exactly2 changed repository files; no JSON, fixture, generator, dependency or config change. [Full patch](fix1.patch).

Commit: `fix(core): restore the vote message literal type and pin catalog values to base`. Body names Astra F1/F2 and ends with the required Co-authored-by trailer. New commit; not amended or pushed.

## F1 RED/GREEN and bytes

1. Added the exact literal-type assertion before correcting validate.ts. [RED npm run typecheck](f1-red-typecheck.txt): exit1, TS2344 explicitly reports expected single U+00B7 versus the four corrupted code points. This proves expectTypeOf is enforced by this repo's typecheck.
2. Applied the single literal correction and wrote UTF-8 without BOM. [Byte dump](f1-byte-dump.txt): before C3 83 E2 80 9A C3 82 C2 B7; after **C2 B7**.
3. [GREEN npm run typecheck](f1-green-typecheck.txt): exit0. [Focused catalog suite](f1-f2-green-focused.txt): **38/38 passed**.

Development logs name the committed parent HEAD/tree and describe the uncommitted RED/GREEN edits. The final gates below test the clean committed fix.

## Independent original-value hash proof

[compute-base-hashes.mjs](compute-base-hashes.mjs) reads original TypeScript directly from Git blobs at the pinned5cc2522 SHA, transpiles/evaluates it in memory, and computes each expected hash from the original constants. It does not use the extracted JSON to compute expectations and creates no checkout/clone. Every original value also matches the pre-extraction capture. [Full command/output/base SHA](base-hashes-output.txt), [per-source Git blob/SHA256 manifest](base-source-manifest.json), [base values](base-values.json), [machine-readable comparison](base-hashes.json).

All16 current hashes match; no extraction value or key-order drift. The hashes are embedded in the committed test and verified again by the final full-unit gate. The cloned-value negative control also passed.

| Constant | Base SHA-256 | Current match |
|---|---|---|
| TRIAL_BUILDINGS | `13a5fcdd7e40703bd2223b73d051b2f43faa4d5034624f1d837ca2350441c6f2` | MATCH |
| SOCIETY_BUILDINGS | `6cd3c9b125985dba80bcc522e8d35facd313578d0812f9c3e4de307e12fb93f8` | MATCH |
| LAW_CATALOG | `349c5a8109867abfd74ca3a7f2eddfedfe1ea3383744609a30e7d81b98a42783` | MATCH |
| LAW_TRIAL | `eb531c3aa1fad89b2d4c918b13a040f4c6940f48295bccda8feb01b5b76ad5d9` | MATCH |
| LAW_MESSAGES | `b1604af8f5ef88797692d5889c97e05683d90c5e40ae73be5194fe2d4359d35d` | MATCH |
| RESEARCH_TOPICS | `385099be87e4298a2e5b5bc941fd2998bf938212f3d194b0a5b96f784c17e249` | MATCH |
| OUTSIDE_PLOTS | `362281328564816894d00020e1c6bc07079fe3c53441d6295280af1aef6b6030` | MATCH |
| ORDER_TRIAL | `b984a299a145cf032cd3781d2e5f91acf04a68f445a21624004c50cab36b2c97` | MATCH |
| GARRISON_TRIAL | `4143c1462f581114f45b89afa976c6917d984ea1550601205c4eb7655602c5ef` | MATCH |
| CRIME_TRIAL | `f0870b86f87072a009bef7a53511704f6b0ddb5b2e5d9c1de6a7b6dbb44ce1d1` | MATCH |
| CRISIS_TRIAL | `e84e3064f8941cfbf4187fb6708577d62ada085696047d19dc52d62e16e528d6` | MATCH |
| SOCIETY_TRIAL | `702c65dd3836e476f85411b395f0219980c8e1677a8700be1c05a02a6010a4a8` | MATCH |
| GOODS_STOCK_TRIAL | `6e46090f98a4db0231da0659fc6a1788e743dc365de21e4ced5f142b5c7771f2` | MATCH |
| TILE_TRIAL_BALANCE | `8c6f563db7d15d0e01ca16852bd5700d2c8504a279f63d14ffcd7e01999b6075` | MATCH |
| IMMIGRATION_TRIAL_DEFAULTS | `9a3a102558fc1ac452d330d72d162a21793b674002acf3026b9f2b5a6e9bdcef` | MATCH |
| OUTSIDE_TRIAL | `e4d5ed7cc9056c8ec0e89263f7633c0d6d262feba89afb3a88484a312417e5db` | MATCH |

## All non-ASCII and literal types

[audit-unicode-and-types.mjs](audit-unicode-and-types.mjs) independently regenerates original public types using a TypeScript compiler host reading pinned Git sources. All **242 literal-type leaves** match validate.ts, across16 aliases. [Literal audit](literal-type-audit.json), [regenerated original types](base-types-from-git.json).

All10 new PR B files were scanned completely as UTF-8 without BOM. Non-ASCII occurrences are exactly:

| New file | Location | Code point / UTF-8 | Origin match |
|---|---|---|---|
| catalog-data.test.ts | 69:85 | U+00B7 / C2 B7 | origin/main@5cc2522 packages/core/src/trial/law.ts:48 |
| laws.json | 161:49 | U+00B7 / C2 B7 | same original message at law.ts:48 |
| validate.ts | 292:47 | U+00B7 / C2 B7 | same original message at law.ts:48 |

The other7 new files are ASCII only. No other non-ASCII drift. [Complete ten-file/source-matched inventory](non-ascii-audit.md), [machine-readable occurrences](non-ascii-audit.json), [full audit output](unicode-and-types-output.txt).

## Gates1-7 at clean final head, strict sequence

| Gate | Command | Exit | Full log |
|---|---|---:|---|
| 1 | `git diff --check origin/main...HEAD` | 0 | [gate-1-diff.txt](gate-1-diff.txt) |
| 2 | `npm run lint` | 0 | [gate-2-lint.txt](gate-2-lint.txt) |
| 3 | `npm run typecheck` | 0 | [gate-3-typecheck.txt](gate-3-typecheck.txt) |
| 4 | `npm run check:architecture` | 0 | [gate-4-architecture.txt](gate-4-architecture.txt) |
| 5 | `npm run test:architecture` | 0 | [gate-5-architecture-tests.txt](gate-5-architecture-tests.txt) |
| 6 | `npm test` | 0 | [gate-6-unit.txt](gate-6-unit.txt) |
| 7 | `npm run build` | 0 | [gate-7-build.txt](gate-7-build.txt) |

Full unit suite: **2,234 passed across101 files**. Architecture tests: **154 passed**. No final gate skipped or rerun. Full smoke is explicitly assigned to Claude(Tester) and was not run here; no smoke PASS is claimed.

## Preservation and handoff

Fixture blob remains `64c18a2688573e3fe3b8ec0b131cd0318f4d4855`. JSON files and the golden fixture/generator are unchanged from the parent. Assigned worktree retained; no new worktree/clone, no installs, storage reclaimed0 bytes. Ports4173/4174 verified free in ports.txt.

T3 PR-link registration was attempted but failed because this tool client requires an explicit threadId; see pr-link-note.txt. This did not edit the PR. Commit remains local for Claude's handoff.

All text evidence UTF-8. SHA256SUMS.txt recursively hashes fix1 artifacts except itself. Before G5 the Orchestrator still owns exact-head evidence publication on the WP docs branch, independent review, remote CI and authorized merge routing. This Builder performed no push, PR edit or merge.
