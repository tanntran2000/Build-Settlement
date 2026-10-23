import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { checkArchitecture } from './check-architecture.mjs';

const packages = ['core', 'content', 'simulation', 'persistence', 'ui'];
const cli = fileURLToPath(new URL('./check-architecture.mjs', import.meta.url));
const scratch = fileURLToPath(new URL('../test-results/', import.meta.url));

function fixture(t) {
  fs.mkdirSync(scratch, { recursive: true });
  const root = fs.mkdtempSync(path.join(scratch, 'architecture-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, source) => {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source);
  };
  for (const name of packages) {
    write(`packages/${name}/package.json`, JSON.stringify({
      name: `@haven/${name}`, exports: { '.': './src/index.ts' },
    }));
    write(`packages/${name}/src/index.ts`, 'export interface Value {}\n');
  }
  return { root, write, scan: () => checkArchitecture(root) };
}

const syntaxes = [
  ['static multiline', p => `import {\n Value\n} from '${p}';`],
  ['side effect', p => `import '${p}';`],
  ['default import', p => `import value from '${p}';`],
  ['namespace import', p => `import * as value from '${p}';`],
  ['type import', p => `import type { Value } from '${p}';`],
  ['inline type import', p => `import { type Value } from '${p}';`],
  ['named re-export', p => `export { Value } from '${p}';`],
  ['star re-export', p => `export * from '${p}';`],
  ['namespace re-export', p => `export * as values from '${p}';`],
  ['type re-export', p => `export type { Value } from '${p}';`],
  ['type star re-export', p => `export type * from '${p}';`],
  ['dynamic import', p => `const value = import('${p}');`],
  ['template dynamic import', p => 'const value = import(`' + p + '`);'],
  ['import type expression', p => `type Value = import('${p}').Value;`],
  ['typeof import expression', p => `type Value = typeof import('${p}');`],
  ['import equals require', p => `import value = require('${p}');`],
  ['literal require', p => `const value = require('${p}');`],
  ['template require', p => 'const value = require(`' + p + '`);'],
];

for (const [name, source] of syntaxes) {
  for (const [owner, status] of [['simulation', 'PASS'], ['content', 'VIOLATION']]) {
    test(`${name}: ${owner} -> core is ${status}`, t => {
      const f = fixture(t);
      f.write(`packages/${owner}/src/index.ts`, source('@haven/core'));
      const report = f.scan();
      assert.equal(report.status, status);
      assert.equal(report.errors.length, 0);
      assert.equal(report.edges.length, 1);
      assert.equal(report.edges[0].line, 1);
      assert.equal(report.edges[0].from, owner);
      assert.equal(report.edges[0].to, 'core');
      assert.equal(report.violations.length, status === 'PASS' ? 0 : 1);
    });
  }
}

test('the complete approved matrix, including type-only edges', t => {
  const f = fixture(t);
  const allowed = { core: [], content: [], simulation: ['core'], persistence: ['core'], ui: ['core', 'content', 'simulation', 'persistence'] };
  for (const owner of packages) {
    for (const target of packages.filter(p => p !== owner)) {
      f.write(`packages/${owner}/src/index.ts`, `import type { Value } from '@haven/${target}';`);
      const r = f.scan();
      assert.equal(r.status, allowed[owner].includes(target) ? 'PASS' : 'VIOLATION', `${owner} -> ${target}`);
      f.write(`packages/${owner}/src/index.ts`, 'export interface Value {}');
    }
  }
});

test('normalized relative paths, index resolution, declarations and .js -> .ts', t => {
  const f = fixture(t);
  f.write('packages/simulation/src/nested/use.ts', "import '../../../core/src/../src/index.js';");
  f.write('packages/ui/src/types.d.ts', "export type { Value } from '../../core/src';");
  f.write('packages/content/src/index.ts', "export * from '../../simulation/src/nested/../index.js';");
  const r = f.scan();
  assert.equal(r.status, 'VIOLATION');
  assert.equal(r.errors.length, 0);
  assert.equal(r.edges.length, 3);
  assert.equal(r.violations[0].file, 'packages/content/src/index.ts');
  assert.ok(r.files.includes('packages/ui/src/types.d.ts'));
});

test('exact package identities, subpaths, escapes and external lookalikes', t => {
  const f = fixture(t);
  f.write('packages/core/src/detail.ts', 'export const value = 1;');
  f.write('packages/simulation/src/index.ts', "import '@haven/core/src/detail.js'; import '@haven/core/detail'; import '@haven/core-extra'; import '@haven/corex/sub'; import '@haven/unknown'; import 'external';");
  let r = f.scan();
  assert.equal(r.status, 'PASS');
  assert.equal(r.edges.length, 2);
  f.write('packages/content/src/index.ts', String.raw`import '@haven/\u0063ore';`);
  r = f.scan();
  assert.equal(r.status, 'VIOLATION');
  assert.equal(r.violations[0].to, 'core');
});

test('comments, regex, plain strings, template text and Svelte markup create no edges', t => {
  const f = fixture(t);
  f.write('packages/core/src/index.ts', [
    '// import "@haven/ui";', '/* export * from "@haven/content"; */',
    `const a = 'import("@haven/ui")';`, 'const b = `require("@haven/ui")`;',
    'const c = /import\\("@haven\\/ui"\\)/;',
  ].join('\n'));
  f.write('packages/ui/src/Plain.svelte', '<!-- <script>import "missing";</script> --><p>import("./missing")</p>');
  const r = f.scan();
  assert.equal(r.status, 'PASS');
  assert.deepEqual(r.edges, []);
});

test('Svelte module and instance scripts retain actual source lines', t => {
  const f = fixture(t);
  f.write('packages/content/src/Widget.svelte', [
    '<!-- leading line -->', '<script context="module" lang="ts">',
    " import type { Value } from '@haven/core';", '</script>',
    '<script lang="ts">', " const value = import('@haven/simulation');", '</script>', '<p>text</p>',
  ].join('\n'));
  const r = f.scan();
  assert.equal(r.status, 'VIOLATION');
  assert.equal(r.errors.length, 0);
  assert.deepEqual(r.edges.map(e => e.line), [3, 6]);
});

test('every dependency syntax is scanned in Svelte scripts', t => {
  const f = fixture(t);
  for (const [name, source] of syntaxes) {
    f.write('packages/content/src/Widget.svelte', `<script lang="ts">\n${source('@haven/core')}\n</script>`);
    const r = f.scan();
    assert.equal(r.status, 'VIOLATION', name);
    assert.equal(r.errors.length, 0, name);
    assert.equal(r.edges.length, 1, name);
    assert.equal(r.edges[0].line, 2, name);
  }
});

for (const context of ['', 'module ', 'context="module" ']) {
  for (const attribute of ['generics="T"', 'generics="T extends import(\'@haven/simulation\').Value"', 'generics=""', 'generics', 'generics="not valid TypeScript"']) {
    test(`scope01: unsupported script ${context}${attribute} is explicitly INCOMPLETE`, t => {
      const f = fixture(t);
      const file = 'packages/content/src/Generic.svelte';
      f.write(file, `<!-- leading line -->\n<script ${context}lang="ts"\n  ${attribute}>\n</script>`);
      const r = f.scan();
      assert.equal(r.status, 'INCOMPLETE');
      assert.equal(r.errors.length, 1);
      assert.equal(r.errors[0].code, 'UNSUPPORTED_SVELTE_GENERICS');
      assert.equal(r.errors[0].file, file);
      assert.equal(r.errors[0].line, 3);
      assert.match(r.errors[0].message, /generics.*not supported.*cannot be verified/i);
      assert.deepEqual(r.edges, []);
      assert.deepEqual(r.violations, []);
      assert.deepEqual(r, f.scan());
    });
  }
}

test('scope01: attribute-like comments, script strings, markup and CSS stay excluded', t => {
  const f = fixture(t);
  f.write('packages/content/src/Text.svelte', [
    '<!-- <script lang="ts" generics="T"></script> -->',
    '<script lang="ts" data-generics="T">',
    ' // <script lang="ts" generics="T">',
    ' /* generics="T extends import(\'@haven/simulation\').Value" */',
    ' const text = `generics="T extends import(\'@haven/simulation\').Value"`;',
    '</script>',
    '<div generics="T">&lt;script generics="T"&gt;</div>',
    '<style>div::before { content: \'generics="T"\'; }</style>',
  ].join('\n'));
  const r = f.scan();
  assert.equal(r.status, 'PASS');
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.edges, []);
});

