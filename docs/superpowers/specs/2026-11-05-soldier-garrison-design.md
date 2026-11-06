# SOLDIER-01 — Garrison and Watch House staffing (design spec v0.1)

Status: **G1 approved by the owner** (Tân, 2026-11-05, verbatim: "Approve G1"). No code is authorized until the owner also approves the implementation plan.
- **Decisions:** from the owner's answers in the Claude session on 2026-11-05 (§10).
- **Numbers:** every number is a TRIAL default, not approved balance.
- **Base:** `main` `d34762a` (P8-A, P8-B and P8-C merged; the engine plays only `tile-society-06`).
- **Inputs:** the [P8-A spec](2026-11-03-p8a-city-order-design.md) (Security target, Watch House, Military Barracks) and the [P8-B2 spec](2026-11-04-p8b2-crime-events-design.md) (crime chance, Barracks raid), both on their docs branches until the docs PR lands.

## 1. Player outcome

The city now has a visible garrison.
- **Soldiers** are the workers assigned to Military Barracks and Watch Houses. The City status shows how many there are and the Security bonus they give.
- A larger garrison adds Security, up to a cap.
- A Watch House holds **at most 2 guards**. Its Security scales with how many guards it has, so losing one guard costs part of its bonus, not all of it.
- An empty or idle Watch House makes crime more likely.
- Raids now strike the whole garrison, **Watch Houses first**.

## 2. Scope and non-goals

**In SOLDIER-01:**
- the soldier count and the Garrison Security bonus;
- the Watch House cap of 2 workers at every level, and Security proportional to its guards;
- +2 percentage points of crime-event chance while any built Watch House is not operating;
- raids on all soldiers, Watch Houses first, with new Report copy;
- ruleset `tile-society-07`;
- City status row, Order Report line, e2e.

**Not in SOLDIER-01 (owner, 2026-11-05; split chosen: "WP lính nay; thám hiểm sau P6; NPC vào P7 (Recommended)"):**
- **Expeditions** on the outside map, a sub-project after P6. More soldiers give better odds of finding items and unlocking outside land. Each expedition has a death rate that removes soldiers. **Soldiers beyond the Garrison cap will add an expedition bonus of at most 20 %** (owner: "Nếu vượt quá thì sẽ bonus vào việc thám hiểm nhưng ko vượt quá 20%"). Nothing about it is shown or stored in SOLDIER-01.
- **P7, with NPC building slots:**
  - Barracks NPC slots: an NPC unlocks soldier training and weekly volunteers; other slots add a small bonus; Barracks NPCs are immune to NPC assassination and kidnap.
  - **Watch House: exactly 1 NPC guard slot.** An NPC guard also counts as "operating" for §5 once P7 lands.

## 3. Soldiers and the Garrison bonus

- **Soldiers** = the summed `workers` of every **enabled** `military-barracks` and `watch-house`.
- **Garrison Security** = `min(12, 3 × floor(soldiers / 4))`.

| Soldiers | 0–3 | 4–7 | 8–11 | 12–15 | 16+ |
| --- | --- | --- | --- | --- | --- |
| Garrison | +0 | +3 | +6 | +9 | +12 (cap) |

- The Security target adds Garrison Security to the existing P8-A terms, before its clamp.
- For the weekly target, soldiers count only on buildings funded this week, like the P8-A Barracks term.

## 4. Watch House

- **Cap:** a Watch House takes at most **2 workers at every level** (today level 2 takes 4). Every other building keeps `maxWorkers × level`.
- **Security term per Watch House:**
  - Start from the level value: 10 at level 1, 15 at level 2.
  - Apply Watch Patrols: × 3/2, floored.
  - Add +5 if the Watch House is on a Slum plot.
  - Multiply by `workers / 2` and floor.

  With 2 workers this equals today's full-staff value. With 1 worker it is half, floored (level 1 → +5). With 0 workers it is 0. The P8-A rule that a Watch House counts only when fully staffed is removed for Watch Houses.

## 5. Idle Watch House and crime chance

A built Watch House is **not operating** if this week it is disabled, has 0 workers, or its upkeep is unfunded.

The weekly crime-event chance becomes `5 + trunc(crime / 2) + 2`, while **at least one** built Watch House is not operating. The +2 is applied **once**, however many Watch Houses are idle (owner: "+2% chỉ tính một lần").

