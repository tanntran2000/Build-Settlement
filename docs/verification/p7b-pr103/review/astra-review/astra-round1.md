# P7-B B2 independent review · round 1

**FAIL at `63cbdca`.** Four P1, three P2 and two P3 findings. P0 count is zero. All 112 changed paths match the authorized reconstruction. The blocking findings concern behavior and test coverage within those approved bytes.

| Target | Verified from local Git |
| --- | --- |
| Worktree / branch | `C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01` · `feat/p7b-npc-generator` |
| Base / tree | `f73595b449db84b988d44a44cd33620efca9ecad` / `fd04e1f2d7f6f47270a2e7ac82d18b68729a6372` |
| HEAD / tree, checked before inspection | `63cbdca96fc7a326d2d1204c0b0871dc34a6d14e` / `312797f184f6414064e5ecf81eb1fba7a7bc55d0` |
| Commits in order | `58b4f2d` generator and price → `f31310c` homes and starters → `63cbdca` storage migration test |
| Review basis | Astra 6.2 · 2026-11-24 · local Git blobs, source probes and archived execution records. No test runner or server launched during this review. |

## Findings

| ID | Location | Evidence, consequence and acceptance condition |
| --- | --- | --- |
| P1-1 | [packages/simulation/src/__tests__/npc-homes.test.ts:196](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/npc-homes.test.ts:196) | The new malformed-JSON assertion uses `toMatchObject({success:false})`. Returning the old-version refusal for broken JSON would pass. Assert the whole failure, including `INVALID_SAVE` and the exact message returned at `character-life-save.ts:41`. |
| P1-2 | [packages/core/src/world/__tests__/npc-generator.test.ts:223](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/world/__tests__/npc-generator.test.ts:223), lines 68 and 72 of the same file, and [packages/simulation/src/__tests__/npc-homes.test.ts:119](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/simulation/src/__tests__/npc-homes.test.ts:119) | Vitest 4.1.12 passes a string argument to Chai’s substring-based throw matcher. Appending arbitrary text to every catalog diagnostic keeps all these message assertions green. B2.1 requires exact messages. Compare the caught message with `toBe` and verify its error type. Apply the same exact comparison to the malformed-key and salt-exhaustion cases. |
| P1-3 | [packages/core/src/world/__tests__/npc.test.ts:48](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/world/__tests__/npc.test.ts:48) | The existing 200-seed case previously checked each name against the actual name pool. It now checks only the two-word pattern. A correctly capitalized name from outside the NPC’s culture passes. Assert membership of both words in the culture for each generated NPC in this same sweep. The separate generator test checks a different population (500 weeks, one seed, one Guild slot). |
| P1-4 | [packages/core/src/character/__tests__/session.test.ts:184](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/character/__tests__/session.test.ts:184) · base line 201 | The session suite dropped the assertion of the entire short description for a character/profile pair from a real session. Its final case checks IDs and hydration, without calling `describeShort`. The remaining Example A test at `character/__tests__/describe.test.ts:44` constructs the pair by hand. Pin one complete short description for a known generated session key to preserve the integration check across starter removal. |
| P2-1 | [packages/core/src/world/npc.ts:56](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/world/npc.ts:56) | B2 requires integer NPC affection. With a valid seed-42 world and its generated Guild NPC, changing only `relationshipToPlayer.affection` to `20.5` still passes `isNpcWorldSessionState`. The shared stat check at lines 25 and 40 only tests finite range. Both planning and live Character Life guards use this NPC validator. Require integer affection on the NPC path and exercise a fractional checkpoint. |
| P2-2 | [packages/core/src/data/validate.ts:1090](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/data/validate.ts:1090) | The data validator accepts `traitCount: [5, 5]` although `WORLD_TRAITS` has four entries. On draw five, `npc-generator.ts:32` splices an empty list and produces an undefined trait. A validated future TRIAL update can therefore generate an NPC that fails its own state guard. Validate the maximum against the count of available traits. The shipped [1, 2] range is safe. |
| P2-3 | [packages/core/src/data/validate.ts:1112](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/data/validate.ts:1112) and [packages/core/src/data/validate.ts:1137](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/data/validate.ts:1137) | Removing `sources.guild` produces `npc-generator.json#guild.: expected object`. Removing `price` produces `npc-generator.json#price.: expected object`. Both omit the required field between the dot and colon. Route absent or wrongly typed whole rows through a named parent field, and pin the entire error for each case. |
| P3-1 | [packages/core/src/world/npc-generator.ts:84](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/world/npc-generator.ts:84) | Each unsalted generation initializes the base-key RNG at line 74, then `createNpcLife` initializes it again at `npc-life.ts:35` and consumes five discarded draws. The returned values follow the required main-stream order because the generator replaces those fields. Reuse the life defaults without restarting the RNG and retain the exact sample pins. |
| P3-2 | [packages/core/src/world/npc-generator.ts:69](C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/packages/core/src/world/npc-generator.ts:69) | The exported generator guards every key component except the world seed. `npcLifeRandom` coerces it with bitwise XOR, so `NaN` and `4294967296` silently replay seed 0. Normal world sessions already restrict seeds to unsigned 32-bit integers. Apply that same boundary to the public entry point and cover the two valid endpoints and invalid values. |

