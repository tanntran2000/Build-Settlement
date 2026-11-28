const { readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const ts = require(require.resolve('typescript', { paths: [process.cwd()] }));
const revision = process.argv[2];
const read = file => revision
  ? execFileSync('git', ['show', revision + ':' + file], { encoding: 'utf8' })
  : readFileSync(file, 'utf8');
const files = [
  'packages/core/src/mansion/__tests__/catalog.test.ts',
  'packages/core/src/mansion/__tests__/shape.test.ts',
  'packages/simulation/src/__tests__/mansion-command.test.ts',
  'packages/persistence/src/__tests__/upgrade-v14.test.ts',
  'packages/ui/src/__tests__/v14-load.test.ts',
  'packages/ui/src/__tests__/mansion-view.test.ts',
  'tests/e2e/mansion-rooms.spec.ts',
];
const partial = new Set(['toMatchObject', 'objectContaining', 'arrayContaining', 'stringContaining', 'stringMatching', 'toContainText', 'toContain', 'toMatch']);
const violations = [];
for (const file of files) {
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      const argument = node.arguments[0];
      const exactError = argument && ts.isNewExpression(argument) && argument.expression.getText(source) === 'Error';
      if (partial.has(name) || (name === 'toThrow' && argument && !exactError)) {
        const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
        violations.push(file + ':' + line + ' ' + node.getText(source));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
console.log('Partial matcher sites in new R1 tests: ' + violations.length);
for (const violation of violations) console.log(violation);
process.exitCode = violations.length ? 1 : 0;
