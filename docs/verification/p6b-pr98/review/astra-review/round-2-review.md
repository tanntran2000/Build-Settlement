# PR 98 round 2 review

Verdict: FAIL on the explicitly requested shared-operation-logic criterion. Original F1 runtime scenarios are corrected. No normal-state forecast mismatch found in reviewed ordering.
HEAD ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37; tree a164cb535cb914ee19f6e027b97013479c08e786.

P2 R2-1, packages/ui/src/items-view.ts:106: workshopOperation duplicates the operation prelude (tax credit timing, sequential funding with Farm debits, Herb production bonuses and Hospital allocation) from tile-trial-week.ts rather than calling shared pure operation logic. Shared constants and scalar tax/law/skill functions do not share this allocation algorithm. This fails check 1's explicit reuse requirement. The copy currently agrees for ordinary valid arithmetic; no claim is made that the demonstrated original scenario still fails. Future changes can diverge. Its unbounded BigInt accumulation also omits the simulation's safe-integer overflow rejection, although no runtime reproduction was performed. Resolve reuse within authorized scope or obtain an explicit acceptance adjustment for the copied projection; do not silently expand core/simulation scope.

Reviewed four complete individual diffs. Funding follows state.tiles order; insufficient funding leaves Gold for subsequent tiles; all funded Herb gardens produce before any Hospital consumes, independent of tile position; Hospitals consume in tile order; no-worker Drug Store gets base one only when funded. D2 recipe placement projection unchanged. Reasons correctly distinguish upkeep and Herbs. Capacity uses posted effective medical/technical skill.

Tests: six dispatcher-parity scenarios queue six orders and compare actual crafted count/idle status with projection, avoiding queue-limited false agreement. E2E asserts zero independently, compares visible forecast, clicks real End Week and verifies report/export. Ring 2 only unlocks the Herb Garden fixture; existing acceptance assertions retained. Competition for Herbs is covered directly; multi-workshop Gold competition is source-reviewed, not an added dispatcher-parity scenario.

Independent verification: whole PR 11 files +732/-12. Restricted edits reconstruct 3/3 exact. 86/86 immutable blobs match base, core/simulation/persistence subtree hashes identical, clean worktree. See round-2-checks.json. Round-1 other PASS conclusions stand within prior limits.

Limits: no tests/builds/install/product execution/repo edits/push/merge. Only authorized review-folder writes. Builder README reports exact-head gates exit 0, 2926 unit and 387 smoke CI=1. CI 43731550275 success supplied by user, not queried. No new live browser audit. This is source and byte inspection, not independently replayed runtime evidence.