The partial-match findings cover new assertions. Catalog array membership is an exact predicate for a sampled choice. Assertions tied exclusively to the deleted starter constants, their immutability and their fixed values were explicitly retired by Decision 9 and the Step 0 packet. The two existing-test findings above concern properties still applicable to generated NPCs. No added skip or per-test timeout was found.

## Reconstruction

I audited the Builder’s composition and verification scripts, then replayed the approved edits independently in memory against canonical base Git blobs. The historical Builder verifier trusts some candidate digests. This review started from the pinned before-text, checked every base digest and replacement, applied the later corrections, and compared bytes to the final Git blobs. The independent comparison exited 0. The ledger includes the final SHA-256 of each surviving path.

| Input or check | Reconstructed result |
| --- | --- |
| Binding inputs | Plan `ae6b5cee…8010d9`, spec `0460f262…c3428b5`. All five supplied Step 0 packet hashes and the C8 and C9 proposal hashes matched their pins. |
| C7 existing source | 457 line-range replacements in 90 files. Checked the original slice at each range, the base hash and the fully composed Step 0 after-hash, including the deletion. |
| C7 generated bytes | 19 entries, including golden, ten v12 siblings, generator sources/data and the path audit. Each after-text matched its declared SHA-256. Reconstructed the two additional unit suites from the archived RED files with C8’s gold rejection staged in the homes suite. |
| C7–C8 overlays | The generator JSON equals the original proposal with only `Briala` changed to `Veylathenne`. Final SHA-256 `03ee6792af7b5195f01ca8cfbd90311749f36a036df35017a46b5743c395895a`. Replayed the source-key type fix and the two import-placement fixes. |
| C9 | 23 hunks across 22 files, including the sole new package export, 17 test imports and five fixture/test adjustments. A Git search at HEAD found the helper specifier in 17 test files. Product imports: zero. |
| C10 | Replayed the two line replacements in the storage patch (import and fixture call). Only `tests/e2e/storage.spec.ts` differs from `f31310c`. The seven-row, migration and save-parity assertions retain their prior bytes. |
| Scope and final comparison | 91 modified + 20 added + 1 deleted = 112 paths. Exact agreement of expected and observed path sets. Every surviving blob matches reconstructed UTF-8 bytes. The deleted blob is absent. `git diff --check f73595b..HEAD` exited 0. |

## Acceptance evidence

**Generator and price.** The unsalted key forms `npc_w<week>_<building>_<slot>`. Origin determines culture. The retained stream draws the name, age, skills, traits, class, Mind, Lust, Beauty, hobbies, obedience, affection, preference, flaw, appearance and starting past in Decision 6 order. Salt retries draw from unused epithets and preserve all other bytes. The shipped data has five cultures with 16 given names and eight epithets apiece. The replacement’s original coinage and zero exact indexed hits are documented in C7’s additions. That supports its provenance without proving global name uniqueness across published games.

| Shipped source | Mind / skills / Beauty | Obedience / affection / past | Legal status and contract |
| --- | --- | --- | --- |
| Guild | 30–70 / 20–45 / 40–70 | 50–70 / 20–60 / 0–3 | servant, contract_bound, 20 weeks at 1,000 or 2,000 milli per week |
| Auction House basic / lot | 5–45 / 10–30 or 55–85 / 45–75 or 70–95 | 45–65 / 10–30 / 0–2 or 0–3 | slave, enslaved, null contract |
| Slave Market basic / lot | 55–95 / 8–28 or 55–85 / 30–65 or 70–95 | 20–45 / 10–30 / 5–12 or 10–20 | slave, enslaved, null contract |

Generated NPCs are female and aged 18–55. Lifelong status validates as contract_bound. The five part counters and partner total use outsider keys, alongside the three approved aggregates. Price uses the sum of five skills, Beauty and the sum of experience level values with 8/30/100 basis points, base 6/12/10/40 Gold (Guild/Auction/Market/lot), condition 1, whole-Gold rounding and 60% sale share. The B2 balance values are in JSON. The 10,000 divisor converts basis points, and the Gold scale converts milli. The cap of 100 and the unchanged two-Hall limit come from data.

