# PR C whole-branch author review

Head: `09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f`.
Tree: `0ae12c7f62462fb14090a61c788a998f00a031ca`.
Base: `43fcb9b856c66606230d6d7ba49140ae94cfaa00`.

This is an author self-review. The user explicitly requires no subagents. Claude's Tester work and Astra's independent review remain pending handoff; this document does not claim either verdict.

| Area | Evidence and finding |
|---|---|
| Scope | Two task commits; approved P1–P3/X1–X3 only in the three restricted files. No dependency, configuration, core, simulation, persistence or docs change. Final verifier compares all 86 protected paths and every pre-existing test/helper. |
| Eligibility and capacity | Recipe view uses owned unequipped inventory/consumables, stacks, fee, enabled building and queue cap. It excludes held/storage inputs. Worker/Herbs/upkeep conditions do not block D2 placement. Potential capacity uses effective posted skill including class-applicable gear and correct worker gates; operation is explicitly conditional on End Week. 64 C1 unit cases cover these rules and errors. |
| Commands and atomicity | UI passes exactly one command's fields through the existing revision-checked dispatcher. Cancel uses current queue index. E2e checkpoint comparisons show exact held inputs/Gold and unchanged state on full-inventory cancellation failure. Ready cards have no destructive actions. No state mutation or random call added. |
| Keyboard | Real Tab/Enter Place/Cancel and surviving-button focus tested. Buy/Brew uses roving tabs and Arrow/Home/End handler. Hidden City content stays outside focus traversal when Characters is active. New audit establishes actual keyboard modality before measuring outlines. |
| Presentation | English ledger/parchment copy; item rarity still has frame and label. Common/Rare Smithy hints name the exact material/tier; Epic/Legendary, materials and potions get no Smithy hint. No numeric field added. |
| Reports and parser | Optional tables/summary rows appear only for nonempty new report fields. Legacy row copy and four-row cap retained. Full Details remain. Visible parser independently reads headers/cells and static unique names, without production formatting helpers or hidden state. |
| Measured UI | 16/16 new e2e pass; desktop panels at 1280/1600 and new-panel reflow at 320/375 pass contrast, text size, targets, overflow, clipping and keyboard checks. Five actual 1280px viewport screenshots captured. Initial report-card readability issue was reproduced RED (Destination on 3 lines at both PC widths) and fixed with conditional full-width letters; GREEN confirms one line. |

Design ruling: crafting reports use full-width letters to keep the output ledger readable. The cost is more vertical scrolling; existing non-crafting report layout and letter order stay unchanged.

No unresolved blocking finding or deferred minor. C3 final gates and independent review are separate acceptance work.
