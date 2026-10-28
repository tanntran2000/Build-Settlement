# CHARACTER-LIFE-01 — Shared Character model and weekly life loop (design proposal v0.2)

Status: **DESIGN PROPOSAL for review. Not a Work Package, not approved for implementation.** No product code, config or dependency changes are authorised by this document.
Baseline: `main` `e9f47f3cf0991731e71d6ab1fcae714ebad11981` (merge of PR #45, NPC world foundation).
Language: English is the primary language for this document and for every game-facing label, description, event, option, report line and image prompt.
Revision: v0.2 applies the independent design review of v0.1 (End Week timing, deterministic small events, event persistence, milestone ladder, bands, validation, appearance sources, examples, authority wording).

Legend used throughout:
- **[APPROVED]** — explicitly decided by the user (source noted in §1).
- **[ENGINEERING]** — an invariant or mechanism chosen by engineering; carries no user authority.
- **[PROPOSED]** — a default of this design, **awaiting approval of the design as a whole**. Nothing marked PROPOSED is approved by silence.
- **[DECISION]** — a genuine user choice listed in §21.
- Every number in this document is **illustrative**, not locked balance.

---

## 1. Authority

| Item | Status | Source |
|---|---|---|
| Player and NPC share one underlying Character structure | APPROVED | User, 2026-10-25 ("ok, I agree") |
| English is the primary language of the game and this design | APPROVED | User, 2026-10-25 |
| Finish the full NPC design before any NPC bonus/efficiency work | APPROVED | User, 2026-10-25 10:00 UTC ("finish the NPCs first, then we can calculate") |
| Weekly life loop: changes and reports happen at End Week; small events apply direct effects with no options; major events, including friendship/enemy tier milestones, offer 3 or 4 context-specific options; Choose follows the chosen option with no random replacement; Skip selects a valid option at random weighted by environment, relations, goals and traits (not a uniform default) | APPROVED | User, earlier confirmed design (relayed by coordinator) |
| Results are applied once and survive save/load without reroll | ENGINEERING invariant derived from the approved loop | §11.6 |
| Four character axes on 0–100: Attractiveness, Intimacy Knowledge, Learning Aptitude, Warmth | APPROVED as axes (user proposal); definitions in §5 are PROPOSED | User, 2026-10-25 |
| Profile should include name, origin, skin, height/weight, body measurements and an adult intimate-history item | Requested by the user; placement and visibility in §6–§7 are PROPOSED | User, 2026-10-25 |
| Any NPC may take any unlocked post; one NPC per post; one post per NPC; NPCs are not extra workforce; pause/upgrade keep a post, replace clears it; three female starter templates; seeded persisted English names | APPROVED trial content | PR #45 (`packages/core/src/world/npc-content.ts:4-7`) |
| Saved efficiency constraints for later (not part of this design): multiplier 70–200%, output-only, nearest whole unit with exact .5 rounded down | APPROVED, deferred | User, 2026-10-25 09:46–09:51 UTC |
| A non-sexual fictional valuation feature (price of characters in a fictional market) | Recorded request; **out of scope** for this design, not designed or implemented here | User mention, relayed by coordinator |

Engineering calls in this document (ids, file names, formats, phase names, hashing, ordering) carry no user authority.

## 2. Goals and non-goals

Goals:
1. One `Character` record used by the Player and by every named NPC, with different **controllers** (player input vs. simulation).
2. Clear separation of **identity, background, appearance, private adult metadata, mind/personality, skills, condition, relations, goals, memories and assignment**, and for each field whether it is gameplay, cosmetic or private.
3. A deterministic, resumable End Week transaction with small events, major events, Choose and explicit Skip.
4. One shared English **description renderer** (short line, long paragraph, detailed profile) and one **visual prompt projection** (data only; no image generation).
5. A persistence plan that never changes the meaning of existing saves.

Non-goals (this design):
- NPC efficiency/bonus formula; economic pricing or valuation of characters (recorded request, out of scope here).
- Medals, items, equipment for characters.
- Image generation, portrait storage, external services.
- Combat, recruitment, death, aging, pregnancy or any sexual mechanic.
- Explicit or erotic prose; nudity in any prompt; any sexual content involving minors.
- A full UI overhaul.

## 3. Current baseline (code facts)

| Area | Current state | Evidence |
|---|---|---|
| NPC record | `NamedCharacter` with id, name, gender, age, occupation, socialClass, legalStatus, needs(6), emotions(8), relationshipToPlayer(8), memories, skills(5), health | `packages/core/src/domain/character.ts:54-82` |
| Ranges | All stats finite 0–100; decimals allowed | `packages/core/src/world/npc.ts:22,42` |
| Defaults | needs 70/80/60/50/40/50; emotions 50/10/0/10/0/0/70/20; skills 30/30/20/20/30; health 100 | `character.ts:102-136` |
| Relationship | 8 axes trust, affection, attraction, respect, fear, resentment, dependency, familiarity; NPC→Player only | `packages/core/src/domain/relationship.ts:1-29` |
| Memory type | id, source/target, title, description, importance 1–100, timestamp (day tick), decayRate, tags | `packages/core/src/domain/memory.ts:1-11` |
| NPC world | 3 starters, traits as text only, `postTileId`, memories forced empty | `npc-content.ts:10-32`; `npc.ts:13,44-48` |
| Gameplay effect of stats | None. Assignment reads ids/posts only | `packages/simulation/src/world-npc.ts:9`; UI note `packages/ui/src/WorldNpcPanel.svelte:28` |
| City phases | `planning` → End Week → `report` → Next Week | `packages/core/src/trial/types.ts:8`; `packages/simulation/src/tile-trial.ts:25-28` |
| Player character | Does not exist as a Character; "player" exists only as an outside-world actor id | `packages/core/src/world/scenario.ts:7` |
| Seeded RNG | Mulberry32 from a validated uint32 seed; salted streams | `packages/core/src/world/random.ts:2-10`; `npc.ts:67` |
| NPC save | `haven.world-npc-session.save`, schemaVersion 1, Planning only | `packages/persistence/src/world-npc-session-save.ts:6,13-14` |

## 4. Character model

### 4.1 Shape [PROPOSED]

```ts
interface Character {
  id: string;                     // fixed identity, never derived from a name
  controller: "player" | "npc";
  identity: Identity;
  background: Background;
  appearance: Appearance;
  axes: CharacterAxes;            // intimacyKnowledge optional, adults only (§7)
  skills: Skills;                 // existing 5 skills, unchanged
  condition: Condition;           // existing needs, emotions, health
  traits: string[];               // existing trait ids
  goals: Goal[];
  memories: Memory[];             // existing Memory type, week-based use (§9)
  private?: PrivateAdultMetadata; // adults only (§7)
}
interface CharacterAxes { attractiveness: number; learningAptitude: number; warmth: number; intimacyKnowledge?: number }
```

Relations are **not** stored inside a Character; they live in a session-level directed table (§8) so both directions of a pair are visible in one place.

Assignment stays outside the Character: NPC posts remain `postTileId` on the NPC entry (current `WorldNpc` wrapper), because a post belongs to city state.

### 4.2 Field catalogue [PROPOSED]

Tag key: **G** gameplay now, **G*** planned gameplay (needs its slice), **C** cosmetic (descriptions/portrait/profile only), **P** private adult metadata (no mechanics, hidden by default).

| Group | Field | Type / range | Tag | Notes |
|---|---|---|---|---|
| Identity | `currentName` | text 1–64 | C | Existing `name` becomes `currentName` |
| | `birthName` | text 1–64, optional | C | Shown when different from current |
| | `label` | text ≤ 40, optional | C | Short epithet, e.g. "The Mechanic" |
| | `pronouns` | she / he / they | C | Drives description grammar |
| | `gender` | female / male / other | C | Existing field |
| | `age` | integer ≥ 0 | G* | Static in this design; drives the adult policy (§7) |
| Background | `origin.regionId` | id from a fixed fictional region list | C | No real nationality/ethnicity mapping |
| | `origin.upbringing` | id: frontier, city, port_town, farmstead | C | |
| | `profession` | existing `occupation` enum | C | Background only; **not** the current assignment |
| | `socialClass`, `legalStatus` | existing enums | C | No effect in this design |
| | `biography` | text ≤ 1000 | C | Player-authored or template-generated, English |
| Appearance | see §6.2 | | C | |
| Axes | `attractiveness`, `learningAptitude`, `warmth` | 0–100 | see §5 | Required |
| | `intimacyKnowledge` | 0–100, optional | P | Present only when age ≥ 18 (§7) |
| Skills | management, technical, medical, combat, negotiation | 0–100 | G* | Static now; growth is a later slice |
| Condition | needs (6), emotions (8), health | 0–100 | G* | §10 |
| Traits | existing ids | — | G* | Used by Skip weights (§11.5); other effects inactive |
| Goals | §9 | — | G* | Used by Skip weights |
| Memories | §9 | — | G* | Written by events |
| Private | §7 | — | P | Adults only |

### 4.3 Controllers [PROPOSED]

- **Player controller:** values come from Character Creation (presets plus numeric inputs). Major events involving the Player are decided by the user with Choose or explicit Skip.
- **NPC controller:** values come from content templates and the session seed at New Game; afterwards only End Week changes them.
- Both controllers use the same validation, renderer and prompt projection. No field exists for one controller only, except `controller` itself.

## 5. The four axes (0–100) [axes APPROVED; definitions and bands PROPOSED]

Bands are **continuous and exhaustive** for any finite value in [0, 100], including decimals. Notation: `[a, b)` includes a, excludes b; `(a, b]` excludes a, includes b. Comparisons are on the stored value; nothing is rounded before banding.

| Axis | Meaning | Is NOT | Tag | Bands (short word / long phrase) |
|---|---|---|---|---|
| **Attractiveness** | General visual appeal as described by the narrator | Skill, worth or value; not used for valuation in this design | C | [0,15) plain-looking / "plain-looking"; [15,40) unremarkable / "unremarkable in looks"; [40,60] *(nothing)*; (60,85] attractive / "attractive"; (85,100] striking / "striking" |
| **Intimacy Knowledge** | Neutral adult metadata: how much an adult knows about intimacy as a topic | Morality, purity, corruption, consent, willingness or experience. Not a boolean | P | Not rendered in short/long descriptions or prompts (PROPOSED); shown as a number in the Private section |
| **Learning Aptitude** | How quickly the character learns new things | Any of the 5 learned skills; current knowledge | G* | [0,20) slow learner / "a slow learner"; [20,40) steady learner / "a steady learner"; [40,60] *(nothing)*; (60,80] quick learner / "a quick learner"; (80,100] exceptionally quick learner / "an exceptionally quick learner" |
| **Warmth** | Default approachability toward people in general | Trust, affection or any directed relation | G* | [0,20) cold / "cold toward others"; [20,40) reserved / "reserved with strangers"; [40,60] *(nothing)*; (60,80] friendly / "friendly toward most people"; (80,100] very warm / "very warm toward everyone" |

Rules [PROPOSED]:
- The middle band renders nothing (avoids filler text).
- Learning Aptitude may later change skill growth speed (later slice). Warmth is a Skip weight input (§11.5) once major events exist.
- Attractiveness has no gameplay use in this design.

## 6. Appearance [PROPOSED]

### 6.1 Principles
- Data first; text is always rendered from data (§12).
- Appearance words are neutral and descriptive. No medical or health claims are made from body data.
- No appearance is derived from origin, region or class.

### 6.2 Appearance fields

| Field | Type / validation | Notes |
|---|---|---|
| `presentation` | feminine / masculine / androgynous | Chosen independently; default from `gender`. Used by the prompt projection |
| `skinTone` | id: porcelain, fair, light_olive, olive, tan, brown, deep_brown | Palette, not ethnicity |
| `eyeColor` | id: brown, hazel, green, blue, grey, amber | |
| `hair.color` | id: black, dark_brown, brown, auburn, red, blonde, grey, white | |
| `hair.length` | id: cropped, short, shoulder_length, long | |
| `hair.style` | id: loose, tied_back, braided, bun | Style suffix in long text: loose → "", tied_back → " tied back", braided → " in a braid", bun → " in a bun" |
| `face.shape` | id: oval, round, square, heart_shaped, long | |
| `face.features` | 0–2 ids: freckles, glasses, high_cheekbones, strong_jaw, scar | Long phrase: freckles → "is lightly freckled", glasses → "is framed by glasses", high_cheekbones → "has high cheekbones", strong_jaw → "has a strong jaw", scar → "carries a small scar" |
| `build` | id: very_slim, slim, average, sturdy, broad, heavy_set | **Selected independently**, not derived |
| `heightCm` | integer 140–210 | Numeric input |
| `weightKg` | integer 35–180 | Numeric input |
| `measurements` | optional `{ chestCm 60–160, waistCm 45–150, hipsCm 60–170, disclosure }` integers | §6.4 |
| `outfit` | id from an outfit list, or `role_default` | §6.5 |

### 6.3 Height bands (fixed, not relative)
`[140,155)` short; `[155,170)` of average height; `[170,185)` tall; `[185,210]` very tall. Short words: short, average height, tall, very tall.

### 6.4 Build, weight and measurements
- Build is a descriptive choice. Height and weight are separate numbers.
- **Consistency note** (non-blocking UI hint only): when the chosen build and the height/weight pair look very different (illustrative: `weightKg × 10000 / heightCm²` below 17 with build sturdy/broad/heavy_set, or above 30 with very_slim/slim), Character Creation shows "Build and weight look inconsistent; check the values." This number is never shown, stored or described, and makes no medical claim.
- Measurements are optional neutral numbers. `disclosure` is `"known" | "unknown"`: the value may exist while the Player does not yet know it. For the Player character's own record, disclosure is always `known`.
- Measurements appear only in the detailed profile (§12.3): "Measurements: 86 / 68 / 92 cm" when known, "Measurements: Unknown" when unknown or absent. They are not in the short line, the long paragraph or prompts (PROPOSED placement; the user asked for them in the profile, and this design places them in the detailed profile card).

### 6.5 Outfit, setting and expression sources
- **Outfit:** if `outfit` is a list id, use it. If `role_default`, use the post's building type (Farm → "a wide-brimmed hat and work clothes", Food Processor → "a canvas work jacket and heavy trousers", Logging Camp → "a padded vest and heavy boots", Iron Mine → "a reinforced jacket and a lamp helmet", Goods Workshop → "a leather apron over plain clothes", Market → "a neat vest with a ledger at hand"); when unassigned, use the profession default (technician → "a canvas work jacket and heavy trousers"; doctor → "a long buttoned coat over practical clothes"; trader → "a neat vest over a travelling coat"; other → "plain practical clothes").
- **Setting (prompt only):** current post building ("at a farm", "inside a food processing workshop", ...); unassigned → "in a frontier settlement".
- **Expression (prompt only):** from current emotions, first match: stress ≥ 70 → tense; sadness ≥ 60 → subdued; anger ≥ 60 → stern; joy ≥ 60 → smiling; otherwise calm. Warmth only breaks the "calm" case: warmth (60,100] → "calm, friendly"; [0,20) → "calm, distant". An event illustration may override expression with the event's context.

## 7. Adult policy and private metadata [principle APPROVED; shape PROPOSED]

- Adult-associated fields (`axes.intimacyKnowledge`, `private.*`) are **optional in the type** and may exist **only** when `age ≥ 18`. Validation rejects any character under 18 that has any of them (absence is required, not zero).
- UI: these inputs are not shown for a character under 18; the Private section is not rendered at all for them.
- `private.intimateHistory`: `{ value: "none" | "some"; disclosure: "known" | "unknown" }`, optional. The value is never "unknown"; whether the Player knows it is the separate `disclosure`. Display: "Intimate history: None", "Some" or "Unknown". No prose, no events, no mechanics, no weights, no prompts.
- The Private section (Intimacy Knowledge number, intimate history) is collapsed by default for every character.
- The three starters are adults (27, 31, 24).
- **[DECISION D2]** whether characters under 18 may exist at all as named characters.

## 8. Relations [PROPOSED]

### 8.1 Storage
```ts
interface RelationEdge {
  from: string; to: string;             // character ids; from !== to
  axes: Relationship8D;                 // existing 8 axes, 0–100, kept as-is
  tier: RelationTier;
  tierSinceWeek: number;
}
type RelationTier = "stranger" | "acquaintance" | "friend" | "close_friend" | "rival" | "enemy";
```
- Session holds `relations: RelationEdge[]`, unique per `(from, to)`, sorted by `(from, to)`.
- Existing `relationshipToPlayer` maps to the edge `npc → player` **with all 8 axes preserved**; a new `player → npc` edge starts from the existing defaults (`relationship.ts:20-29`). Nothing is discarded.
- A missing edge reads as defaults with tier `stranger` and is stored the first time anything changes it.

### 8.2 Standing vs tier
- **Standing** (derived, never stored): `standing = (trust + affection + respect + familiarity) / 4 − (resentment + fear) / 2`. Compared exactly (multiply through; no rounding).
- **Tier** is stored and changes only through §8.3.

### 8.3 Ordered, mutually exclusive transitions
Ladder: `enemy — rival — acquaintance — friend — close_friend`; `stranger` precedes `acquaintance`.

| Current tier | Candidate transitions, checked in this order (first match only) | Kind |
|---|---|---|
| stranger | → acquaintance if familiarity ≥ 20 | Small event (direct) |
| acquaintance | → friend if standing ≥ 55 and familiarity ≥ 30; → rival if standing ≤ 25 and familiarity ≥ 30 | Major milestone |
| friend | → close_friend if standing ≥ 75 and familiarity ≥ 50; → acquaintance if standing < 45 | Major milestone |
| close_friend | → friend if standing < 65 | Major milestone |
| rival | → enemy if standing ≤ 10; → acquaintance if standing > 35 | Major milestone |
| enemy | → rival if standing > 20 | Major milestone |

- Only adjacent moves; at most one candidate per directed edge per week; a candidate never targets the tier already held.
- Gaps between "up" and "return" thresholds (55/45, 75/65, 25/35, 10/20) are the hysteresis.
- A milestone's options decide the result; a declining option leaves the tier unchanged.

### 8.4 Asymmetry
- A→B and B→A are independent edges. Ana may regard Ben as a friend while Ben regards Ana as an acquaintance.
- A milestone concerns one directed edge. An option may also change the reverse edge only if the option says so explicitly (e.g. "Become friends" sets both; "Keep it professional" sets neither).
- UI shows both directions: "Ana → Ben: Friend · Ben → Ana: Acquaintance".

## 9. Goals and memories (minimal, before major events) [PROPOSED]

Goals:
```ts
interface Goal { id: string; kind: GoalKind; targetId: string | null; progress: number /*0–100*/; status: "active" | "achieved" | "abandoned"; sinceWeek: number }
```
- Up to 3 active goals per character. Kinds from a fixed list: `master_skill`, `befriend`, `rest`, `earn_recognition`, `leave_post`.
- Minimal evaluation: progress rules are deterministic per kind (e.g. `rest`: +25 per unassigned week; `befriend`: progress = target edge standing). Achieved/abandoned only at End Week.
- Goals are an input of Skip weights from the first slice that has major events (§20).

Memories (existing `Memory` type, week-based):
- Created by major event resolutions and by small events flagged `memorable`.
- `timestamp` stores the End Week number (the WP must update the type comment, which says day tick).
- Cap 20 per character; when full, drop the lowest `importance`, oldest first. `decayRate` lowers importance by its value each week, floor 1.
- The current rule "memories must be empty" (`npc.ts:44-45`) is lifted only in the new save format (§15).

## 10. Weekly well-being [PROPOSED; first dynamic set is DECISION D3]

Recommended first dynamic set (D3):
- `emotions.stress`: **weekly drift** +3 on a post, −5 when unassigned, plus event deltas.
- `health`: **no drift**; changes only by event deltas.
- All other needs/emotions: event deltas only.

Every change is clamped to [0, 100], logged with requested delta, applied delta and reason (§11.7). No well-being value affects production in this design.

**[DECISION D1]** Player well-being (§21).

## 11. End Week transaction

### 11.1 Phases [ENGINEERING]
New mode only: `planning` → End Week → `resolving` (only if major events are pending) → `report` → Next Week → `planning`. Existing modes keep `planning` → `report` unchanged.

### 11.2 Order inside one End Week (week N)
1. Existing city week resolution, unchanged (`packages/simulation/src/tile-trial-week.ts`).
2. Weekly well-being drift (§10).
3. Small events (§11.3).
4. Goal progress and memory decay.
5. Major-event detection, including milestones (§8.3, §11.4); create occurrences with frozen context.
6. If no occurrence is pending: finalise the week-N report → `report`.
7. Otherwise → `resolving`. The report is not final. The Player resolves every pending occurrence by **Choose** or **explicit Skip**. There is no timeout and no automatic Skip.
8. When the last occurrence resolves: finalise the week-N report with all small and major results → `report`.

All results belong to week N. Nothing is delayed to week N+1. Detection (step 5) runs once per End Week; resolutions do not create new major events in the same week.

### 11.3 Small events [behaviour APPROVED; mechanics PROPOSED]
- **No RNG.** Occurrence and effects are deterministic.
- Each definition has an eligibility predicate over current state, a priority (integer), fixed effects, and a cooldown in weeks.
- Per character: among eligible definitions not in cooldown, take the highest priority; ties by definition id. At most 1 small event per character per week.
- Example: "Long shift" — eligible when on a post and stress ≥ 50; effect stress +4; cooldown 3 weeks; log "Clara: Stress +4 (long shift at the Food Processor)."
- Stranger → acquaintance (§8.3) is a small event.

### 11.4 Major event occurrences [ENGINEERING mechanics for the APPROVED behaviour]
```ts
interface EventOccurrence {
  occurrenceId: string;     // unique: `w${week}:${defId}:${participants.join(">")}`
  dedupKey: string;         // for duplicates/cooldown: `${defId}:${participants.join(">")}:${targetTier ?? ""}`
  defId: string; week: number; participants: string[];
  frozenContext: Record<string, number | string | boolean>; // facts read at creation
  options: { optionId: string; enabled: boolean; disabledReason?: string; skipWeight: number }[]; // content order, persisted
  resolution: null | { optionId: string; by: "player" | "skip"; sequence: number; applied: AppliedDelta[] };
}
```
- `occurrenceId` identifies one occurrence; `dedupKey` groups occurrences for duplicates and cooldowns. They are never the same field.
- Creation: read the facts the definition needs into `frozenContext`; evaluate every option's requirements and Skip weight **once** against it; persist option order (content order, never shuffled), enabled flags, reasons and weights.
- **Content rule:** every major event definition has at least one option with no requirements (always valid). The content validator rejects definitions without one. If, despite that, an occurrence would have no enabled option, it is not created and a content defect is logged; no state changes.
- Duplicates: no new occurrence while one with the same `dedupKey` is unresolved. Cooldown after resolution: 4 weeks per `dedupKey`; 8 weeks once if the chosen option declined a tier change.
- Cap: at most 2 new occurrences per End Week. Overflow candidates wait for a later week, ordered by priority (milestones first), then participant ids.

### 11.5 Choose and explicit Skip [behaviour APPROVED; mechanics PROPOSED]
- **Choose** `{ occurrenceId, optionId }`: accepted only in `resolving`, only for an unresolved occurrence, only for an option persisted as enabled. Effects apply **immediately in the same transaction**; resolution is stored; never replaced by a random option.
- **Skip** `{ occurrenceId }` (explicit only): selects one enabled option by weighted draw over the persisted `skipWeight` values, using a generator seeded by a 32-bit hash (FNV-1a, illustrative) of `sessionSeed` and `occurrenceId`. Same occurrence ⇒ same result on any machine, any reload.
- Skip weights (computed at creation, integers): `skipWeight = max(1, base + environment + relations + goals + traits)`.
  - `base`: set per option in content; no implicit uniform default.
  - `environment`: city facts (e.g. Food shortage last week).
  - `relations`: participants' 8 axes, tier, and Warmth.
  - `goals`: bonus when the option advances an active goal.
  - `traits`: bonus for listed trait ids.
  - Never inputs: Intimacy Knowledge, private metadata, attractiveness.
- Multiple pending occurrences may be resolved in any order; `sequence` records the order. Effects of a later resolution apply to the state left by earlier ones (with clamping), while its enabled options and weights stay as frozen at creation.

### 11.6 Once-only invariant [ENGINEERING]
- A resolved occurrence is immutable. Reopening the report, re-rendering, saving and loading never rerolls or reapplies.
- `resolving` is saveable; loading resumes the same pending occurrences with the same frozen context, options, weights and any resolutions already made.

### 11.7 Clamping and applied deltas [ENGINEERING]
- Simulation effects clamp to [0, 100] and log `{ characterId, field, requested, applied, reason }`. Example: stress 98, event +4 ⇒ applied +2, logged "Stress +2 (requested +4, capped at 100)".
- Clamping applies only to simulation effects, never to imported data (§15).

## 12. Description renderer (English) [PROPOSED]

### 12.1 Mechanism
- Band tables map data to words: short word and long phrase per band (§5, §6.3).
- Middle/neutral bands render nothing.
- Fixed phrases only; no random phrasing.
- Text is never stored in saves; only data is.
- Pronoun forms from `identity.pronouns`: she/her/her, he/him/his, they/them/their.
- Ids render as words with underscores replaced by spaces, except shoulder_length → "shoulder-length", heart_shaped → "heart-shaped", heavy_set → "heavy-set".

### 12.2 Short line and long paragraph
Short line (tokens separated by " · ", empty tokens omitted):
`{currentName} · {age} · {Profession} from {regionName} · {heightShort}, {buildShort} · {skinTone} skin · {hairLengthWord} {hairColor} hair · {eyeColor} eyes · {attractivenessShort} · {learningShort} · {warmthShort}`
- `buildShort`: very slim, slim, average build, sturdy, broad, heavy-set.

Long paragraph (sentences in this order; a sentence with no content is omitted):
1. "{currentName}, {age}, grew up {upbringingPhrase} in {regionName}." Upbringing: frontier → "on the frontier", city → "in a city", port_town → "in a port town", farmstead → "on a farmstead".
2. "{Subject} is {heightLong} with {buildLong}, {skinTone} skin and {hairLengthWord} {hairColor} hair{styleSuffix}." `heightLong`: short, of average height, tall, very tall. `buildLong`: a very slim build, a slim build, an average build, a sturdy build, a broad build, a heavy-set build.
3. With features: "{Possessive} {faceShape} face {featurePhrase}; {subject} wears {outfitPhrase}." Without features: "{Possessive} face is {faceShape}; {subject} wears {outfitPhrase}." Two features join with " and ".
4. "{Subject} is {axisPhrases}." Non-neutral long phrases in order attractiveness, learning, warmth, joined "A", "A and B", "A, B and C".
5. "Trained as a {profession}, {subject} {assignmentPhrase}." Assignment: "currently manages the {buildingName}" or "currently holds no post".
6. Optional biography, verbatim.

Excluded from short line and long paragraph (PROPOSED, not a user decision): measurements, Intimacy Knowledge, intimate history, legal status, social class.

### 12.3 Detailed profile card
Rows, in order: Name (and birth name if different) · Label · Age · Profession (background) · Current post · Origin · Height (cm) · Weight (kg) · Build · Skin · Hair · Eyes · Measurements ("86 / 68 / 92 cm" or "Unknown") · the four axes as numbers with band words (Intimacy Knowledge and intimate history only inside the collapsed Private section, adults only).

### 12.4 Examples (adults, fully clothed; values illustrative; text produced by §12.2 exactly)

**Example A — "Clara" (starter template 1)**
Data: age 27; she; profession technician; region Northreach; upbringing frontier; presentation feminine; 168 cm; 58 kg; build slim; skin light_olive; hair brown, shoulder_length, tied_back; eyes grey; face oval with freckles; outfit role_default; attractiveness 66; learning aptitude 72; warmth 34; emotions default (joy 50, stress 20); skills 40/65/15/30/25; post: Food Processor.
- Short: "Clara · 27 · Technician from Northreach · average height, slim · light olive skin · shoulder-length brown hair · grey eyes · attractive · quick learner · reserved"
- Long: "Clara, 27, grew up on the frontier in Northreach. She is of average height with a slim build, light olive skin and shoulder-length brown hair tied back. Her oval face is lightly freckled; she wears a canvas work jacket and heavy trousers. She is attractive, a quick learner and reserved with strangers. Trained as a technician, she currently manages the Food Processor."

**Example B — "Ruth" (starter template 2)**
Data: age 31; she; profession doctor; region Saltmere; upbringing port_town; presentation feminine; 174 cm; 70 kg; build average; skin deep_brown; hair black, short, loose; eyes brown; face heart_shaped with glasses; outfit role_default; attractiveness 50; learning aptitude 55; warmth 78; emotions default; health 85; skills 35/20/65/10/45; unassigned.
- Short: "Ruth · 31 · Doctor from Saltmere · tall, average build · deep brown skin · short black hair · brown eyes · friendly"
- Long: "Ruth, 31, grew up in a port town in Saltmere. She is tall with an average build, deep brown skin and short black hair. Her heart-shaped face is framed by glasses; she wears a long buttoned coat over practical clothes. She is friendly toward most people. Trained as a doctor, she currently holds no post."

Attractiveness 50 and aptitude 55 fall in the neutral band and add no words.

## 13. Visual prompt projection (data only, no generation) [PROPOSED]

- Available only for characters with `age ≥ 18`. For anyone younger the projection returns "not available"; it never maps a minor to an adult band.
- `VisualSnapshot = { characterId, appearanceVersion, promptVersion, fields }` from a **whitelist**: presentation; adult age band from actual age (18–24 young adult, 25–39 adult, 40–59 middle-aged adult, 60+ older adult); skin tone; eye colour; hair colour/length/style; face shape/features; height band; build; attractiveness band word; expression (§6.5); outfit (§6.5); setting (§6.5).
- Always added: "adult, fully clothed, non-explicit, waist-up portrait". Always negative: "nude, nsfw, suggestive, lingerie, child, teen, underage".
- Never included: names, region/origin, measurements, exact cm/kg, Intimacy Knowledge, intimate history, Learning Aptitude, Warmth number, legal status, social class, relations.
- Example (Clara): "adult, fully clothed, non-explicit, waist-up portrait, feminine, adult (25–39), light olive skin, grey eyes, shoulder-length brown hair tied back, oval face, freckles, average height, slim build, attractive, calm expression, canvas work jacket and heavy trousers, inside a food processing workshop".
- `appearanceVersion` increments whenever a whitelisted field changes. A future portrait stores `{ snapshotHash, promptVersion }` as its canonical reference; a mismatch marks it stale.

## 14. UI sections (additive, no overhaul) [PROPOSED]

- **Character Creation (Player):** tabs Identity (names, label, pronouns, age), Origin (region, upbringing, profession, biography), Appearance (presets plus numeric height/weight, build, optional measurements, outfit), Axes (sliders with live band word; Intimacy Knowledge slider only when age ≥ 18). Private section collapsed. Live short-line preview. Consistency note from §6.4.
- **NPC profile (tabs on the existing NPC card):** Overview (short line, label, post), Profile (detailed card §12.3), Skills & Mind, Relations (both directions, tier, since week), Goals & Memories, Life Log.
- **End Week while `resolving`:** a "Decisions needed (n)" panel lists each pending occurrence with its context text, 3 or 4 options (disabled ones show the reason) and a Skip button. The report is shown as "pending" until all are resolved.
- **Weekly report:** "Life" section grouped by character; filters by character and category (well-being, relations, goals, events); every line shows requested/applied delta and reason; major event outcomes appear as distinct notices at the top, with "Chosen" or "Skipped" and the selected option.
- All strings English.

## 15. Persistence and validation [PROPOSED]

- New mode and save format: `?mode=world-life`, format `haven.character-life-session.save`, schemaVersion 1, its own local slot. Contains city, outside, characters, posts, relations, occurrences (pending and resolved within the retention window), cooldown table, phase (`planning`, `resolving` or `report`; report text is regenerated from data), Life log retention (illustrative last 12 weeks).
- Existing saves keep their exact meaning: tiles, population, world and NPC-world v1 saves load only in their own modes, unchanged. **An old NPC-world assignment is never treated as opt-in to new behaviour.** No automatic migration; a later explicit converter is out of scope.
- Import validation (trust boundary; reject, never clamp):
  - every numeric field finite and in range (0–100 stats; §6.2 bounds; integers where stated);
  - ids unique; enums known; text length limits;
  - references resolve: relation `from`/`to`, occurrence participants, goal `targetId`, memory source/target, `postTileId` against unlocked slots;
  - relation edges unique and non-self; resolved occurrences carry a valid enabled `optionId`; `sequence` unique within a week;
  - adult policy (§7);
  - frozen context, options and weights present and well-formed for every occurrence.
- Determinism: one session seed; the only random draw in the life loop is explicit Skip, keyed by `occurrenceId` (§11.5). Names keep their existing salted stream.

## 16. Risks

| Risk | Mitigation |
|---|---|
| End Week can stop in `resolving` | Clear "Decisions needed" panel; Skip always available; save/resume supported |
| Event content grows faster than code | Few definitions per slice; content validator (always-valid option) |
| Skip feels unfair | Report shows weights' reasons: "Skipped — Ruth chose 'Help anyway' (friendly, goal: befriend)" |
| Log spam | Grouping, filters, at most 1 small event per character per week |
| Players read numbers as balance | All numbers labelled TRIAL in UI |
| Adult metadata misuse | §7 typing and validation, collapsed by default, excluded from prompts and weights |
| Save bloat | Retention window, memory cap 20, lazy relation edges |

## 17. Reference precedent (reviewed, not imported)

Free Cities / Pregmod at `gitgud.io/pregmodfan/fc-pregmod` commit `8c545815c59192040987b4218b42675067266203` was studied for structure only:
- Data/prose split via rating tables, short and long variants: `js/003-data/slaveSummaryData.js:29-37, 746`; `src/js/slaveSummaryHelpers.js:101-106`.
- Neutral band renders nothing: `src/art/genAI/prompts/beautyPromptPart.js:14`.
- Prompt as ordered field→tag parts with positive and negative tags: `src/art/genAI/buildPrompt.js:21-47`; `src/art/genAI/prompts/heightPromptPart.js:5-21`.
- Innate intelligence separate from education: `src/npc/descriptions/mind.js:24-50`; devotion separate from trust: `src/js/slaveSummaryWidgets.js:18-20`.
Differences by choice: this design uses fixed height bands (FC uses a population mean, `src/npc/descriptions/dimensions.js:39-48`) and does not adopt explicit body or sexual parts, appearance derived from race/nationality, sexual skills, valuation, or FC's handling of characters under 18.

## 18. Testing and acceptance (for the future WPs)

1. Same seed + same commands ⇒ identical characters, small events, occurrences, Skip results and logs (LAW-03).
2. Small events: no RNG call in their code path; a fixed state yields a golden list.
3. Save during `resolving` → load → resolve equals uninterrupted play; resolved occurrences never reroll or reapply.
4. Choose applies exactly the chosen enabled option immediately; disabled or unknown options are rejected with no state change.
5. Skip never selects a disabled option; with fixed weights and seed, matches a golden result; every weight ≥ 1.
6. No timeout or automatic Skip: End Week stays `resolving` until all occurrences are resolved.
7. Content validator rejects a major event definition without an always-valid option; an occurrence with no enabled option is never created and leaves state unchanged.
8. `dedupKey` blocks duplicates while pending; cooldowns hold across save/load; occurrence ids are unique.
9. Milestones: never target the held tier; only adjacent moves; at most one per edge per week; hysteresis thresholds honoured.
10. Bands: every finite value in [0, 100] (including 15, 40, 60, 60.0001, 85) maps to exactly one band.
11. Import rejects non-finite or out-of-range values and broken references; simulation clamps and logs requested vs applied.
12. Adult policy: adult fields rejected under 18; projection unavailable under 18; prompts never contain excluded fields.
13. Descriptions: examples in §12.4 are reproduced exactly; all strings English.
14. Old modes and old saves (tiles, population, world, NPC world v1) produce identical results to baseline `e9f47f3`.
15. Existing rules preserved: 3 starters, any NPC any post, one per post, no extra workforce.

## 19. Engineering invariants (summary)

- One End Week per week; every result belongs to that week.
- Only explicit Skip draws randomness; small events never do.
- Frozen context per occurrence; persisted option order, enabled flags and weights.
- Once-only resolution; resumable `resolving` phase.
- Reject at import, clamp only in simulation, log applied deltas.

## 20. Incremental slices

| Slice | Content | Depends on |
|---|---|---|
| S1 | Shared Character schema, Player creation, appearance, axes, renderer and detailed profile, new mode/save format (no life loop) | D1, D2 |
| S2 | Directed relations (8 axes, tiers), minimal goals and memories storage/evaluation, Relations and Goals tabs | S1 |
| S3 | End Week transaction framework (phases, resumable save), well-being drift, deterministic small events, Life log | S2, D3 |
| S4 | Major events: occurrences, frozen context, Choose/explicit Skip with all four weight inputs, milestones, dedup/cooldown | S3 |
| S5 | Visual snapshot export (prompt text only) | S1 |
| Later | Efficiency formula with saved constraints; skill growth via Learning Aptitude; medals/items; portraits; valuation (recorded request) | Separate approvals |

## 21. Decisions

Genuine user choices:
- **D1 Player well-being:** (a) same fields as NPCs, changed by events only, no weekly drift (recommended); (b) same drift as NPCs; (c) no well-being for the Player.
- **D2 Named characters under 18:** (a) none in this game (recommended); (b) allowed, with no adult-associated field and no portrait projection.
- **D3 First dynamic well-being set:** (a) stress has weekly drift, health changes only by event deltas, all else event deltas only (recommended); (b) a different set.

Awaiting approval of the design as a whole (PROPOSED, not approved by silence): band words and thresholds, height bands, milestone thresholds, cooldowns and caps, region and outfit lists, placement of measurements and private metadata, phase names, save format name, slice order.

---

## Review addendum — binding corrections to this draft

This addendum supersedes any conflicting line above. It records engineering corrections from the independent review of v0.2; it asks no new product question and authorises no implementation.

1. **Fixed values vs balance values.** These are contractual, not illustrative: the 0–100 range of the four axes and of all existing stats; the 18+ adult policy (§7); 3 or 4 options per major event; the saved deferred efficiency constraints (70–200%, output-only, nearest whole unit with exact .5 down). Only balance values are PROPOSED: band thresholds, height bands, drift amounts, standing formula and milestone thresholds, Skip weight terms, cooldowns, caps, retention windows and validation bounds of appearance numbers. The UI tags only those balance values as TRIAL; it does not label all numbers TRIAL (supersedes the legend line "Every number … illustrative" and the §16 row "All numbers labelled TRIAL").
2. **Event conflicts and reservations.**
   - Every major event definition declares a read set and a write set (character fields, relation edges, goals, city resources).
   - At detection, candidates are taken in priority order; a candidate whose write set overlaps the read or write set of an already created occurrence of the same week is deferred to a later week **before** any options are shown.
   - Consumable costs (e.g. Gold, Food) are reserved at creation: an option is enabled only if its cost fits the stock minus reservations of other pending occurrences; the occurrence reserves the highest cost among its enabled options; on resolution the chosen cost is debited and the reservation released. No overspend is possible.
   - Any reverse-edge tier change in an option is validated with the same §8.3 adjacency rules against that edge's current tier (adjacent only, never the held tier); an option whose required reverse change is invalid is disabled with a reason.
3. **Goal evaluation.**
   - `befriend` progress = standing clamped to [0, 100]; the goal is achieved only when the target edge reaches the goal's required tier, not when progress reaches 100.
   - After major event outcomes, the status of affected goals (achieved/abandoned) is recomputed before the final week report, without reapplying weekly increments (e.g. `rest` +25 is applied once per week only).
4. **Typed goal targets.** `targetId: string | null` is replaced by a typed target per kind: `master_skill` → `{ skillId }` (one of the 5 skills) with a required level; `befriend` → `{ characterId, requiredTier }`; `rest`, `earn_recognition`, `leave_post` → a condition target (e.g. `{ field: "emotions.stress", max }`, `{ field: "needs.recognition", min }`, `{ unassigned: true }`). The full contract of every goal kind (target type, progress rule, achieve/abandon rule) must be written before the WP.
5. **D1 option (c).** "No well-being for the Player" means the shared condition fields remain present and validated on the Player record but are inactive for the Player (no drift, no event deltas, shown as inactive); it never means missing required data.
6. **Small event determinism.** Eligibility for all characters is evaluated on one fixed snapshot taken after weekly drift (§11.2 step 2); effects of earlier small events in the same week do not change later eligibility. Characters are processed in canonical character-id order and definitions in definition-id order (priority picks per character; ties by definition id). Effects are applied in that canonical order, and the report shows the actual clamped deltas (§11.7).

---

## Addendum B — Character catalogue and Player Interaction

This addendum supersedes conflicting lines above (including Review addendum item 6 where noted). It is design only; no implementation is authorised and the design as a whole is still awaiting approval. D1–D3 remain pending.

### B1. Catalogue: seven groups [groups APPROVED by the user; fields PROPOSED unless stated]

| Group | Contents | Reconciles with |
|---|---|---|
| **Identity** | currentName, birthName, label, pronouns, gender, age; **birthplace** (where born), **origin** (region/upbringing background), **currentLocation** (where the character is now) as three separate fields | §4.2 Identity/Background |
| **Character Traits** | the four axes (Attractiveness, Intimacy Knowledge, Learning Aptitude, Warmth); existing trait ids stay stored and are displayed in this group | §5 |
| **Personal Stats** | existing needs (6), emotions (8), health, 5 skills; static until their slices | §3, §10 |
| **Appearance** | §6.2 plus **hair texture** as its own field (straight, wavy, curly, coily), separate from colour, length and style | §6.2, §12 |
| **Directed Relationships** | §8 unchanged (8 axes per directed edge, tier separate from standing) | §8 |
| **Experience History** | professional and life history (B2) | §9 |
| **Player Interaction** | Player actions toward NPCs, stored separately from relationship state (B3) | new |

Renderer change (PROPOSED): hair reads `{length} {texture} {colour} hair{styleSuffix}`; `straight` renders nothing, so the §12.4 examples are unchanged with texture `straight`.

### B2. Experience History [breakdown PROPOSED; progression formulas NOT approved]
- **Skill Experience:** accumulated experience per skill (5 entries). No growth formula is defined; skills stay static.
- **Work History:** entries `{ buildingType, tileId, fromWeek, toWeek | null }`, written when a post is assigned, cleared by replace, or unassigned.
- **Weeks:** derived counts (weeks on any post, weeks per building type) from Work History; not stored separately.
- **Memories:** §9 unchanged.
- **Milestones:** record of tier changes and achieved goals `{ week, kind, refs }`.

### B3. Weekly Interaction Budget

APPROVED (user): the Player has **5 interactions per week in total, across all NPCs**. Any distribution is allowed: all 5 on one NPC, one each on 5 NPCs, or any mix. There is **no per-NPC cap**. This supersedes any earlier one-per-NPC proposal.

PROPOSED engineering defaults (not user-approved):
- Each queued action costs 1. Actions are queued during Planning, up to 5. A 6th is rejected with no state change.
- Editing or cancelling a queued action during Planning returns its slot.
- The queue is frozen outside Planning and resolves **once, in queued order**, at End Week, after weekly drift (§11.2 step 2) and before small events. The small-event eligibility snapshot (Review addendum item 6) is taken after the interaction queue resolves.
- Interaction outcomes are deterministic from content and state (no RNG; Skip remains the only random draw).
- Unused interactions lapse at End Week; the budget is 5 again at the next Planning; no carryover.
- Major event Choose/Skip and automatic NPC events do not consume the budget.
- Action list (proposals only): Talk, Check In, Encourage/Praise, Discuss Work, Resolve Conflict. Targets: any NPC, assigned or not.

Open balance question (not decided): repeated actions on the same NPC in one week may lead to different outcomes as content defines, but this design invents no diminishing-returns rule and no automatic positive bonus.

Integrity (ENGINEERING):
- Persisted state `interactions: { week, queue: { seq, actionId, targetId }[], resolved: boolean }`; remaining budget is derived as `5 − queue.length`, never stored, so reload cannot refill it.
- The queue is tied to the week id; End Week resolves it only when `resolved` is false for the current week and marks it resolved in the same transaction; a repeated or stale End Week is rejected.
- Import rejects: queue longer than 5, week mismatch, unknown action, target that is not an existing NPC, duplicate `seq`, or a resolved queue for a week still in Planning.

Acceptance scenarios:
1. 5 actions on the same NPC are accepted and resolve in queued order.
2. 5 actions split across NPCs (5×1, or 2+2+1) are accepted.
3. A 6th action is rejected; state is unchanged.
4. Cancel one action, queue another: still at most 5; the cancelled action never resolves.
5. Save and load in Planning keep the queue and remaining budget; loading or importing never refills it.
6. End Week resolves the queue once; reload or repeated End Week does not reapply it.
7. Unused actions lapse; the next Planning starts with 5.

### B4. Reconciliation
- §4.2 field catalogue is regrouped by B1; field definitions are otherwise unchanged.
- §14 UI adds an "Interactions (n/5)" panel in Planning, listing queued actions with edit/cancel; results appear in the Life section of the report.
- §20 slices: Experience History storage joins S2; the interaction queue joins S3 (End Week framework).
