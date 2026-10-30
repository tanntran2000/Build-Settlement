# Free Cities (pregmod 4.0.0-alpha.40) — 30-week mechanics study

> Research for [CITY-SOCIETY-DECISIONS-02](../../design/CITY-SOCIETY-DECISIONS-02.md), requested by the owner on 2026-10-30. **Mechanics only**; no game text or adult content is reproduced. Not a spec; nothing here is approved for Haven unless the decision log says so.

## Method

- Local build `D:\NghienCuuTiemNang\fc-pregmod-pregmod-master\bin\FC_pregmod.html`, driven headless by a Playwright script (Claude scratchpad, not in the repo).
- Intro: all characters 18+, no extreme content, "Engineering" background, "Clever social engineering" (one Future Society credit at start), new urban arcology, **Security Expansion (SecExp) enabled**.
- Two runs of **30 ended weeks** each: **Light** adopts Paternalism, **Dark** adopts Degradationism, and each re-adopts when the project fails. On odd weeks the first event option was taken; otherwise events were declined. Forced battles were played as deploy → orders → bribe → surrender.
- Limits: the driver never bought slaves, built facilities, decorated sectors, passed Policies/Edicts or invested in security. Results show a **passive** owner.
- Source was read for formulas: `src/futureSocieties`, `src/endWeek/economics/fsDevelopments.js`, `src/Mods/SecExp/js/authorityReport.js`, `src/arcologyBuilding`.

## Results (week 1 → week 31)

| | Light (Paternalism) | Dark (Degradationism) |
|---|---|---|
| Cash | 10k → 26k (spent on bribes, repairs) | 14k → 174k |
| Reputation | 1,000 → 3,636 | 1,000 → 3,940 |
| Prosperity | 50 → 114 | 50 → 115 |
| Citizens lower / middle / upper / top | 3,120 / 890 / 200 / 40 → 5,509 / 1,647 / 372 / 53 | → 5,745 / 1,708 / 392 / 57 |
| NPC slaves in the city | 900 → 1,793 | 900 → 1,882 |
| Security (0–100) | 100 → 16 | 100 → 15 |
| Crime | 30 → 42 | 30 → 45 |
| Society project | failed 6×, then held from week 16 and **capped at 20** | failed **12×**, never held above 3 |
| Slave rebellions | 1 (week 20) | **2** (weeks 14, 27) |
| Outside attacks | 3 (weeks 5, 15, 28) | 2 (weeks 12, 23) |

## Mechanics observed

1. **City economy.** Weekly rents (~¤12.9k at week 25), prosperity growth, and weekly immigration **per class** (e.g. +123 lower, +34 middle, +7 upper, +1 millionaire). **Debt enslavement:** ~20 lower-class citizens per week become slaves, a steady population → slave flow driven by the economy.
2. **Ownership → Authority.** Owning a majority of the city (57%) raises **Authority** weekly. Authority is the currency for **Edicts** (¤5,000 + Authority each), while **Reputation** pays for **Policies** (¤5,000 + some reputation).
3. **Future Society needs upkeep.** Progress is capped by the city's **decoration** level for that society (20 with no investment). It grows from slaves living by its standard, its slave-market regulation (+0.1/week) and weekly spending. **Below 0 the project fails** ("citizens were repelled more than attracted") and is removed. The dark society failed far more often for a passive owner.
4. **Security decays.** Without investment, Security falls from 100 to ~15 in 30 weeks, and crime rises as the outside world deteriorates.
5. **Rebellion.** Weekly slave pressure from the slave/citizen ratio, Security, Authority and the society axis (Degradationist +30, Paternalist −5) builds **tension**. A **Slave Rebellion** event then shows the rebel count (e.g. 233). The player picks rules of engagement (non-lethal only / no heavy ordnance / normal) and can **garrison vital systems** (penthouse, reactors, the assistant's CPU, waterways), or surrender. **Surrender:** most rebels escape, others loot for days, the city is "scarred", Authority collapses to ~0 and tension resets.
6. **Outside attacks.** Raiders or mercenaries hired by a rival city arrive every ~10 weeks. The player chooses a leader, tactics (choke points, guerrilla, blitzkrieg…) and units, or **bribes** (~¤5k, accepted) or surrenders.
7. **Three event layers.** *Individual* events about one slave (inspection, infractions, distress) change that slave's devotion/trust. *City* events (fads, crime caught, the owner's excesses) affect the city or the player. *Scheduled* story beats teach systems at fixed weeks: week 4 Future Societies, week 5 business/leases, week 15 hosting the elite, week 18 visiting another city (diplomacy), week 23 a holiday, week 24/29 the outside world's unrest.
8. **Reports explain causes.** Each security section lists its causes in plain sentences ("very low authority allows slaves to think too freely", "low crime leaves citizens satisfied"). Economics shows migration per class and **satisfaction % per class per service**, including the share served by private suppliers.

## Takeaways for Haven (proposals, not decisions)

- **Slave inflow from the economy** (debt enslavement) fits §3 of the decision log: slaves come from the four groups, with their group bonus.
- **Revolt as an event with choices** (rules of engagement, protect key buildings, negotiate, surrender with lasting damage) gives the existing Tension chain a playable climax.
- A **Lord's power resource** (Authority) for decrees, earned by control and lost on defeat, could pair with the council vote of §9 (P8).
- The Corruption axis should need **active upkeep** (buildings, laws, spending) to deepen, so the Light/Dark identity is earned. Haven should decide whether it drifts or fails when neglected.
- **Security decays** without Watch Houses and upkeep; outside raids can link the Map (P4) to Security.
- Reports should keep the **"why" sentences** and per-class satisfaction, written as letters (P5).
