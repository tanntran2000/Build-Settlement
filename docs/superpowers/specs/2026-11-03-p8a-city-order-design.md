# P8-A — City order: Security, Crime and Authority (design spec v0.1)

Status: **G1 approved by the owner** (Tân, 2026-11-03, verbatim: "Duyệt G1"). No code is authorized until the owner also approves the implementation plan.
- **Decisions:** from the owner's answers in the Claude session on 2026-11-03 (§11).
- **Numbers:** all numbers are TRIAL defaults, not approved balance; P1 (AI playtest) tunes them.
- **Base:** `main` `abf50e5` (P3 A–C merged; the engine plays only `tile-society-02`).
- **Inputs:** [CITY-SOCIETY-DECISIONS-02](../../design/CITY-SOCIETY-DECISIONS-02.md) §3 (FC Security Expansion study), §4 (Corruption axis), §5 (Watch House in Services), §9 (P8); [TENSION-CRISIS-GOLD-DECISIONS-01](../../design/TENSION-CRISIS-GOLD-DECISIONS-01.md); the [P3 spec](2026-10-31-p3-outside-city-design.md) (research, storage, week order).

## 1. Player outcome

The city gets a sense of **order**: how safe it is, how much crime it breeds, and how firmly the Lord holds it.
- **Security** comes from walls, Watch Houses and soldiers in a Military Barracks. Library research strengthens both.
- **Crime** grows from the Slum, the Dark side and the desperation of the Bound. Security holds it down.
- **Crime costs something every week:** it steals Gold and stored goods, raises Tension and lowers residents' satisfaction.
- **Authority** is the Lord's grip on the city. It rises with Security, a staffed Town Hall and content citizens, and falls with Crime and Tension. It changes how much tax is collected and how many newcomers stay.
- All three values move **gradually** toward a target each week, so building a Watch House helps over several weeks, not at once.

## 2. Scope and non-goals

**In P8-A:**
- `order` state: `security`, `crime`, `authority`;
- the reserved **Watch House** activated (Service or Slum plot);
- a new **Military Barracks** (Service plot, staffed per worker);
- two Library research topics: Watch Patrols, Barracks Drill;
- weekly targets, drift and effects (theft, Tension, satisfaction, tax, immigration);
- the Report "Order" section and Information rows;
- ruleset `tile-society-03`.

**Not in P8-A (owner, 2026-11-03):**
- **P8-B (city events):** crime events — attacks that kill Barracks soldiers, NPC victim events (robbed, humiliated, beaten, raped — outcome and stats only, never graphic), loss of the Player's standing, assassination at very high Crime; the Tension crisis chain (warning → serious demand → protest → rebellion) as event cards with choices; whether events cost Player actions (the queued 5–12 actions/week idea).
- **P8-C:** Town Hall Laws, council votes, city identity.
- **P7/P6:** Authority as an NPC cap; item bonuses to Security/Authority.
- No change to Corruption, Desperation or Tension formulas; P8-A only adds to Tension and satisfaction after they resolve (§6).

## 3. State

`society.order`, three integers 0–100:

| Value | Meaning | New Game |
|---|---|---|
| `security` | how well the city keeps order | 30 |
| `crime` | how much crime the city breeds | 10 |
| `authority` | the Lord's grip on the city | 50 |

Research state gains two topics, `watch-patrols` and `barracks-drill`, next to `deep-mining` (same `topic` / `progressMilli` / `paid` / `completed` shape as P3).

Validators accept exactly this shape (descriptor-first, as in P3); unknown, missing or out-of-range fields reject atomically.

## 4. Buildings and research

| Building | Plot tier | Staff | Levels | Workers | Cost Gold/Wood/Iron | Upkeep |
|---|---|---|---|---|---|---|
| **Watch House** (`watch-house`, reserved today) | Service **or Slum** | basic | 1–2 | exactly 2 × level | 5 / 4 / 1 | 0.5 Gold |
| **Military Barracks** (`military-barracks`, new) | Service | basic | 1–2 | 0 to 4 × level | 8 / 6 / 4 | 1 Gold |

