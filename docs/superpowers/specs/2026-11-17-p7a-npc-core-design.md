# P7-A — NPC core sheet (design spec v0.1)

**Status:** draft by Claude for the owner's review (G1). Not approved. Part of P7 (see `2026-11-17-p7-npc-overview.md`).

- **Base:** `main` `753e450`.
- **Not authorised by this document:** no code, push or PR.

All NPCs are female adults (18+). Adult stats are mechanics only. UI text is English. Public text never names other games.

## 1. Authority (owner decisions this spec builds on, verbatim where quoted)

1. NPC sheet with four card-tabs: Profile, Skills, 18+, History (owner, 2026-11-12).
2. No Health for NPCs (owner, 2026-11-12).
3. Stress on the Skills tab; it rises weekly at work buildings; at 100 the NPC stops working: "chỉ ngưng làm việc thôi ko bỏ trốn". High Authority plus high intimacy with the Player halves the rise (owner's example: +4%/week becomes +2%).
4. Sex-exp: 5 parts (Hand, Mouth, Breast, Vagina, Ass), 3 levels Novice 0/100 → Professional 0/200 → Expert 0/300, stops at Expert (owner, 2026-11-12).
5. Ageing each game year of 40 weeks; titles Young Adult (18–29), Mature (30–49), Granny (50+): "Đổi seasoned thành Granny đi".
6. Hobbies boost matching dates (dates come in P7-C).
7. History: keyed counters, extensible, with the last 20 events per NPC.
8. Mind replaces "corruption": "Chỉ số corruption của NPC ko nên ghi như vậy mà chuyển thành mind"; one bipolar bar, start in the middle, Light left, Dark right.
9. Lust with a fixed base; Arousal rises weekly with Lust (owner, 2026-11-03).
10. Today's 3 starter NPCs stay until P7 changes them: "giữ đi khi vào P7 hãy chỉnh sửa sau".

## 2. Player outcome

The Player opens any NPC and sees a full sheet: who she is (origin, age and title, hobbies, traits, affection), how she works (skills and Stress), her 18+ stats (Mind bar, Lust, Arousal, Beauty, Sex-exp per part) and her history. Stress now matters: a hard-worked NPC stops working until she rests, so the Player must rotate posts.

## 3. Non-goals (P7-A)
- Buying, hiring or selling NPCs, and removing the starter NPCs: P7-B.
- Player actions, dates, intimacy, Arousal-driven partner seeking, the NTR route, utility AI: P7-C. In P7-A nothing yet raises Sex-exp or moves Mind; the values exist, show and persist.
- More NPC slots per building, soldier training: P7-D.
- Crime events against NPCs: P7-E. NPC appearance art: P7-ART.

## 4. NPC state (new fields)

Each `WorldNpc` gains one `life` object (the shared `NamedCharacter` is unchanged, so the Player is not affected):

| Field | Range | Start value (TRIAL, seeded) |
|---|---|---|
| `mind` | 0–100, 0 = Light, 100 = Dark | 50 |
| `lust` | 0–100 (current), plus `lustBase` | base 20–40 by seed; current = base |
| `arousal` | 0–100 | 0 |
| `stress` | 0–100 | 0 |
| `beauty` | 0–100 | 40–80 by seed |
| `birthWeek` | absolute week (negative = before week 1) | from today's `age` |
| `origin` | id from a short catalog (data file) | by seed |
| `hobbies` | 2 ids from a catalog of ~8 (data file) | by seed, distinct |
| `sexExp` | per part: `{ level: 'novice'|'professional'|'expert', exp }` | novice, 0 |
| `history` | `{ counters: Record<string, number>, recent: Event[≤20] }` | empty |

- NPC `character.health` stays in the record for the shared schema but is never shown or changed for NPCs (Claude's call).
- `age` is derived from `birthWeek` and the current week (40 weeks per year); the title is derived from age. No NPC is ever under 18.

## 5. Weekly rules (End Week, TRIAL values)

- **Stress:** +4 per week while posted at a work building (any NPC post today); halved (rounded down) when Authority ≥ 70 **and** the NPC's `relationshipToPlayer.intimacy` ≥ 70; −5 per week when not posted (rest). Clamped to [0, 100].
- **Stops working at 100:** the post stays assigned, but the NPC gives no post effect (removed from the item week context) and the report says she is exhausted. She works again when Stress falls to 80 or below (Claude's call, so it cannot flicker every week).
- **Arousal:** + `floor(lust / 10)` per week; nothing consumes it yet (P7-C), so it simply saturates at 100.
- **Ageing:** at each 40-week boundary the NPC ages one year; the report notes birthdays.
- **History:** weekly events that already exist for NPCs (post assigned/cleared, exhausted, recovered, birthday) increment keyed counters and append to `recent` (oldest dropped after 20).
- All draws use a new seeded stream; with no NPCs nothing changes (LAW-03).

## 6. UI (PC first)

- **NPC sheet** in the Characters destination, four tabs:
  1. **Profile:** origin, age and title, hobbies, traits, affection (from `relationshipToPlayer`).
  2. **Skills:** the five skills, Stress bar with a band label (Calm / Tired / Exhausted).
  3. **18+:** Mind bar (white Light end, pink Dark end, marker at the value, text label of the band), Lust, Arousal, Beauty, Sex-exp per part with level and progress.
  4. **History:** counters grouped by category, and the last 20 events.
- Bands always have text labels, never colour alone; every tab has a keyboard path.

## 7. Data, save and checks

- New data file(s) for origins and hobbies with a validator and pins (DATA-01 pattern).
- `life` is validated (ranges, catalog ids, ≤ 20 recent events, levels and exp caps) and persisted in the DATA-01 `npcs` records; round trip byte-identical. Ruleset `tile-society-09` → `10`; older saves refused unchanged (LAW-06).
- Golden regenerated once with a path diff limited to NPC `life` paths, the ruleset id and report fields for the new weekly notes.
- Tests: each weekly rule at its edges (Stress 0/100, halving at 69/70, recovery at 81/80, birthday at the 40-week boundary, Arousal saturation, history drop after 20); validators reject bad shapes; determinism; 100 NPCs × 60 weeks under the tick budget; e2e at 1280 for the four tabs; accessibility at 1280 and 1600.

## 8. Delivery (3 PRs)

| PR | Content |
|---|---|
| A: data and state | catalogs, `life` state, validators, persistence, ruleset 10, starter NPCs given `life`, golden |
| B: weekly rules | Stress, exhaustion, recovery, Arousal, ageing, history, report notes |
| C: UI | the four-tab NPC sheet |

## 9. Risks
- **Public repo:** the 18+ tab labels (Sex-exp parts) will be public on GitHub. The owner should confirm this is acceptable before PR C.
- **Balance:** all numbers are TRIAL; Stress may force too much rotation with only 3 NPCs until P7-B adds more.
- **Save reset:** ruleset 10 refuses older saves, as every ruleset change has.

## 10. Open questions for the owner (G1)
1. Approve the P7 split and order (overview doc)?
2. Stress rates: +4/week at work, −5/week resting, back to work at 80 — keep as TRIAL?
3. Beauty: a seeded 40–80 starting value with no change in P7-A — OK?
4. Public repo: show the 18+ tab labels as written (Sex-exp: Hand, Mouth, Breast, Vagina, Ass), or use neutral labels in public builds?