The Information row `Crime events: N% a week` uses the same rule in Planning. There, "operating" means enabled with at least 1 worker, because funding is only known at End Week.

## 6. Raids

- A raid is **available when soldiers > 0**; today it needs Barracks workers.
- Deaths (1 / 2 / 3 by severity, as in P8-B2) are capped at the soldier count.
- Deaths are taken from **Watch Houses first** (map order), **then Barracks** (map order).
- Each death removes one worker and one resident (Free first, then the Bound), as in P8-B2.

## 7. Saves

- **Ruleset `tile-society-07`.** A v6 save may hold a level-2 Watch House with 3–4 workers, which is invalid under the new cap. So `tile-society-06` saves are refused with the existing older-version message; nothing is migrated (risk register R-010).
- The state shape does not change.

## 8. Report and UI

All UI copy is in English. "−" is U+2212.

- **City status row:** `Soldiers 6 · Garrison +3 Security`.
- **Report, Order section:** one line `Garrison: 6 soldiers, Security +3.`, or `Garrison: 1 soldier, Security +0.` for exactly one soldier (amendment, owner Tân, 2026-11-06, verbatim: "Sửa trong PR B (Recommended)", after Astra's P3 on "1 soldiers").
- **Raid Report line** (replaces the P8-B2 copy):
  - `A gang attacked the garrison: 2 soldiers died.`
  - `A gang attacked the garrison: 1 soldier died.`
- **Tile panel:** the Watch House capacity line shows 2 WF at both levels.

## 9. Delivery and acceptance

Two PRs:
- **PR A — engine:**
  - core: `buildingWorkerCap`, soldiers and Garrison helpers, the Watch House term;
  - simulation: Security target, crime chance, raids;
  - ruleset 07 with refusal of 06;
  - v7 fixtures;
  - `OrderReport` gains `soldiers` and `garrisonSecurity`.
- **PR B — UI:** the City status row, the Order line, raid copy, the capacity line, e2e. Run the full smoke suite locally before every push.

Acceptance tests:
- **Garrison:** at 3, 4, 7, 8, 15, 16 and 40 soldiers → 0, 3, 3, 6, 9, 12, 12. Unfunded buildings do not count for the target. Security never exceeds 100.
- **Watch House term:** levels 1 and 2 with 0, 1 and 2 workers, with and without Patrols and Slum. Assigning 3 workers to any Watch House is refused.
- **Crime chance:** +2 with one idle Watch House, still +2 with two, +0 when every built Watch House operates or none is built. The Information row matches the End Week chance when funding is unchanged.
- **Raids:**
  - a city with only Watch House guards can be raided;
  - deaths hit Watch Houses before Barracks;
  - deaths are capped at the soldier count;
  - population and workers stay consistent.
- **Saves:** a `tile-society-06` save is refused; v7 pins round-trip.
- **UI:** copy exact; no horizontal overflow at 375 and 1280 px.

## 10. Owner decisions (Tân, 2026-11-05)

- Request: "Về mục WF trong barrack và Watchtower. Sau khi triển khai WF nên tính và cho đó là số lính trong city." Start: "Start soldier WP".
- Split: "WP lính nay; thám hiểm sau P6; NPC vào P7 (Recommended)".
- Bonus: "giữ như cũ thêm bậc garrison nhưng chỉ đc cộng tối đa 12 security. Nếu vượt quá thì sẽ bonus vào việc thám hiểm nhưng ko vượt quá 20%".
- Raids and the Watch House: "watchhouse sẽ bị tấn công trước nhưng tổng số lính giữa watchhouse và barrack sẽ đc tính chung"; then "giảm số người watch house xuống 2. Khi watch house ko có người vận hành hoặc NPC canh giữ sẽ làm tăng tỉ lệ crime thành công lên 2% trên mọi event crime. Watch house chỉ có 1 slot để assign NPC".
- Watch House Security: "Tính theo số người (Recommended)".
- Final design: "+2% chỉ tính một lần" (Claude's reading: +2 percentage points to the weekly crime-event chance, applied once).
- Claude's assessment, accepted by the owner's final choice: the Garrison bonus helps R-002 (mid-game Security ≈ 41 → 47). Raids on Watch Houses would have caused a full-bonus cliff, which proportional Watch House Security removes.
