# P8-C — Town Hall laws (design spec v0.1)

Status: **draft for G1.** No code is authorized until the owner approves this spec and then the implementation plan.
- **Decisions:** from the owner's answers in the Claude session on 2026-11-05 (§12).
- **Numbers:** every number is a TRIAL default, not approved balance; the v0.1 simulation pass and P1 tune them.
- **Base:** `main` `f8730e1` (P8-A, P8-B1 and P8-B2 merged; the engine plays only `tile-society-05`).
- **Inputs:** [CITY-SOCIETY-DECISIONS-02 §9](../../design/CITY-SOCIETY-DECISIONS-02.md) (Town Hall enacts laws; votes in proportion to the four citizen groups; Frostpunk-style council); the [P8-A spec](2026-11-03-p8a-city-order-design.md) (Security, Crime, Authority targets, tax factor); the [P8-B1 spec](2026-11-04-p8b1-tension-crisis-design.md) (Pay / Promise / Force, pending card); the [P8-B2 spec](2026-11-04-p8b2-crime-events-design.md) (Standing). The last three stay on their docs branches until the docs PR lands.

## 1. Player outcome

The Lord can now pass laws at the Town Hall.
- A built, staffed Town Hall opens the **Council**. It lists eight laws. Each law trades one thing for another, and some push the city toward Light or Dark.
- Each citizen group — Free residents, Makers, Luminaries, Merchants — has a fixed stance on each law: **For**, **Against** or **Neutral**. Votes count by head; each Elite counts as five. The Bound have no vote.
- Before calling the vote, the Lord sees the tally and can **lobby** groups that are not For: **Pay** them, **Promise** to look after them, or **Force** them. The law passes when For outweighs Against.
- Up to **three laws** can be in force. One vote per week. A law can be repealed at any time for an Authority cost, and then cannot return for four weeks.

## 2. Scope and non-goals

**In P8-C:**
- `society.laws` state and ruleset `tile-society-06`;
- the eight-law catalogue (§5) with stances, tags and weekly effects;
- `previewLawVote` (pure tally and cost), `ENACT_LAW` and `REPEAL_LAW` commands;
- weekly law effects and the law promise in End Week;
- Report letter `Laws`, Information row, Council panel in the Town Hall inspector.

**Not in P8-C:**
- Laws about slaves or Slum buildings → P7 (needs the NPC rebuild and the Black Market).
- **Soldier count** (owner, 2026-11-05, verbatim: "Về mục WF trong barrack và Watchtower. Sau khi triển khai WF nên tính và cho đó là số lính trong city."). Placement chosen: "(1) WP nhỏ sau P8-C" — a small WP right after P8-C.
- **NPC work slots** (same message, verbatim: "Mỗi building có từ 2 - 3 slot để cho NPC vào làm việc nhằm làm tăng bonus cho building."). Placement chosen: "(2) P7".
- Random votes, multi-step sessions, a pending-vote state, Player action points.
- Fixing R-001 (the Corruption target ignores Slum buildings). Laws add their own term (§6.5) whatever that bug's fate.

## 3. State

| Field | Type | New Game |
| --- | --- | --- |
| `society.laws.active` | `LawId[]`, distinct, at most 3, in enactment order | `[]` |
| `society.laws.votedWeek` | integer week or `null` | `null` |
| `society.laws.repealedUntil` | `Partial<Record<LawId, number>>` (first week the law may be enacted again) | `{}` |
| `society.laws.promise` | `{ group: SocietyClassKey; lawId: LawId; satisfactionAtVote: number; weeksLeft: 1–4 } \| null` | `null` |

- `LawId` = `'curfew' | 'watch-levy' | 'guild-charters' | 'war-tithe' | 'poor-relief' | 'free-assembly' | 'public-punishments' | 'licensed-vice'`.
- Validation rejects unknown ids, duplicates, more than 3 active laws, and out-of-range numbers.
- New ruleset **`tile-society-06`**. `tile-society-05` saves are refused with the existing older-version message; nothing is migrated.

## 4. The vote

**Voting weight** of each group (`SocietyClassKey`):
- `free` = `classes.free`;
- `makers`, `luminaries`, `merchants` = `common + 5 × elite`;
- the Bound have no weight. A group with weight 0 casts no vote.

**Tally.** Each group votes its stance on the law (§5), or **For** if lobbied in this vote. Neutral groups do not vote. **The law passes when the For weight is strictly greater than the Against weight.** A tie, or no votes at all, fails.

New Game example: Free 55, Makers 20, Luminaries 12, Merchants 13.

**Lobbying.** Each group that is Against or Neutral and has weight > 0 may be lobbied once per vote, with one option:

| Option | Cost (applied only when the law passes) | Available when |
| --- | --- | --- |
| **Pay** | Gold `200 milli × weight` (Free 55 → 11 Gold) | Gold covers the total Pay cost of the vote |
| **Promise** | Opens the law promise (§6.6) for that group | No law promise is open, and only one group is promised per vote |
| **Force** | That group's satisfaction −10, Tension +5, Standing −3 | Security ≥ 40 |