const bodyTypes = [
  "interface Holder<T extends import('@haven/core').Value> { value: T }",
  "type Alias<T = import('@haven/core').Value> = T;",
  "declare function identity<T extends import('@haven/core').Value>(value: T): T;",
  "type Imported = typeof import('@haven/core');",
  "export type { Value } from '@haven/core';",
].join('\n');

for (const [name, extension, wrap] of [
  ['TypeScript', 'ts', body => body],
  ['declarations', 'd.ts', body => body],
  ['Svelte instance body', 'svelte', body => `<script lang="ts">\n${body}\n</script>`],
  ['Svelte module body', 'svelte', body => `<script context="module" lang="ts">\n${body}\n</script>`],
]) {
  for (const [owner, status] of [['ui', 'PASS'], ['content', 'VIOLATION']]) {
    test(`scope01: ${name} generic/type body dependencies retain ${owner} -> core enforcement`, t => {
      const f = fixture(t);
      const file = `packages/${owner}/src/Body.${extension}`;
      f.write(file, wrap(bodyTypes));
      const r = f.scan();
      assert.equal(r.status, status);
      assert.deepEqual(r.errors, []);
      assert.equal(r.edges.length, 5);
      assert.equal(r.violations.length, status === 'PASS' ? 0 : 5);
      assert.ok(r.edges.every(e => e.file === file && e.to === 'core' && e.line >= 1));
    });
  }
}