**Homes, saves and UI.** Both New Game entry points start with zero NPCs. Character Life has zero NPC profiles and 120,000 Gold milli. Mansion beds are 10/20/30 and Hall beds 25/50. The exact-state command checks cover `NO_BED`, `NOT_A_HOME`, `NOT_IN_HALL`, `HOME_OCCUPIED`, fixed estates, stale revisions and Report lock. Moves mutate a clone. A move to the Mansion clears a post and a Hall-to-Hall move retains it through reload. Real household occupancy feeds the tile command. The UI dispatches commands and keeps destination drafts locally.

All 83 historical fixtures matched the pinned SHA-256 and their base Git bytes. The ten v12 siblings use the approved names and exact generated bytes. Old v11 portable and detached records reach the unchanged incompatible-save refusal. Golden seeds 0, 42 and 20261028 differ only at `cityRulesetId`, `state.city.society.rulesetId`, `state.npcs` and `state.profiles`. The full-history save has 100 NPCs distributed 30/50/20 with 20 recent entries each. Its 300,168 UTF-8 bytes round-trip exactly against the 1,048,576-byte budget.

The final Characters screenshot shows the Player-only roster and the exact Guild/Auction House/Slave Market hint. The Hall screenshot shows level 1, three of 25 beds used, three named residents, a Mansion destination and an enabled Move for the first resident, and disabled controls with a reason for the others. The recorded smoke log covers native keyboard selection, Move, focus restoration and Report-lock copy at 1280 and 1600 (lines 221–222) and NPC reflow at 320 and 375 (237–238). The no-destination, all-full and locked reasons are present in English in the home component. [Characters screenshot](C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-10/final/b2-3-characters-empty-1280x900.png) · [Hall screenshot](C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-10/final/b2-3-hall-move-1280x900.png)

**Performance decision.** The raw data support “within observed run-to-run noise” for the added warm command time on this machine. Twelve alternating fresh-process pairs timed one cold and 20 warm commands per side. Inputs differ only in the native ruleset and the B2 household fields. The benchmark measured the product at `f31310c`. The final commit changes only the storage test. [Comparison method](C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-10/README.md) · [Raw timings](C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-10/benchmark-raw.json)

| Across 12 process pairs | Main | B2 |
| --- | ---: | ---: |
| Median cold / misses ≥50 ms | 85.95 ms / 12 of 12 | 91.54 ms / 12 of 12 |
| Median of warm process medians | 46.57 ms | 47.77 ms |
| Warm misses ≥50 ms | 93 of 240 | 94 of 240 |

Median paired warm delta was +1.21 ms. The 96.14% median interval was −2.56 to +3.19 ms. Median absolute adjacent same-revision movement was 4.68 ms. Removing main’s pair-7 outlier gives +1.50 ms. The data permit a small added cost. The absolute 50 ms target remains open under R-026, confirmed at `3016302:docs/verification/PLAYTEST-RISK-REGISTER.md:108`. Correction 10 permits proceeding on the relative performance result. [R-026 addendum](C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-10/R-026-addendum.md)

**Recorded execution.** Builder and Claude independently recorded gates 1–7 at the reviewed head and tree, all exit 0. Both recorded 154 architecture tests, 3,186 unit tests and 409/409 full smoke with `CI=1`. The final Builder smoke reports zero skipped, flaky or unexpected cases. Final bundle size is 158,432 bytes gzip. This review used those logs for execution evidence. [Builder gates](C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-10/final/b2-3-gates.json) · [Builder smoke](C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/correction-10/final/b2-3-smoke.txt) · [Claude gate and smoke log](<D:/QI Technology/Temp/claude/22ffac96722a05a9/e7d04773-dfa7-4a71-9bc5-09bb6a13d94b/scratchpad/b2-tester/claude-gates-1-7-and-smoke-63cbdca.txt>)

## Per-file allowlist and reconstruction ledger

C7 source numbers are approved Step 0 replacement counts. C7 explicitly adds `trial/society.ts`, `CharacterLifeCity.svelte`, `TileManagement.svelte`, both B2 path-diff files and historical routing in `session-records.ts`. C9 adds `packages/core/package.json` for the test export. All other rows derive from the B2 file allowlist, its new tests and v12 fixtures, or its expressly approved existing-file edits. Each listed digest is for the full final Git blob.