**`previewLawVote(state, lawId, lobby)`** is a pure function in core. It returns:
- each group's weight, stance and lobbied stance;
- the For and Against totals, and `passes`;
- the total Gold cost;
- the first refusal code, if the command would be refused.

The Council panel and `ENACT_LAW` both use it, so the preview always matches the result.

## 5. Law catalogue

Tags: **L** = Light, **D** = Dark, – = neutral. Stances: **F** For, **A** Against, – Neutral.

| Id | Name (UI) | Tag | Weekly effect while in force | Free | Makers | Lumin. | Merch. |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `curfew` | Curfew | – | Security target +10; Free satisfaction −2 | A | – | – | F |
| `watch-levy` | Watch Levy | – | Costs 1 Gold; Crime target −5 | F | – | – | A |
| `guild-charters` | Guild Charters | – | Makers satisfaction +2; Merchants satisfaction −2 | – | F | – | A |
| `war-tithe` | War Tithe | – | Tax +10 %; every group's satisfaction −1 | A | A | – | A |
| `poor-relief` | Poor Relief | L | Costs 1.5 Gold; Desperation −3; Free satisfaction +2 | F | F | – | A |
| `free-assembly` | Free Assembly | L | Tension −3; Authority target −5 | F | – | F | – |
| `public-punishments` | Public Punishments | D | Crime target −10; Tension +2 | A | – | A | F |
| `licensed-vice` | Licensed Vice | D | Earns 1.5 Gold; Luminaries satisfaction −2 | – | F | A | F |

Every **D** law adds +10 to the Corruption target and every **L** law adds −10 (§6.5).

## 6. Rules

### 6.1 `ENACT_LAW { lawId, lobby, expectedRevision }`

`lobby` is a partial map `SocietyClassKey → 'pay' | 'promise' | 'force'`. The command runs in the Planning phase only and is all-or-nothing (LAW-04): on any refusal the state is unchanged.

Refusals, checked in this order:

| Code | When |
| --- | --- |
| `CITY_FALLEN` | the city has fallen |
| `CARD_PENDING` | a crisis card is waiting |
| `UNKNOWN_LAW` | `lawId` is not in the catalogue |
| `TOWN_HALL_CLOSED` | no Town Hall is both enabled and staffed by at least 1 worker |
| `VOTE_USED` | `votedWeek` equals the current week |
| `LAW_ACTIVE` | the law is already in force |
| `LAW_SLOTS_FULL` | three laws are in force |
| `LAW_COOLDOWN` | `repealedUntil[lawId]` is greater than the current week |
| `LOBBY_INVALID` | a lobbied group is For, has weight 0, or is not a voting group |
| `OPTION_UNAVAILABLE` | a lobby option's condition (§4) is not met |
| `VOTE_SHORT` | the tally does not pass |

On success, in this order:
1. Debit the Pay Gold.
2. Apply each Force.
3. Open the promise, with `satisfactionAtVote` = the group's satisfaction after any Force and `weeksLeft` = 4.
4. Append the law to `active`.
5. Set `votedWeek`.
6. Clear `repealedUntil[lawId]`.

The revision advances once.

### 6.2 `REPEAL_LAW { lawId, expectedRevision }`

The command runs in the Planning phase only. It needs no vote and no Town Hall.

- Refusals: `CITY_FALLEN`, `UNKNOWN_LAW`, `LAW_INACTIVE`.
- On success: remove the law from `active`, apply Authority −5 (clamped at 0), and set `repealedUntil[lawId] = week + 4`.
- An open promise tied to that law stays open and resolves as normal.

### 6.3 Order terms

`OrderFacts` gains `lawSecurity`, `lawCrime` and `lawAuthority`: the sums of the in-force laws' target terms. They are added to the P8-A Security, Crime and Authority targets before the targets are clamped. The values themselves still drift toward the targets as in P8-A.

### 6.4 Gold and tax

- **War Tithe** adds +1000 bps to the Authority tax modifier. The P8-A rule stays: the guaranteed lower bound is credited before upkeep and the remainder after.
- **Law costs** (Watch Levy, Poor Relief) are debited after building upkeep and the full tax, in `active` order.
  - If Gold does not cover a law's cost, nothing is debited for that law and **its effect does not apply this week**. The Report shows it as unfunded.
  - Stocks never go negative.
- **Licensed Vice** income is credited with the tax.

### 6.5 Society terms

Applied in the society step, each result clamped to 0–100:
- satisfaction deltas: after `resolveSatisfaction`, before city Happiness is computed;
- Desperation and Tension deltas: after `resolveDesperation` and `resolveTension`;
- Corruption target = `clamp(base + Slum term + 10 × (Dark laws − Light laws))`. Corruption still steps toward its target as it does today.

Only laws that are in force and funded this week apply.

### 6.6 Law promise

- Each End Week, `weeksLeft` decreases by 1 after the order step.
- When it reaches 0:
  - if the group's satisfaction is **≥ `satisfactionAtVote`**, the promise is **kept**: Authority +3;
  - otherwise it is **broken**: that group's satisfaction −10 and Tension +10;
  - then `promise` is set to `null`.