test('scope01: unsupported attributes preserve proven body edges in both script blocks', t => {
  const f = fixture(t);
  f.write('packages/content/src/Both.svelte', [
    '<script module lang="ts"', '  generics="T">',
    " type Module<T extends import('@haven/core').Value> = T;", '</script>',
    '<script lang="ts"', '  generics="U">',
    " type Instance<U extends import('@haven/core').Value> = U;", '</script>',
  ].join('\n'));
  const r = f.scan();
  assert.equal(r.status, 'INCOMPLETE');
  assert.deepEqual(r.errors.map(e => [e.code, e.line]), [['UNSUPPORTED_SVELTE_GENERICS', 2], ['UNSUPPORTED_SVELTE_GENERICS', 6]]);
  assert.deepEqual(r.violations.map(e => e.line), [3, 7]);
  assert.ok(r.edges.every(e => e.to === 'core'));
});

test('scope01: unsupported generics CLI exits 2 with a located error, not a violation', t => {
  const f = fixture(t);
  f.write('packages/content/src/Generic.svelte', '<script lang="ts"\n generics="T extends import(\'@haven/simulation\').Value">\n</script>');
  const run = () => spawnSync(process.execPath, [cli, f.root], { encoding: 'utf8' });
  const child = run();
  assert.equal(child.status, 2, child.stderr);
  const r = JSON.parse(child.stdout);
  assert.equal(r.status, 'INCOMPLETE');
  assert.equal(r.errors[0].code, 'UNSUPPORTED_SVELTE_GENERICS');
  assert.equal(r.errors[0].line, 2);
  assert.deepEqual(r.violations, []);
  assert.equal(child.stdout, run().stdout);
});

test('scan includes exactly eligible production .ts/.svelte, recursively', t => {
  const f = fixture(t);
  const ignored = ['__tests__', 'node_modules', 'dist', 'build', 'coverage', '.git'];
  for (const dir of ignored) f.write(`packages/core/src/${dir}/bad.ts`, 'import(name);');
  for (const name of ['bad.test.ts', 'bad.spec.ts', 'bad.js', 'bad.tsx', 'bad.svelte.js', 'bad.css']) {
    f.write(`packages/core/src/${name}`, 'import(name);');
  }
  f.write('tools/fixtures/bad.ts', 'import(name);');
  f.write('packages/core/src/deep/good.d.ts', 'export type X = string;');
  f.write('packages/ui/src/deep/Good.svelte', '<p>ok</p>');
  const r = f.scan();
  assert.equal(r.status, 'PASS');
  assert.equal(r.files.length, 7);
  assert.equal(r.counts.core, 2);
  assert.equal(r.counts.ui, 2);
  assert.deepEqual(r.files, [...r.files].sort());
});

for (const source of ['import(name);', 'import(`@haven/${name}`);', "import('@haven/' + name);", 'require(name);', 'require();']) {
  test(`computed dependency cannot pass: ${source}`, t => {
    const f = fixture(t);
    f.write('packages/core/src/index.ts', source);
    const r = f.scan();
    assert.equal(r.status, 'INCOMPLETE');
    assert.ok(r.errors.some(e => e.code === 'COMPUTED_DEPENDENCY' && e.line === 1));
    assert.deepEqual(r.violations, []);
  });
}

for (const source of ["import './missing';", "import '@haven/core/no-such-file';", "import '@haven/core/../../missing';"]) {
  test(`unresolved internal/relative dependency: ${source}`, t => {
    const f = fixture(t);
    f.write('packages/simulation/src/index.ts', source);
    const r = f.scan();
    assert.equal(r.status, 'INCOMPLETE');
    assert.ok(r.errors.some(e => e.code === 'UNRESOLVED_DEPENDENCY' && e.line === 1));
  });
}