| Git | Changed path | Authority and reconstruction | Observed SHA-256 |
| --- | --- | --- | --- |
| M | `packages/core/package.json` | C9 | `9b7b2ed3bcdd361ef3f86a73206fc7c69627f95719fa38e9f20769d72aa15b2d` |
| M | `packages/core/src/__tests__/catalog-data.test.ts` | C7 source ?2 | `2fa4314307557e0c7828b4a7b70d719443fb30be5be86156575b3caca97eee92` |
| A | `packages/core/src/__tests__/helpers/npcs.ts` | C7 generated | `0fafc0b97b85ee1c7dce3165258d9ff191189925f52fc88f6384bc7803dd71f2` |
| M | `packages/core/src/__tests__/society-world-integrity.test.ts` | C7 source ?1 | `215f7c7bc751f00f2744a8d0a43b2bf67cd673abf5b23be49af0865c5b87f12b` |
| M | `packages/core/src/character/__tests__/describe.test.ts` | C7 source ?4 | `864bc640dcf5fa4dc591d78f3c434514e9cd9f88c81a58f902c15759a864f653` |
| M | `packages/core/src/character/__tests__/session.test.ts` | C7 source ?15 | `360d9822b4114279cddf7f6efdedd58e1c6ff958f5e63a6fdc24663727dcebfd` |
| M | `packages/core/src/character/__tests__/validate.test.ts` | C7 source ?14 | `a2e3bea4e536a85439360ac971c993b2e7af8b5f60f4d44d40429f23119ce723` |
| M | `packages/core/src/character/session.ts` | C7 source ?4 | `f1c0271bd18e848f1245372782c279a4639a3bf1f52469772c8724a11de38d76` |
| D | `packages/core/src/character/starter-profiles.ts` | C7 source ?1 | `deleted` |
| A | `packages/core/src/data/npc-generator.json` | C7 generated, C7/8 name | `03ee6792af7b5195f01ca8cfbd90311749f36a036df35017a46b5743c395895a` |
| M | `packages/core/src/data/tuning.json` | C7 source ?2 | `e8f269cd2ccd5768671a6a9e7b4ac9c0cfa6b6e01ef7a7e8e8dc823b26692a17` |
| M | `packages/core/src/data/validate.ts` | C7 source ?5 | `c266e789aa749257d73f7c8a3194ba5ab2bb7ede3b4d11fcd1299154fea6dc70` |
| M | `packages/core/src/index.ts` | C7 source ?2 | `80f4ebd2bb5e524f9fec0b893adb5e5c8961409620e39e6c518b868d4dd4428a` |
| M | `packages/core/src/trial/__tests__/crime.test.ts` | C7 source ?1 | `9deefff90c97faa36bd9c5af6f507efd53e19a90a17aa59a34e9e4b582098f36` |
| M | `packages/core/src/trial/__tests__/crisis.test.ts` | C7 source ?1 | `78dff49049d1a75c5045f974e4d41b5e131dcf0846800062cfa2403d6e6db997` |
| M | `packages/core/src/trial/__tests__/items-canonical.test.ts` | C7 source ?2 | `228b66ece6e39211ea6e23c3b29dcea80a31768cd36a22117762f995da936804` |
| M | `packages/core/src/trial/__tests__/items.test.ts` | C7 source ?5 | `7cac5dc82a3f7dbbf0cf0cae98496df2010b83367c7695b1c39d168a434348df` |
| M | `packages/core/src/trial/__tests__/law.test.ts` | C7 source ?1 | `426ff78fe5a2979eea1ab9b2eea1ca3d1c002a47fef04b44625c56e5fefc24c5` |
| M | `packages/core/src/trial/__tests__/order.test.ts` | C7 source ?1 | `25571cd0b62aa74902130c99d5556be3a15399831d6333444d592d0c59632515` |
| M | `packages/core/src/trial/__tests__/outside.test.ts` | C7 source ?1 | `dcbfa7cd3a9f41eec848174993181d6dc8854e6fdd4350347287f5fa27ee4bf9` |
| M | `packages/core/src/trial/__tests__/society-p7b.test.ts` | C7 source ?7 | `34eda68b6d2ab36dae23741d8584021505efcc358c45feba7707f896f7bc592c` |
| M | `packages/core/src/trial/__tests__/society-stock-integrity.test.ts` | C7 source ?3 | `ba9e4444c06ab6be20fa89046960068e77e8ad0613a21e763b4a6c78f80f8733` |
| M | `packages/core/src/trial/__tests__/society.test.ts` | C7 source ?1 | `fa55155d76951569b0e26d00a73a4e9ed5bc35e6642847e51daea00e3645e270` |
| M | `packages/core/src/trial/society.ts` | C7 source ?1 | `dbf551e0af1b44220a6bd89a7b1257c6977291c8bb0e3327b30c279b204358f8` |
| A | `packages/core/src/world/__tests__/npc-generator.test.ts` | B2 unit RED + C8 staging | `8094699a2f27585d80a5525c32b6cc727a60bb50c7a241a92ca13cf4f871f425` |
| M | `packages/core/src/world/__tests__/npc-life.test.ts` | C7 source ?4, C9 | `4336c2272c02452dda9598007171d58c2380ec141f6339f78905a7c22ce8fa36` |
| M | `packages/core/src/world/__tests__/npc.test.ts` | C7 source ?17 | `f8b176f9aed51f57c64dce7c6efbc4c7c64452b76b9ef21e89f605339bb7f025` |
| M | `packages/core/src/world/__tests__/session.test.ts` | C7 source ?1 | `b15dfb4adf0f708badafdec4678074de1366aceb298e0318bbdf1484918d763b` |
| M | `packages/core/src/world/npc-content.ts` | C7 source ?2 | `de78b4f3e46b038681acc88e586bbadd0af623b241b151e1bd4b5d9630dd330e` |
| A | `packages/core/src/world/npc-generator.ts` | C7 generated, C8 | `097d32c5f1936e2874e6c64222d428c7e0b9773f899caeb46d9018685dd079a0` |
| A | `packages/core/src/world/npc-household.ts` | C7 generated | `af1151ca8a710cbdcc3fc645bb45a8aa777bab47e1b69d1b5f5d2b99de97abf2` |
| A | `packages/core/src/world/npc-price.ts` | C7 generated | `946fa58211165ca59d10b5f82d00ec9921011a08934f8f7dd814f45f91e9cb9d` |
| M | `packages/core/src/world/npc.ts` | C7 source ?4 | `23a64d1741ccabee8d763f8dcf02f0c94cf095e191b19d717be47bc1a50f3516` |
| M | `packages/persistence/src/__tests__/character-life-save.test.ts` | C7 source ?5, C9 | `a47f1f97d192294467244f09007a1caa9fce09fe0f76c72f04b719ba31307d0e` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/life-5-weeks.json` | C7 generated | `1b3d5c41867cb4035f6490b4b7faf0af7ebde99207d21e8d975e521778b87c91` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/life-crime-death.json` | C7 generated | `6d5f95e9f230d9f8b60a48fc4fe6610de44d85e5ded3c2f0b3b785d3079c7c70` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/life-crime-raid.json` | C7 generated | `3e38f65177a4510b1ad83a889f01d78fa16704463730caf417cfff69afee9b01` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/life-crime-robbery.json` | C7 generated | `f8e87bd7756bf74f0e1a85024b75b4e02ae4931cf26df0b90645bbc9dd3cb141` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/life-crime-wound.json` | C7 generated | `82b134804d1939585bc34c487f0c50fa9cbea08b0428e55a6733c1d0436397e4` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/life-demand-card.json` | C7 generated | `64a7238810c3b15c75d501998486a204426d30101fa3a853441bccab56f96e74` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/life-laws.json` | C7 generated | `aac802441ea780600bb1e83a34d54afe9aec358855c132a204f00bf999e965a5` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/life-new-game.json` | C7 generated | `b0ee4aab91df2168ab86bc10c49d8aad6411ed3fc71f51b4216d1c97bb7e9732` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/life-rebellion-last-week.json` | C7 generated | `e5d63b08c4b1e7c737d90546a7fcf34a347ba11a0b2c72e6d481a3787cb1a06f` |
| A | `packages/persistence/src/__tests__/fixtures/society-v12/new-game.json` | C7 generated | `e215b1e6b8f4e871443986cb5d80000339e4c221e372a0e068c8fb3f50a24f83` |
| M | `packages/persistence/src/__tests__/game-store-suite.ts` | C7 source ?1 | `1f6023bd5ed1f2d413ae6c2dbf178d355f5f6e79ca5c5ac16c874f4c873f8934` |
| M | `packages/persistence/src/__tests__/item-owner-import.test.ts` | C7 source ?3, C9 | `b151123de09474703da6ddcce33b259fb4dd068760f56df67bbb6d8a634658ac` |
| M | `packages/persistence/src/__tests__/item-records.test.ts` | C7 source ?7, C9 | `89df718eb62124c3b0c8b57e5cf35a375919a1991dca85b000db34adf435b095` |
| M | `packages/persistence/src/__tests__/items-canonical.test.ts` | C7 source ?3, C9 | `346bf4cad3c3b117ed4c4e81da1c8e7c49f6c3af5005396b3ad4438744880e29` |
| M | `packages/persistence/src/__tests__/items-rebuild-order.test.ts` | C7 source ?5, C9 | `58f3f9b959acbddc4a5ab66612451343e4523b14171c9e56862bfb084d7c0ace` |
| M | `packages/persistence/src/__tests__/npc-life-records.test.ts` | C7 source ?13, C9 | `e17842ab6ca3b5cd28d0eb49b6f434722a9776e0fbba9e1c44d8137e58720217` |
| M | `packages/persistence/src/__tests__/session-records.test.ts` | C7 source ?7, C9 | `d6bff697cef091b089320a1dfe56cb345cb015b265753e05c003a5823c29b7b9` |
| M | `packages/persistence/src/__tests__/society-new-game-fixture.test.ts` | C7 source ?9 | `821fa0ec7c0203a915d40d5cfb64047788e65f1ab3945cec77234ee54b310ef8` |
| M | `packages/persistence/src/__tests__/society-v9-fixture.test.ts` | C7 source ?1 | `0a76b1ae4d0903ee9e4044d4986ffe6fbb638962fa61243bba143093029f41b1` |
| M | `packages/persistence/src/session-records.ts` | C7 source ?7 | `8159f84620209ca54b67f0734e09c9c57b0a47485c29e9ad6d417328521aa5fb` |
| M | `packages/simulation/src/__tests__/character-life-command.test.ts` | C7 source ?11, C8, C9 | `a8149336c5047519ffddd8f6c2135c998e355cf1730155511100b7d626ed32d1` |
| M | `packages/simulation/src/__tests__/character-life-observation.test.ts` | C7 source ?5, C8, C9, C9 | `0ec1b5dba38cd2385237d62e65149d88646aea31aa1f0b23290a5c504c8939ce` |
| M | `packages/simulation/src/__tests__/craft-command.test.ts` | C7 source ?2, C9 | `5d83941ef5a46b7a5aa63a84c2fa89befe5597da0e5e2e0a2d9113f9b987a6cf` |
| M | `packages/simulation/src/__tests__/craft-week.test.ts` | C7 source ?6, C9 | `1666ba8c7cadc95f976b1c5ec64ee576b69163aebee1f53c8f0b912b940ab1ad` |
| M | `packages/simulation/src/__tests__/crime-fixtures.test.ts` | C7 source ?1 | `95d70d99fbc68540603f80e6015061963818a641457cdfbb99a80e95137a67e4` |
| M | `packages/simulation/src/__tests__/crisis-fixtures.test.ts` | C7 source ?1 | `d5a914e23795fe791ba8eb062d0aefd530e85a262526f8f3505f919b0fbccf7c` |
| M | `packages/simulation/src/__tests__/exhausted-materials.test.ts` | C7 source ?2, C9 | `c508b0569d7ccc30c9758411694744c6970ca9080dec690d6acbc3ff964490c6` |
| M | `packages/simulation/src/__tests__/fixtures/catalog-golden.json` | C7 generated | `8ca5ec1422f6731a6482b930ee073ee5555b6b97fe6d5ad7635436655faca61e` |
| A | `packages/simulation/src/__tests__/fixtures/p7b-b2-path-diff.ts` | C7 generated | `388e0263e2ad1c0e7a6bb2cbb48b7dbc4f652cc114d201d83f90aa963deb9458` |
| A | `packages/simulation/src/__tests__/fixtures/p7b-b2-path-diff.txt` | C7 generated | `fa0224ba231617a1921e76fac1eaaaa9b437b90eb235e3713972dfb439825837` |
| M | `packages/simulation/src/__tests__/item-command.test.ts` | C7 source ?5, C9 | `11efa74a565ef26c4ced67dc680f9f1d815366bdb387c94fae8e3dcaf42d50a0` |
| M | `packages/simulation/src/__tests__/item-effects.test.ts` | C7 source ?2, C9 | `1c09cbf2f8a4f80c0528613d8a3bdb45fbfd36c3a868ecfea18b03593fdaecd9` |
| M | `packages/simulation/src/__tests__/law-fixture.test.ts` | C7 source ?1 | `6268293619d3f604650f2c211a5dd7a91b158109ce184348914a8cf85f790101` |
| M | `packages/simulation/src/__tests__/law-week.test.ts` | C7 source ?1, C9 | `414e39f6510a952914c6044bf90e7dfa8c4b94d06dc7e84eac4edaf18d3662d9` |
| M | `packages/simulation/src/__tests__/lord-health.test.ts` | C7 source ?1 | `59014d0dbebbb0ac8fd309b3d98627ad5d16569b2520b003883f9580248c4706` |
| A | `packages/simulation/src/__tests__/npc-homes.test.ts` | B2 unit RED | `35e2eb078c5a6950dd7045f912fd0443856b253e4a85bd172948db6d52009c4b` |
| M | `packages/simulation/src/__tests__/npc-life-week.test.ts` | C7 source ?20, C9 | `2a3fce7bb2f851d92ac14762dfeab7f8f15d28740d7175ba7e09f44d5849cc64` |
| M | `packages/simulation/src/__tests__/smithy-data.test.ts` | C7 source ?1 | `0827b317a50c4cc6c8e4543d1dc77cd6a2668a88ee77a7f537acdd90c8596cf4` |
| M | `packages/simulation/src/__tests__/society-plots.test.ts` | C7 source ?1 | `649d15a1edeaa7d82aaa521b1ce06f3890f708aa009b232ca4223c5bc28c12b5` |
| M | `packages/simulation/src/__tests__/society-stock-integrity.test.ts` | C7 source ?4, C9 | `c33509c71e8ca864d9d6fda84b03ccad3ef96634b0a15825b8c8745cb5b32edd` |
| M | `packages/simulation/src/__tests__/tile-trial-p7b.test.ts` | C7 source ?4 | `4ddc6da2796e599814c8c378f8dcef585127ed38e7f2a116f83a2dc9ea23e0c4` |
| M | `packages/simulation/src/__tests__/world-npc.test.ts` | C7 source ?22, C9 | `e3b32f152a9ed07e267b8dc633924c5306357119d1bc562b28c7311043bbd89e` |
| M | `packages/simulation/src/character-life-command.ts` | C7 source ?3 | `cf27b681530075c04f287f05214fbf1c3629bfed4aeb16aaaec30501e072c040` |
| M | `packages/simulation/src/world-npc.ts` | C7 source ?6 | `eb3c594ebd1670ad255634beef92b723583108d4b7834dca5a72137ea4ee9c72` |
| M | `packages/ui/src/CharacterLifeCharacters.svelte` | C7 source ?6 | `8ba0c1a062549005ae11aa1aa8ceb596c8277ca1071859ab248be0ef05a40b37` |
| M | `packages/ui/src/CharacterLifeCity.svelte` | C7 source ?7 | `78fb2a18fdf91e64ec5ddb32c4aed66cb80278dec2b59a6915bf440b362db28d` |
| M | `packages/ui/src/TileManagement.svelte` | C7 source ?3 | `b9704503bec97ca6937de19dcd02c5d29078f44fe8200fdd1f758a48c414d5d9` |
| M | `packages/ui/src/__tests__/character-life-session.test.ts` | C7 source ?7, C9 | `274017530d1a1804fa4e7b7b8c9ce6caaf7d5600aeb1a48f4e2a8a20192d72e2` |
| M | `packages/ui/src/__tests__/crafting-view.test.ts` | C7 source ?2 | `11fa5e986dc7fc8d3f1049ccf9c90dc58d6ca88e6a01e2f19d79ee0aa60c3716` |
| M | `packages/ui/src/__tests__/data-inspector.test.ts` | C7 source ?6, C9 | `32c03b857de9e2c0f23bab2cbe52419495ebafe42771b407a48355774869d93d` |
| M | `packages/ui/src/__tests__/items-view.test.ts` | C7 source ?2 | `4ad26a7d3b5cd9ec4510bbd12e81139ad4544daf670bc82903805a98e3ba13a7` |
| M | `packages/ui/src/__tests__/npc-sheet-view.test.ts` | C7 source ?10 | `a1e8e063182366d3dd2e16ade76d1fc381863c4c4f35292c544298c72b9c6785` |
| M | `packages/ui/src/__tests__/report-letters.test.ts` | C7 source ?2 | `c51e5898e807d43ba9ce49e97ea204c6bf53bb29868fd6fe9f86663070bd4436` |
| M | `packages/ui/src/__tests__/world-npc-session.test.ts` | C7 source ?2 | `9cd464c4f2fb5dc55dd3d38f042f16ef7dd70bd39d079135e1a4e8a3b911153c` |
| M | `packages/ui/src/__tests__/world-session.test.ts` | C7 source ?1 | `d5a609ab0e200386a593c78bbad313f06b2d70f1c2595131de7941cc034b7dde` |
| M | `tests/e2e/character-life-boundary.spec.ts` | C7 source ?12 | `aeb952b1ea239fd1fca0c2d3e9efec52a08cd6b07b10e589159c52b972a3f77c` |
| M | `tests/e2e/character-life-navigation-accessibility.spec.ts` | C7 source ?5 | `e9de9e2712c5f43509c99a6c82f2cdf62fb3d25312b3d8bb32d9c8617cab68d9` |
| M | `tests/e2e/character-life-navigation.helpers.ts` | C7 source ?4 | `990d7b27dfb97b76ff625c69aaa76adfc95bdd778ee2c1616a17c405a91050f0` |
| M | `tests/e2e/character-life-navigation.spec.ts` | C7 source ?60 | `e4cbc4b172b485a382bb4fdda5085c65a2a5b43d5bf5a17d9a51885130bebfec` |
| M | `tests/e2e/character-life.spec.ts` | C7 source ?15 | `08a6f3e39c0177dabf83d14ce149a563147b6c3255278d4c51b53d95eb636f30` |
| M | `tests/e2e/crafting.spec.ts` | C7 source ?2 | `7e8670a5b73aa248dd29caf814c178a3dbb7c03e04b4c0121a2d33bd2bdd54ca` |
| M | `tests/e2e/crime.spec.ts` | C7 source ?1 | `b9fee8ea02b299aa11c447b82d1c56c56a0167b1af874c0603394cae25c8a2d2` |
| M | `tests/e2e/crisis.spec.ts` | C7 source ?1 | `b2e5d2b15ef142ed1694d782c517b4e67b75ab198ad87e3d14af8527d4e7001e` |
| M | `tests/e2e/error-log.spec.ts` | C7 source ?2 | `ed445ed8971043c710aeda4d3981ef722be1113f3033c7211dca4bb7765a3b65` |
| M | `tests/e2e/garrison.spec.ts` | C7 source ?1 | `7193a6fae4e68e04afc3de39b6d53ed724afdce78161443d0c39dbfc04f7f606` |
| M | `tests/e2e/goods-stock.spec.ts` | C7 source ?3 | `33d0840162e2616499cce4e38be0166ae9cd8add942e1a74cf84a725c353405d` |
| M | `tests/e2e/items.spec.ts` | C7 source ?4 | `d3735fe0550bee0ae2cc76644183cba147e415d8fd64437deafdc4298564955f` |
| M | `tests/e2e/laws.spec.ts` | C7 source ?1 | `34e3ca8d12e7219b5776687338d42e18a66424b27cc62d65fb6f7d7435a38c3d` |
| M | `tests/e2e/ledger.spec.ts` | C7 source ?1 | `7fb284f2cb3840c74f6aeb40ca82b7171bce64e2175b806bf3f7655e461f05e8` |
| A | `tests/e2e/npc-homes.spec.ts` | C7 generated | `a7d18c949f531a16c405c8bf770a5a78c83314181cb05b24a448e355030ab93d` |
| M | `tests/e2e/npc-sheet.spec.ts` | C7 source ?15 | `6ca5b3fb6c7e0da00aea75ea4de6cb859861cb0a2f5cf7091628630d5cf7fcae` |
| M | `tests/e2e/society.spec.ts` | C7 source ?3 | `cffebfd98103cda647f902ec9700a5e6973bc0ba15e4f40eeded9933d3e753f0` |
| M | `tests/e2e/storage.spec.ts` | C7 source ?1, C10 storage | `6dbc514f3748d44344af20ca5bc3dcee37f873292b45f027271e4332bdd2fc1d` |
| M | `tests/e2e/tile-local-checkpoint.spec.ts` | C7 source ?2 | `33942cd476684505c1db6e140ac4c9a071f7bfe98105b6a34ff1e76185086595` |
| M | `tests/e2e/tile-save.spec.ts` | C7 source ?1 | `899220b3f62a5bb00f7689b26d775eaca843373466a686b0dbd96f4f3025eedf` |
| M | `tests/e2e/title.spec.ts` | C7 source ?2 | `57d709ba58196f57b21dc2616da3bb5e434ea87aa6fe59d6683da710adbd0630` |
| M | `tests/e2e/world-npc-session.spec.ts` | C7 source ?8 | `410bdb5c3a1303a7dfe800997094f14aba09d3917cfaa2256b91084043f15b99` |
| M | `tests/e2e/world-session.spec.ts` | C7 source ?3 | `939f86f1adbd965ae6515f8feaed5be7b71f63ed5d54724467378cdecf95b3a3` |

VERDICT: FAIL
