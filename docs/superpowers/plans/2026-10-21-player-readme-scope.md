# Player README — later approved documentation packet

**ID:** DOC-PLAYER-README-01. **Recorded:** 2026-10-21. **Scope:** documentation only.

## Authority and chronology

The user separately requested a short player-facing README and removal of formulas, balance tables and internal calculation detail from that entry document. The user subsequently expressly approved publication of the reviewed fixes together with the shortened README. This records that later approved packet; the README rewrite was not part of the earlier [needs foundation](2026-10-21-tile-needs-foundation.md) or [precision fixes](2026-10-21-tile-feedback-precision-fixes.md) allowlists, and this record does not broaden those packets retroactively.

The README-only change is preserved as local commit `a5111ae7cba3768206d3a7937c497451f45b530b`, included in local candidate `5a4aec03cc6488a1461412dff93f798b175bc8c3`. [PR33](https://github.com/tanntran2000/Build-Settlement/pull/33) head `1bd6548d9a65e6cc77304dba921f4ff8d3dca3d1` has the identical tree `48b5ce45430041b5ff7bbc1f7b2625d345975560`. These identities establish the README being documented; they do not claim this documentation correction is already reviewed, published or merged.

## Approved result and preservation

- Keep a brief introduction, features actually available, minimal source-run and planning-checkpoint instructions, prototype limitations and contribution/mod guidance.
- Remove detailed formulas, balance/coefficient tables, worked calculations and internal QA/packaging instructions from README. Preserve the existing formulas and history in their existing design/spec documents; do not change balance, recipes or approval classifications.
- Keep repository visibility, history, source, licensing and existing design files unchanged. A shorter README does not make the public repository's source, documentation or history private.
- This correction changes only this packet record and the roadmap's contract references. Preserve the shortened README and all runtime, tests, catalog, persistence, dependency and CI bytes.

## Runtime and design references

- Playable tile behavior, building lifecycle, workforce, economics and TRIAL boundaries: [tile building trial spec](../specs/2026-10-20-weekly-tile-buildings-trial.md).
- Planning checkpoint format, compatibility and atomic import/export: [tile checkpoint spec](../specs/2026-10-20-tile-trial-save.md).
- Separate classic Weekly production: [Wheat/Food-chain WP](../../work_packages/WP-WHEAT-FOOD-CHAIN-01_v0.1.md).
- Approved Food/Happiness design and deferred effects: [Food rulebook](../../design/FOOD-HAPPINESS-TRIAL-RULES-01.md).
- Subsequent Goods/Tension/Gold design decisions and pending boundaries: [decision record](../../design/TENSION-CRISIS-GOLD-DECISIONS-01.md).

Read each source within its stated mode, implementation status and later scoped clarifications. README is the player entry document, not the detailed runtime contract. No new mechanic, numerical approval, save migration or release gate is established here.

## Acceptance for this documentation correction

The delta contains only this record and `docs/MASTER_ROADMAP.md`; all relative links resolve. README and every previously tracked file outside the roadmap remain byte-identical to the frozen candidate. Existing design/spec formulas remain untouched. Deliver an immutable patch and updated files for parent-owned review/testing; publication and merge remain with the parent coordinator.