- Build cost and level-up follow the existing rule (cost × level, Builders' Yard discount). Both stop at level 2, so the level-3 Stone surcharge never applies.
- **Watch House** counts only when fully staffed, like every other building.
- **Military Barracks** counts **per assigned worker**: any number from 0 to `4 × level` is valid and each worker adds Security. This is the one exception to the full-staffing rule. Upkeep is paid like any built building.
- "basic" staff is the existing pool: Free workers first, then the Bound (`societyEmployment`). Whether a number fits the pool is checked by the engine only (owner: "Engine check is enough").
- A Watch House on a Slum plot is **not** a Slum building for any count (Security penalty, Crime, Corruption).

| Research topic | Effect when completed | Cost |
|---|---|---|
| **Watch Patrols** (`watch-patrols`) | the level part of every staffed Watch House × 1.5, rounded down | 6 worker-weeks, 6 Gold |
| **Barracks Drill** (`barracks-drill`) | each Barracks worker gives +3 Security instead of +2 | 8 worker-weeks, 8 Gold |

Research runs exactly as Deep Mining does today: one topic at a time at the Library, Gold paid on start.

## 5. Weekly targets

Integer arithmetic; every division rounds toward zero; each target is clamped to 0–100.

**Inputs:** operating buildings as today; `population` = all residents including the Bound; `slumOther` = operating buildings whose catalog tier is `slum` (Slave Quarters today; Brothel, Black Market, Arena, Drug Store once active); Dark = `corruption > 60`, Light = `corruption < 40` (the existing thresholds).

**Security target**

| Source | Value |
|---|---|
| Base | +10 |
| Wall | +5 × open wall rings (ring 1 = +5 … ring 3 = +15) |
| Watch House, staffed, level 1 / 2 | +10 / +15 each |
| Watch Patrols completed | that level part × 1.5, rounded down |
| Watch House on a Slum plot | +5 more each (not multiplied) |
| Military Barracks | +2 per worker (+3 with Barracks Drill) |
| Population | − population ÷ 20 |
| Other Slum buildings | −3 × `slumOther` |
| Dark side | −5 |

**Crime target:** 10 + 5 × `slumOther` + desperation ÷ 5 + (Dark +10 / Light −5) − security ÷ 2.

**Authority target:** 40 + (security − 50) ÷ 5 − crime ÷ 4 + (Town Hall fully staffed ? 10 : 0) + (mean satisfaction of free, makers, luminaries, merchants − 50) ÷ 5 − tension ÷ 10.

Security uses this week's population and buildings. Crime uses the **new** Security. Authority uses the new Security and Crime and this week's resolved Tension and satisfaction (before the order step's own changes).

**Drift:** each value moves toward its target by at most **5** (Security, Crime) or **3** (Authority) per week.

**Worked example (unit-test fixture, targets only):** 100 residents, wall ring 1 open, one level-1 Watch House on a Service plot, Barracks with 4 workers, one other Slum building, Corruption 50, Desperation 10, Tension 0, mean satisfaction 80, Town Hall unstaffed. The target formulas are evaluated with the target Security and Crime here.
- Security target = 10 + 5 + 10 + 8 − 5 − 3 = **25**.
- Crime target = 10 + 5 + 2 − 25 ÷ 2 (= 12) = **5**.
- Authority target = 40 + (25 − 50) ÷ 5 (= −5) − 5 ÷ 4 (= −1) + 0 + (80 − 50) ÷ 5 (= 6) − 0 = **40**.
- Same city with the Watch House on a Slum plot: Security **30**, Crime 10 + 5 + 2 − 15 = **2**, Authority 40 − 4 − 0 + 6 = **42**.

## 6. Weekly effects

**Crime** (after drift, this week's value):

| Effect | Rule |
|---|---|
| Theft | if crime ≥ 20: lose `(crime − 20) × 10` bps of Gold and of each stored good (Food, Wheat, Wood, Iron, Stone, Wool, Cloth, Herbs, Goods, Luxury), each `floor(stock × bps / 10000)`. Max 8 % at crime 100. Stocks never go negative. |
| Tension | + crime ÷ 25 (0 to +4), added after the society step, clamped to 0–100 |
| Satisfaction | free, makers, luminaries and merchants each −1 at crime ≥ 40, −2 at crime ≥ 70, clamped to 0–100 |

**Authority** (start-of-week value, because tax and immigration resolve before the order step):

| Effect | Rule |
|---|---|
| Tax | tax × (10000 + (authority − 50) × 40) / 10000, rounded down, applied after the Counting House bonus (−20 % at 0, +20 % at 100) |
| Immigration | authority < 30: arrivals ÷ 2, rounded down; authority ≥ 70: +1 arrival if the immigration target still has room |

## 7. Week order

1. Existing week: production, tax (with the Authority factor), upkeep, society step (satisfaction, Desperation, Tension, Corruption), immigration (with the Authority factor), outside land.
2. **Order step (new):** targets → drift → theft → Tension → satisfaction.
3. Storage spoilage (stays the last step, as in P3).

## 8. Report and UI

Report section **Order** (English UI copy):
- `Security 25 → 30 (target 40)`, and the same for Crime and Authority;
- `Theft: −1.2 Gold, −0.3 Food, −0.5 Wood` (only goods actually lost; omitted at 0);
- `Crime raised Tension by 2.` / `Crime lowered satisfaction by 1.`;
- `Authority 25: taxes −10%.` / `Authority 20: half of the newcomers turned away.` / `Authority 75: one more newcomer stayed.`

Information: three rows — Security, Crime, Authority — each with value, target and band `Low` (0–33), `Fair` (34–66), `High` (67–100).

Build: Watch House offered on Service and Slum plots (Slum note: `+5 Security in the Slum`); Military Barracks on Service plots. Barracks workers use the digit-only input rule (empty or malformed input shows `Use whole nonnegative workers.` and never dispatches). Library lists the two new topics.

Report parity in e2e helpers must include `order`, as PR C of P3 did for `outside`.

## 9. Ruleset and saves

- New ruleset **`tile-society-03`** for every New Game.
- `tile-society-02` saves are refused with the existing message ("This checkpoint is from an older version of Haven and can no longer be played. Start a New Game."). Nothing is migrated, as in P2-D and P3.
- New pinned fixtures under `society-v3/`.

## 10. Delivery and acceptance

Three PRs, as in P3:
- **PR A — state and commands:** `order` state and validator, Watch House activation, Military Barracks, the two research topics, build/staff/research commands accepted by the Character Life dispatcher, ruleset 03 and fixtures. End Week keeps the P3 week until PR B.
- **PR B — week rules:** targets, drift, theft, Tension, satisfaction, tax and immigration factors, `report.order`.
- **PR C — UI:** Information, Build, Barracks input, Library topics, Report section, e2e.

Acceptance tests:
- the §5 worked example, exactly (both variants);
- each Security source and each Crime/Authority term in isolation;
- drift caps (5/5/3) and 0–100 clamps;
- theft at crime 19, 20, 60 and 100; no stock below 0;
- tax factor at authority 0, 50, 100; immigration halving and +1 with and without room;
- Barracks accepts 0…4 × level workers and rejects more or malformed input on a clone (all-or-nothing);
- Watch House on a Slum plot is excluded from `slumOther`;
- determinism: same seed and commands give the same state;
- Save/Load and Export/Import round-trip keep `order`; a `tile-society-02` save is refused;
- UI: three Information rows, Report section, Barracks digit-only input, no horizontal overflow at 375 and 1280 px.

## 11. Owner decisions (Tân, 2026-11-03)

- P8 is split: **P8-A stats → P8-B events → P8-C laws** ("Stats → Events → Laws").
- Stats: **Security + Crime + Authority** (FC Security Expansion model).
- The Tension crisis chain goes to **P8-B as an event chain** with choices.
- Security sources, verbatim: "Ngoài Watchhouse thì có military barrack nơi để WF vào. watchhouse có thể xây ở Slum để thêm bonus secutity. bộ 3 wall+ watchhouse + barrack sẽ là 3 cái để tăng security. Ngoài ra sẽ có 1 số research tại viện nghiên cứu dùng để làm nâng cấp bonuss thêm vào".
- Crime effects, verbatim: "ngoài việc tăng Theft + authority và tension thì sẽ có event — tấn công làm tốn WF trong military barrack; ảnh hưởng đến tâm lý của NPC (Mind); … TP sẽ gây giảm sự hài lòng của cư dân; NPC sẽ có event bị giật đồ, bị sỉ nhục, bị đánh, bị cưỡng hiếp; Player khả năng sẽ giảm uy danh và nếu quá cao sẽ bị ám sát". Weekly theft, Tension, Authority and satisfaction are in P8-A; the events are P8-B.
- Authority effect now: **tax + immigration**.
- Architecture: **own module like P3** (`order` state and an order week step).
- Design sections 1 and 2 approved in chat ("Ổn, sang phần 2"; "Ổn, viết spec").

## 12. Found while designing (not fixed here)

- `societyFacilities` never increments `operatingSlumBuildings`, so the Corruption target is always 30 today, even with Slave Quarters built. P8-A computes its own `slumOther` count and does not touch Corruption (LAW-01). Fixing the Corruption counter changes balance and needs an owner decision.
- `packages/content/src/city-design.ts` lists Security in its display descriptors (P2-E audit, low). PR C may align that copy with the new rows.
