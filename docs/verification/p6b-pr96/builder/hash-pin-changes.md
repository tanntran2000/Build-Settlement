# Hash pins — PR A

Three existing pins match Step 0 exactly; ITEM_CATALOG includes the owner-approved Plan correction 3 naming revision. New pins have no baseline. ITEM_TRIAL and all other existing pins remain unchanged.

| Constant | Before | After | Reason |
|---|---|---|---|
| ITEM_CATALOG | `fa866064967ee36dac69a3b8c5c6090bb2b40b7236c3f104d5a8e89d84e974c6` | `7fdeadb141aba95586555f531e044fcdc8a5eccd2c2766fab94c48714793f96d` | 15 material families, 32 missing wearables, and correction 3 unique Lord's / Retainer's names |
| TRIAL_BUILDINGS | `ecaa53f29be9a8028a9f68923e6c7d5bc9ef4b510692e7cd2bd580415433f54f` | `5f27eec1560b3aef1a61312497eb82be8970a28317e09078f76956ea8ed88219` | Decision 4 Smithy definition appended |
| SOCIETY_BUILDINGS | `2bcf0b8352d2769d4d0da0d3d9039ee1196083445067ae75509efd26c09673f1` | `e23c932be89d5d3fd561d44ac863bed90fc73d27a9795d65d588e813889e2a3b` | Smithy no longer reserved |
| SOCIETY_TRIAL | `d390d44efdd2fba06fd4d8c0812e83837ef25b5d84e19956bb5ff00a0dbcac80` | `49add1753fd6d630e3cf7f4f7395f2bd7b844936086ef0b9f06fb6cb595090e6` | Ruleset 08 to 09; Market pool changes |
| RECIPES | new | `7ccddfc8953ff24d17edf085224ffa8d9937a93080f6021d6379a38e11cc8065` | 47 approved recipes |
| CRAFT_TRIAL | new | `587e7927288b57df15e2ffa68b1f3244b8eba3b92b107c0da40e58fcdad7d6b8` | Exact Decision 3 tuning |

## Correction 3 pin history

ITEM_CATALOG at b0c0b37cb25601b69f03b8844ac8a3f957304d4d: 7d1cc84733e7b5837cb596ea04b558943e8927689f7352fc35ea555e95581635 → 7fdeadb141aba95586555f531e044fcdc8a5eccd2c2766fab94c48714793f96d. Only the 32 newly added name fields change. Owner choice, verbatim: "Lord's / Retainer's prefix (Recommended)". Original Step 0 candidates are preserved; correction3-candidate-items.json and correction3-name-edits.json record the approved new data and effective P4 after-text.