- The P8-B1 crisis promise is separate and unchanged.

### 6.7 Week order

1. Existing week steps, in their current order:
   - production;
   - tax, now including War Tithe and Licensed Vice;
   - upkeep;
   - **law costs (new)**;
   - society step, **now with law terms**;
   - immigration and outside land;
   - order step, **now with law terms**.
2. **Law promise step (new).**
3. Crime step (P8-B2), crisis step (P8-B1), then storage spoilage, which stays last.

There are no random draws, so the same state and commands always give the same result (LAW-03).

## 7. Report and UI

All UI copy is in English. "−" is U+2212.

**Report letter `Laws`:**
- `Laws in force: Curfew, Poor Relief.` or `No laws in force.`
- `Poor Relief cost 1.5 Gold.` / `Poor Relief was unfunded: no effect this week.` / `Licensed Vice earned 1.5 Gold.`
- `You kept your promise to the Makers: Authority +3.` / `You broke your promise to the Makers: satisfaction −10, Tension +10.`

**Council panel** in the Town Hall inspector:
- The eight laws. Each shows its tag (Light / Dark), its effect line, and four stance chips in the class colours (§10 of the decisions doc).
- For the selected law:
  - a lobby choice for each eligible group;
  - the live tally (`For 75 · Against 13`) and the total Gold cost;
  - **Call the vote**, disabled with the refusal reason from `previewLawVote` when the vote would be refused.
- Laws in force, each with **Repeal** (`Authority −5; cannot return for 4 weeks.`). Laws on cooldown show `Returns in week N.`
- Without an operating Town Hall the panel shows `Staff the Town Hall to call a vote.`

**Information row:** `Laws 2/3`.

## 8. Saves and fixtures

- New pinned fixtures under `society-v6/`, including a save with three laws in force, one law on cooldown and an open promise.
- The save format still accepts only Planning sessions, and a fallen city is never saved (P8-B1).

## 9. Delivery and acceptance

Three PRs, as in P8-A and P8-B:
- **PR A — state and vote core:** `LawId`, the catalogue, `society.laws`, validation, ruleset 06 with refusal of 05, `previewLawVote`, v6 fixtures. End Week is unchanged.
- **PR B — commands and week rules:** `ENACT_LAW`, `REPEAL_LAW`; the order, Gold, tax and society terms; the law promise; `report.laws`; pinned fixtures.
- **PR C — UI:** the Council panel, the Report letter, the Information row, e2e. **Run the full smoke suite locally before every push.**

Acceptance tests:
- **Weights:** the New Game totals; an Elite counts 5; the Bound never vote; a weight-0 group casts nothing.
- **Tally:** For > Against passes; a tie fails; all Neutral fails; lobbying flips a group to For.
- **Refusals:** every refusal code leaves the state unchanged, and codes are checked in the §6.1 order.
- **Lobbying:** Pay debits exactly `200 × weight` milli; Force needs Security ≥ 40 and applies −10 / +5 / −3; only one promise is open at a time.
- **Limits:** one vote per week; three slots; repeal costs 5 Authority and blocks the law for exactly 4 weeks.
- **Effects:** one test per law for its weekly effect, plus the unfunded case for the two laws that cost Gold.
- **Corruption:** the target moves +10 per Dark law and −10 per Light law.
- **Promise:** kept at equal satisfaction, broken one point below.
- **Tax:** War Tithe keeps the P8-A tax property test green.
- **Saves:** determinism and save round-trip with laws, cooldown and promise; a `tile-society-05` save is refused.
- **UI:** the preview equals the command result; the Report lines; no horizontal overflow at 375 and 1280 px.

## 10. Risks to log

- Free residents hold a majority at New Game, so any law the Free support passes without effort (balance; check in the v0.1 pass).
- Pay may be the dominant lobby option when Gold is plentiful.
- War Tithe and Licensed Vice may earn more Gold than the costed laws spend.

## 11. Open points for the plan

None. Exact file placement and helper names are plan decisions.

## 12. Owner decisions (Tân, 2026-11-05)

- Start: "Start P8-C".
- Law kind: "Luật lẻ, có tag Light/Dark (Recommended)".
- Vote: "Phiếu công khai + vận động (Recommended)".
- Voters: "Theo số dân, Elite ×5, Bound không (Recommended)".
- Limits: "3 ô luật, 1 phiếu/tuần (Recommended)".
- Architecture: "Một lệnh, xem trước kết quả (Recommended)".
- Design sections approved in chat:
  - Section 1: "OK, sang Phần 2 (Recommended)". This includes moving the 4-week wait from a rejected law to a repealed law, because a previewed vote never fails.
  - Section 2: "OK, sang Phần 3 (Recommended)".
  - Section 3: "OK, viết spec (Recommended)".
- New idea during Section 3 (verbatim in §2): soldier count "(1) WP nhỏ sau P8-C"; NPC work slots "(2) P7".
