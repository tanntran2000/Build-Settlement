# P7 — NPCs: sub-project split (proposal v0.1)

**Status:** approved with P7-A by the owner (Tân), 2026-11-17, verbatim: "Duyệt P7-A". Each later sub-project still needs its own spec and G1. Base `main` `753e450` (P6-B complete).

All NPCs are female adults, 18 or older (owner, 2026-11-11). Adult content is mechanics only: stats, counters and outcomes, never graphic text. All UI text is English. Public text never names other games.

## Why split

The owner's P7 notes (2026-11-03 to 2026-11-13) describe at least seven independent systems. One spec would be too large to review or build safely. Each sub-project below has its own spec, plan and 2–3 PRs, and each ends with something playable or testable.

## Proposed order

| # | Sub-project | What the player gets | Depends on |
|---|---|---|---|
| **P7-A** | **NPC core sheet** | Mind (Light ↔ Dark), Lust, Arousal, Stress, Beauty, age and age titles, hobbies, Sex-exp per part, keyed history; Stress stops work at 100; the 4-tab NPC sheet | — |
| **P7-B** | **Acquisition** | No starter NPCs; Auction House (legal slaves, Light half), Guild (hired servants, wages), Slave Market (Slum, Dark half); seeded NPC generation; NPC cap | P7-A |
| **P7-C** | **Player actions and interactions** | 5 actions per week (max 12), 1 action = 1 turn for temporary effects; dates, intimacy, rest; Mind/Lust/Stress changes from actions; Arousal-driven partner seeking and the NTR route; utility scoring for NPC choices | P7-A, P7-B |
| **P7-D** | **NPC work slots** | 2–3 NPC slots per building with a stacking bonus; Barracks NPC unlocks soldier training and weekly volunteers; Barracks NPCs immune to crime kidnap/assassination | P7-A |
| **P7-E** | **NPC crime chain** | Kidnap, rescue missions, defection after captivity, imprison/persuade/sell back (needs the Black Market) | P7-B, P7-C, P7-D, Expedition |
| **P7-ART** | **NPC appearance** | Layered paper-doll (body, face, hair, outfit), palette swaps by seed, mapping the owner's existing art library | separate art track (Codex draws; Claude orchestrates) |

The Mansion (staff roles, household climate) and P6-C (18+ items, Rose Quartz / Maiden Pearl, the owner's 18+ recipes) come after P7, as already decided.

## Rules carried into every P7 sub-project
- NPCs have **no Health**. They leave only when the Player sells or dismisses them, or through a written life-or-death event (owner, 2026-11-12).
- **Stress 100 stops work only**; no runaway (owner: "chỉ ngưng làm việc thôi ko bỏ trốn").
- Age titles: 18–29 **Young Adult**, 30–49 **Mature**, 50+ **Granny** (owner: "Đổi seasoned thành Granny đi"). A game year is 40 weeks.
- Mind is one bipolar bar, starting at the centre, Light on the left and Dark on the right (owner, 2026-11-03).
- Stats are clamped to [0, 100] (LAW-04); no values over 100.
- Determinism (LAW-03): every NPC draw is seeded; one weekly tick for 100 NPCs stays under 50 ms.
- History is keyed counters plus the last 20 events per NPC, so the save stays under its 1 MiB export cap.

## Owner decision needed (G1)
Approve this split and order, or change it. The first sub-project, P7-A, has its own spec: `2026-11-17-p7a-npc-core-design.md`.
