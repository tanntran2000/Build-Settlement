# Correction 14 save replay risk

| Risk | Handling | Remaining limit |
| --- | --- | --- |
| Fully rewritten but legal acquisition history | Planning restore recomputes deterministic lot state from the recorded ordered player actions. Withdraw is a terminal action. An inconsistent price, leader, status or dropout mask is refused. | A rewritten transcript and matching state that together describe a different legal history can still load. The save format has no authentication or external event log. |
| Prior-week departures | The saved NPC id ties the departure to a generated source, week and slot. Restore checks the seeded name, sale eligibility, unique identity and absence from the roster. The current week can additionally prove that a departed recruit consumed a saved offer. | Previous weeks have no retained offer ledger. A generated past identity with a consistent name cannot prove an earlier purchase occurred. |
| R-026 | Five alternating pairs measure End Week separately from checkpoint restore. The dispatcher shares the 50 ms budget across all simulation work. | Main already misses 50 ms at 100 NPCs. The paired measurements establish whether this change adds a repeatable warm cost. |