test('relative asset imports resolve without expanding the production scan', t => {
  const f = fixture(t);
  f.write('packages/ui/src/index.ts', "import './style.css';");
  f.write('packages/ui/src/style.css', 'body {}');
  assert.equal(f.scan().status, 'PASS');
  assert.equal(f.scan().files.length, 5);
});

for (const [file, source] of [
  ['packages/core/src/index.ts', 'const = ;'],
  ['packages/ui/src/Bad.svelte', '<script lang="ts">const = ;</script>'],
  ['packages/ui/src/Bad.svelte', '<script>import "@haven/core";</script><div>'],
]) {
  test(`parse error is incomplete verification: ${file} ${source}`, t => {
    const f = fixture(t);
    f.write(file, source);
    const r = f.scan();
    assert.equal(r.status, 'INCOMPLETE');
    assert.ok(r.errors.some(e => e.code === 'PARSE_ERROR' && e.file === file && e.line >= 1));
    assert.deepEqual(r.violations, []);
  });
}

test('missing and empty scope fail without fabricated line numbers', t => {
  const f = fixture(t);
  fs.rmSync(path.join(f.root, 'packages/core/src'), { recursive: true });
  fs.unlinkSync(path.join(f.root, 'packages/content/src/index.ts'));
  const r = f.scan();
  assert.equal(r.status, 'INCOMPLETE');
  assert.ok(r.errors.some(e => e.file === 'packages/core/src' && e.code === 'READ_ERROR' && !('line' in e)));
  assert.ok(r.errors.some(e => e.file === 'packages/content/src' && e.code === 'EMPTY_SCOPE' && !('line' in e)));
});

test('a scope containing only excluded files is empty', t => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.root, 'packages/core/src/index.ts'));
  f.write('packages/core/src/only.test.ts', 'export const value = 1;');
  const r = f.scan();
  assert.equal(r.status, 'INCOMPLETE');
  assert.equal(r.counts.core, 0);
  assert.ok(r.errors.some(e => e.code === 'EMPTY_SCOPE'));
});

test('unreadable root and source preserve path/cause without a line', t => {
  const f = fixture(t);
  const read = fs.readFileSync;
  const readdir = fs.readdirSync;
  t.mock.method(fs, 'readFileSync', function (name, ...args) {
    if (name === path.join(f.root, 'packages/core/src/index.ts')) throw Object.assign(new Error('fixture denied'), { code: 'EACCES' });
    return read.call(this, name, ...args);
  });
  t.mock.method(fs, 'readdirSync', function (name, ...args) {
    if (name === path.join(f.root, 'packages/content/src')) throw Object.assign(new Error('fixture root denied'), { code: 'EACCES' });
    return readdir.call(this, name, ...args);
  });
  const r = f.scan();
  assert.equal(r.status, 'INCOMPLETE');
  for (const name of ['packages/core/src/index.ts', 'packages/content/src']) {
    assert.ok(r.errors.some(e => e.file === name && e.code === 'READ_ERROR' && e.message.includes('EACCES') && !('line' in e)));
  }
});

test('manifest failure cannot make internal imports appear external', t => {
  const f = fixture(t);
  f.write('packages/core/package.json', '{');
  f.write('packages/content/src/index.ts', "import '@haven/core';");
  assert.equal(f.scan().status, 'INCOMPLETE');
});

test('two/three package cycles include a witness and every import location', t => {
  const f = fixture(t);
  f.write('packages/core/src/index.ts', "\nimport type { Value } from '@haven/simulation';");
  f.write('packages/simulation/src/index.ts', "\n\nexport type { Value } from '@haven/core';");
  let r = f.scan();
  assert.equal(r.status, 'VIOLATION');
  assert.equal(r.cycles.length, 1);
  assert.deepEqual(r.cycles[0].packages, ['core', 'simulation', 'core']);
  assert.deepEqual(r.cycles[0].imports.map(e => e.line), [2, 3]);
  f.write('packages/simulation/src/index.ts', "import '@haven/persistence';");
  f.write('packages/persistence/src/index.ts', "import '@haven/core';");
  r = f.scan();
  assert.equal(r.status, 'VIOLATION');
  assert.deepEqual(r.cycles[0].packages, ['core', 'simulation', 'persistence', 'core']);
  assert.equal(r.cycles[0].imports.length, 3);
  for (const edge of r.cycles[0].imports) {
    assert.match(edge.file, /^packages\/.*\/src\/index\.ts$/);
    assert.ok(edge.line >= 1);
  }
});

