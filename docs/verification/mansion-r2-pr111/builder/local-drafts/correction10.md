
### Correction 10 (R2 correction 9 HOLD, 2026-11-28)

Owner (Tân), verbatim: "Chấp nhận, đi tiếp". The correction 9 CPU profile at `bded79d` found the same simulation work on base and head (116 clone calls with matching payload digests, 400 NPC rows validated, the same crime, robbery and crisis branches). The Mansion's own added work is about 0.05–0.1 ms per End Week. The rest of the paired shift (+1.4620 ms / +1.7471 ms median, Normal / Easy) sits in shared clone and validation code whose sampled sign flips between runs; no avoidable R2 overhead was found.

1. The owner accepts this measured End Week shift for R2. R-026 records the correction 8 paired result and the correction 9 profile with their numbers and stays open. No threshold changes; the isolated `runMansionWeek` ≤ 0.05 ms rule still binds, and later PRs measure against R2's merged head.
2. R2 proceeds at `bded79d` (or a later head that changes only evidence): gates 1–7 and `CI=1` smoke at the exact head on a quiet machine, regular push, no PR.
