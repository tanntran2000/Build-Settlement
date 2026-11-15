import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const base = '0de2d1ffa91abadf76ced9696f440a09bf19f8af';
const source = path => execFileSync('git', ['show', `${base}:${path}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const line = (path, number) => source(path).split('\n')[number - 1].replace(/\r$/, '');
const testPath = 'packages/core/src/world/__tests__/npc.test.ts';
const societyPath = 'packages/core/src/trial/society.ts';
const before = line(testPath, 30);
const societyBefore = line(societyPath, 66);
const oldKeys = "['nextItemId','inventory','consumables','materials','storage','equipped','market','goals']";
const newKeys = "['nextItemId','inventory','consumables','materials','storage','equipped','market','goals','workshops']";
const proposal = {
  base, status: 'PROPOSED ONLY — owner Step 0 answer required; no product or test edits applied',
  idNamespace: 'PR B only; PR A P1–P59 are historical and are not reopened.',
  existingTestEdits: [{ id: 'P1', path: testPath, line: 30, before,
    after: before.replace("'military-barracks']);", "'military-barracks', 'smithy', 'hospital', 'drug-store']);"),
    reason: 'Decision 5 appends the three supported NPC workshop posts. Keep exact equality, order, and all other bytes.' }],
  outsideAllowlistEdits: [{ id: 'X1', path: societyPath, line: 66, before: societyBefore,
    after: `    return (hasWeeklyKeys(raw.items,${oldKeys}) || hasWeeklyKeys(raw.items,${newKeys})) &&`,
    reason: 'The parent validator otherwise rejects every nonempty optional workshops state before isItemsState can validate it. Only this line changes; isItemsState still checks the exact canonical shape and contents.' }],
  additionalTaskFiles: [{ path: 'packages/simulation/src/tile-trial.ts', task: 'B1',
    reason: 'Already explicitly permitted by PR B allowlist lines 104–105, but absent from B1 Files line 166. Put WORKSHOP_BUSY in the shared REPLACE path so direct tile, NPC-world and Character Life callers all receive the refusal.' }],
  allowedProductFiles: [
    'packages/core/src/trial/items.ts', 'packages/core/src/trial/types.ts', 'packages/core/src/world/npc-content.ts',
    'packages/simulation/src/item-command.ts', 'packages/simulation/src/character-life-command.ts',
    'packages/simulation/src/tile-trial.ts', 'packages/simulation/src/craft-week.ts',
    'packages/simulation/src/tile-trial-week.ts', 'packages/persistence/src/session-records.ts',
  ],
  newTestFiles: [
    'packages/simulation/src/__tests__/craft-command.test.ts',
    'packages/simulation/src/__tests__/craft-week.test.ts',
    'packages/persistence/src/__tests__/craft-records.test.ts',
  ],
  resolutions: [
    { id: 'D1', issue: 'Report fields versus no-order byte identity', references: ['plan:93', 'PR B brief: no orders => every existing golden, fixture and 60-week report hash unchanged'],
      proposed: "Add crafted?: {tileId:string;recipeId:string;output:string;place:'inventory'|'consumables'|'materials'|'storage'|'ready'}[] and workshopsIdle?: string[] as optional last fields of ItemWeekReport; output is the recipe output definition id. Omit each field when its array is empty. A never-used workshop produces no new report keys. Do not add empty arrays to old reports or change the visible parser in PR B.",
      reason: 'Unconditional empty arrays would change report JSON and require edits to synthetic reports and the visible parser; it would conflict with the byte-identity requirement.' },
    { id: 'D2', issue: 'Placement operating wording versus exact NO_WORKSHOP definition', references: ['spec:89', 'plan:87', 'PR B brief B1/Decision 8'],
      proposed: 'Follow the specific Decision 8 contract: placement requires a built, enabled building permitted by the recipe. Staffing, Hospital Herbs and actual paid upkeep determine completion at End Week, not whether the player can queue the order. Do not introduce another placement error or refusal.',
      reason: 'Spec says operating at placement, while Decision 8 and the current brief define the check as built and enabled.' },
    { id: 'D3', issue: 'Zero workers versus adding NPC skill bonuses', references: ['spec:96', 'spec:161', 'plan:92', 'plan:187'],
      proposed: 'Smithy and Hospital with zero workers complete zero orders even with a posted NPC at effective skill 80 or 100. Apply skill bonuses only after the workshop can operate; Drug Store retains worker-free base 1. Hospital must also satisfy the existing fully staffed and supplied operating rule.',
      reason: 'The bare workers-plus-bonus formula could otherwise complete two orders at zero workers, contrary to the explicit spec and B2 RED requirement. Existing operatingIds includes funded partially staffed Hospitals, so set membership alone is insufficient.' },
    { id: 'D4', issue: 'Material output when its stack is full', references: ['spec:117', 'plan:81', 'plan:92', 'packages/core/src/trial/items.ts:38'],
      proposed: 'Material output goes to its stack if below 999; otherwise it becomes ready {material,count} directly. Existing temporary storage continues to hold item instances only. Wearables and potions use their respective inventory, then existing item storage, then ready; ready delivery follows the same destination rules and never allocates another id.',
      reason: 'Spec expressly says a 999 stack waits. P6-A storage has no material representation, while the approved ready union does. No storage schema or P6-A cap is expanded.' },
  ],
  immutableChanges: [], hashPinChanges: [], existingFixtureChanges: [], existingHelperChanges: [],
};
if (proposal.existingTestEdits[0].before === proposal.existingTestEdits[0].after || !societyBefore.includes(oldKeys)) throw Error('Stale proposal anchors');
writeFileSync(join(root, 'step0-proposed-edits.json'), `${JSON.stringify(proposal, null, 2)}\n`, 'utf8');
const code = value => `\`\`\`ts\n${value}\n\`\`\``;
writeFileSync(join(root, 'step0-proposed-edits.md'), `# PR B Step 0 — exact proposed edits (pending owner approval)

Base: ${base}. IDs are scoped to PR B; PR A P1–P59 stay unchanged.
No existing test or product file has been edited. The entire existing-test inventory is **one edit in one file**.

## P1 — ${testPath}:30

Reason: ${proposal.existingTestEdits[0].reason}

Before:

${code(before)}

After:

${code(proposal.existingTestEdits[0].after)}

Nothing else in this test file changes; the assertion stays exact equality.

## X1 — outside PR B allowlist: ${societyPath}:66

Reason: ${proposal.outsideAllowlistEdits[0].reason}

Before:

${code(societyBefore)}

After:

${code(proposal.outsideAllowlistEdits[0].after)}

This is a product validator compatibility edit, not an existing-test edit. Rejecting extra keys and validating workshop contents remain delegated to the existing strict isItemsState path on line 67.

## B1 task Files line addition

${proposal.additionalTaskFiles[0].path}: ${proposal.additionalTaskFiles[0].reason}

No other file outside the PR B allowlist is requested. Core already re-exports trial/items.ts and trial/types.ts. craft-week.ts can be imported internally and by its direct-file unit test; no public simulation index change is needed. Routing already reads ITEM_COMMAND_TYPES, so character-life-command.ts may need no change.

## Contract resolutions submitted with the Step 0 HOLD

${proposal.resolutions.map(r => `### ${r.id} — ${r.issue}\n\nReferences: ${r.references.join('; ')}.\n\nProposed: ${r.proposed}\n\nWhy: ${r.reason}`).join('\n\n')}

## Zero-change sets

Existing e2e/helper edits: 0. Existing fixture/golden edits: 0. Hash-pin edits: 0. Other existing-test edits: 0. New timeout or threshold changes: 0.

Expected golden/fixture path diff: [] (including the stored session JSON inside catalog-golden.json). Do not regenerate them in PR B. If a runtime comparison changes any byte, HOLD with its path diff.

## Verification

Run from the assigned worktree:

\`node C:/Users/Admin/.t3/local-drafts/p6b-prB/verify-edit-inventory.mjs --mode preflight\`

After owner approval and implementation, at a clean committed final head:

\`node C:/Users/Admin/.t3/local-drafts/p6b-prB/verify-edit-inventory.mjs --mode final --approval C:/Users/Admin/.t3/local-drafts/p6b-prB/owner-approval.json\`

Final mode requires a separate owner-approval.json recording status approved, base, owner Tân, verbatim quote, and proposalSha256 of step0-proposed-edits.json. No approval is recorded yet. The verifier checks every existing test byte, exact P1/X1 transformations, the product/new-test allowlist, and immutable files versus the exact base. It does not substitute for RED/GREEN or gates.
`, 'utf8');
const pinFiles = ['packages/core/src/__tests__/catalog-data.test.ts', 'packages/core/src/__tests__/recipes-catalog.test.ts', 'packages/simulation/src/__tests__/items-week.test.ts'];
const pinRows = pinFiles.flatMap(path => source(path).split('\n').flatMap((value, index) => [...value.matchAll(/[a-f0-9]{64}/g)].map(match => ({path, line:index+1, hash:match[0]}))));
writeFileSync(join(root, 'hash-pin-changes.md'), `# PR B hash pins — zero changes proposed\n\nBase: ${base}. Every old hash remains the new hash. The whole source file of each pin is also protected by immutable-baseline.json.\n\n| File:line | Old SHA-256 → New SHA-256 | Reason |\n|---|---|---|\n${pinRows.map(r => `| ${r.path}:${r.line} | ${r.hash} → ${r.hash} | No catalog/tuning or no-order simulation change authorized. |`).join('\n')}\n\nThere are ${pinRows.length} existing literal pins: 18 catalog/tuning, 3 recipe/original-item, and 3 sixty-week crime/crisis/order/law report pins. The sixty-week reports in items-week.test.ts:140–148 deliberately hash only those four subsystems, not items. After Step 0 approval, capture additional no-order full item/report baselines from untouched 0de2d1f before product edits and assert them in the new craft-week.test.ts. Do not rewrite these existing pins to accept a drift.\n`, 'utf8');
console.log(`Wrote proposal: ${proposal.existingTestEdits.length} test edit, ${proposal.outsideAllowlistEdits.length} outside-allowlist line, ${proposal.resolutions.length} explicit contract resolutions; ${pinRows.length} unchanged literal pins.`);