test('within-package file cycles are legal, package DAG has no cycles', t => {
  const f = fixture(t);
  f.write('packages/core/src/index.ts', "export * from './other.js';");
  f.write('packages/core/src/other.ts', "export * from './index.js';");
  f.write('packages/ui/src/index.ts', "import '@haven/simulation'; import '@haven/persistence';");
  f.write('packages/simulation/src/index.ts', "import '@haven/core';");
  f.write('packages/persistence/src/index.ts', "import '@haven/core';");
  const r = f.scan();
  assert.equal(r.status, 'PASS');
  assert.deepEqual(r.cycles, []);
});

test('diagnostics and graph output are stable across scans and creation order', t => {
  const f = fixture(t);
  f.write('packages/core/src/z.ts', "import '@haven/ui';\nimport(name);");
  f.write('packages/core/src/a.ts', "import '@haven/content';");
  const first = f.scan();
  assert.deepEqual(first, f.scan());
  fs.unlinkSync(path.join(f.root, 'packages/core/src/z.ts'));
  f.write('packages/core/src/z.ts', "import '@haven/ui';\nimport(name);");
  assert.deepEqual(first, f.scan());
  assert.deepEqual(first.edges.map(e => e.file), ['packages/core/src/a.ts', 'packages/core/src/z.ts']);
});

test('symlink escape is verification failure, never scanned or followed', t => {
  const f = fixture(t);
  const outside = fixture(t);
  outside.write('marker.ts', 'import(name);');
  fs.symlinkSync(outside.root, path.join(f.root, 'packages/core/src/escape'), process.platform === 'win32' ? 'junction' : 'dir');
  const r = f.scan();
  assert.equal(r.status, 'INCOMPLETE');
  assert.ok(r.errors.some(e => e.code === 'SCOPE_ESCAPE'));
  assert.ok(!r.files.some(file => file.includes('escape/')));
});

test('a source root symlink cannot escape and an internal symlink can be scanned', t => {
  const f = fixture(t);
  const kind = process.platform === 'win32' ? 'junction' : 'dir';
  f.write('packages/core/src/nested/value.ts', 'export const value = 1;');
  fs.symlinkSync(path.join(f.root, 'packages/core/src/nested'), path.join(f.root, 'packages/core/src/alias'), kind);
  assert.equal(f.scan().status, 'PASS');
  const outside = fixture(t);
  fs.rmSync(path.join(f.root, 'packages/content/src'), { recursive: true });
  fs.symlinkSync(path.join(outside.root, 'packages/content/src'), path.join(f.root, 'packages/content/src'), kind);
  const r = f.scan();
  assert.equal(r.status, 'INCOMPLETE');
  assert.ok(r.errors.some(e => e.code === 'SCOPE_ESCAPE' && e.file === 'packages/content/src'));
});

test('inspected TypeScript, Svelte and local config code is never executed', t => {
  const f = fixture(t);
  const poison = 'throw new Error("inspected code executed");';
  f.write('packages/core/src/index.ts', poison);
  f.write('packages/ui/src/Poison.svelte', `<script>${poison}</script><p>ok</p>`);
  f.write('svelte.config.js', poison);
  assert.equal(f.scan().status, 'PASS');
});

test('CLI exit 0/1/2 means PASS/VIOLATION/INCOMPLETE; output is stable JSON', t => {
  const f = fixture(t);
  const run = () => spawnSync(process.execPath, [cli, f.root], { encoding: 'utf8' });
  let child = run();
  assert.equal(child.status, 0, child.stderr);
  assert.equal(JSON.parse(child.stdout).status, 'PASS');
  assert.equal(child.stdout, run().stdout);
  f.write('packages/core/src/index.ts', "import '@haven/ui';");
  child = run();
  assert.equal(child.status, 1, child.stderr);
  assert.equal(JSON.parse(child.stdout).status, 'VIOLATION');
  f.write('packages/core/src/index.ts', 'import(name);');
  child = run();
  assert.equal(child.status, 2, child.stderr);
  assert.equal(JSON.parse(child.stdout).status, 'INCOMPLETE');
  f.write('packages/core/src/index.ts', 'const = ;');
  child = run();
  assert.equal(child.status, 2, child.stderr);
  assert.equal(JSON.parse(child.stdout).errors[0].code, 'PARSE_ERROR');
  fs.rmSync(path.join(f.root, 'packages/core/src'), { recursive: true });
  assert.equal(run().status, 2);
});
