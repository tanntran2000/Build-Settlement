import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = path.dirname(fileURLToPath(import.meta.url));
const base = '2c04321ba342871e6a858110ea2320a8e4df0d5d';
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git(['rev-parse', 'HEAD']) !== base || git(['status', '--porcelain=v1'])) throw Error('Step 0 requires the clean base');
const files = new Map();
const edits = [];
function propose(id, file, before, after, why, task) {
  if (!files.has(file)) {
    const bytes = fs.readFileSync(file);
    files.set(file, { before: bytes.toString('utf8').replace(/\r\n/g, '\n'), sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  const source = files.get(file).before;
  const offset = source.indexOf(before);
  if (offset < 0 || source.indexOf(before, offset + before.length) >= 0) throw Error(`${id}: anchor missing or ambiguous`);
  const line = source.slice(0, offset).split('\n').length;
  edits.push({ id, file, line, task, before, after, why });
}
const boundary = 'tests/e2e/character-life-boundary.spec.ts';
const navigation = 'tests/e2e/character-life-navigation.spec.ts';
const helpers = 'tests/e2e/character-life-navigation.helpers.ts';
function inventory(indent, who) {
  return [
    `${indent}const equipment = panel.getByRole('region', { name: 'Equipment', exact: true });`,
    `${indent}await expect(equipment).toBeVisible();`,
    `${indent}await expect(equipment.locator('[data-item-slot]')).toHaveCount(${who} === 'player' ? 8 : 11);`,
    `${indent}await expect(equipment.locator('[data-item-slot][data-locked="true"]')).toHaveCount(${who} === 'player' ? 0 : 3);`,
    `${indent}await expect(equipment.getByRole('group', { name: 'Inventory filters', exact: true }).getByRole('button')).toHaveText(['All', 'Player', 'NPC', 'This slot', 'Equipment', 'Accessory', 'Outfit']);`,
  ].join('\n');
}
const absent = indent => `${indent}await expect(panel.locator('p')).toHaveText(['Inventory and equipment are not implemented yet.', 'Current clothing is described in Description.']);\n${indent}await expect(panel.locator('button,input,select,ul,ol,[data-slot]')).toHaveCount(0);`;
propose('P1', boundary, absent('  '), inventory('  ', 'c.id'), 'C1 replaces the Inventory placeholder and empty-control surface with the real equipment view. Keep the observation setup and all other profile assertions.', 'C1');
propose('P2', navigation, "test('inventory and player unavailable areas are honest', async ({ page }) => {", "test('inventory shows equipment and player unavailable areas stay honest', async ({ page }) => {", 'Rename the existing test to describe the now implemented Inventory; retain its Player Work and Relations assertions.', 'C1');
propose('P3', navigation, absent('    '), inventory('    ', 'id'), 'C1 implements Inventory for every selected character. Replace the obsolete empty placeholder with exact slot, lock and filter assertions.', 'C1');
propose('P4', navigation, '  const {items: _items,society: _society,luxuryImportedMilli: _luxury,trainingGoldMilli: _training,...expectedBase}=expected.report;', '  const {society: _society,luxuryImportedMilli: _luxury,trainingGoldMilli: _training,...expectedBase}=expected.report;', 'C2 renders items. Include the parsed items field in this existing exact executor-report equality.', 'C2');
propose('P5', navigation, absent('        '), inventory('        ', 'c.id'), 'The F3 profile audit traverses the implemented Inventory. Preserve all disclosure, selection and tab-memory assertions.', 'C1');
const imports = "import { createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,isCharacterLifeSessionState,TRIAL_BUILDINGS,WEEKLY_RESOURCE_KEYS,type CharacterLifeSessionState,type TileTrialReport } from '../../packages/core/src/index.ts';";
propose('P6', helpers, imports, imports.replace('DEFAULT_PLAYER_DRAFT,', 'DEFAULT_PLAYER_DRAFT,ITEM_CATALOG,'), 'The visible report parser resolves item names back to stable catalog ids; no expected report payload is copied.', 'C2');
const marker = '// Read the complete report from rendered text, including the calculation disclosure.';
const parser = fs.readFileSync(path.join(root, 'proposed-read-item-report.ts'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
propose('P7', helpers, marker, `${parser}\n\n${marker}`, 'Add a strict reader of visible item tables and recovery text inside the existing opened letter Details. Preserve row order, null cases, booleans and absent pendingLegendary.', 'C2');
propose('P8', helpers, "export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<Omit<TileTrialReport, 'items'>> {", 'export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<TileTrialReport> {', 'The rendered report now includes items; return the full TileTrialReport type.', 'C2');
propose('P9', helpers, "  const actual: Omit<TileTrialReport, 'items'> = {\n    week: absoluteWeek, before, after,", "  const actual: TileTrialReport = {\n    week: absoluteWeek, before, after,\n    items: await readItemReport(panel),", 'Include the independently parsed visible item report in actual, retaining every existing expected field and equality.', 'C2');
propose('P10', helpers, '  const { items: _items, society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;', '  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;', 'Stop excluding the now rendered items field. The exact toEqual matcher is unchanged; existing separately checked society/luxury/training fields stay as before.', 'C2');
const out = path.join(root, 'proposed-test-files');
fs.mkdirSync(out, { recursive: true });
for (const [file, entry] of files) {
  let candidate = entry.before;
  for (const edit of edits.filter(edit => edit.file === file)) candidate = candidate.replace(edit.before, edit.after);
  const target = path.join(out, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, candidate, 'utf8');
}
fs.writeFileSync(path.join(root, 'step0-proposed-edits.json'), JSON.stringify({ base, files: [...files].map(([file, entry]) => ({ file, sourceSha256: entry.sha256 })), edits }, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'step0-proposed-edits.md'), `# PR C Step 0: exact proposed existing-test edits\n\nBase: ${base}. Proposal only; repository files remain unchanged.\n\n${edits.length} edit blocks in ${files.size} existing test/support files. No other edit is proposed. All line numbers refer to the base.\n\n` + edits.map(edit => `## ${edit.id}: ${edit.file}:${edit.line} (${edit.task})\n\n${edit.why}\n\nBefore:\n\n\x60\x60\x60ts\n${edit.before}\n\x60\x60\x60\n\nAfter:\n\n\x60\x60\x60ts\n${edit.after}\n\x60\x60\x60\n`).join('\n'), 'utf8');
console.log(JSON.stringify({ base, proposedBlocks: edits.length, existingFiles: files.size, edits: edits.map(({ id, file, line, task }) => ({ id, file, line, task })) }, null, 2));
