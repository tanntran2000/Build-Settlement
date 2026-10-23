import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tsParser from '@typescript-eslint/parser';
import { parseForESLint as parseSvelte } from 'svelte-eslint-parser';

const policy = {
  core: [],
  content: [],
  simulation: ['core'],
  persistence: ['core'],
  ui: ['core', 'content', 'simulation', 'persistence'],
};
const excluded = new Set(['__tests__', 'node_modules', 'dist', 'build', 'coverage', '.git']);
const names = Object.keys(policy);
const slash = value => value.split(path.sep).join('/');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const within = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};
const eligible = name => (name.endsWith('.ts') || name.endsWith('.svelte')) && !/\.(test|spec)\.ts$/.test(name);

function literal(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
}

function dependencies(source, file, reportUnsupportedGenerics) {
  const options = { filePath: file, loc: true, range: true, sourceType: 'module', ecmaVersion: 'latest' };
  const parsed = file.endsWith('.svelte')
    ? parseSvelte(source, { ...options, parser: tsParser, svelteConfig: {} })
    : tsParser.parseForESLint(source, options);
  const result = [];
  function visit(node) {
    let target;
    switch (node.type) {
      case 'ImportDeclaration':
      case 'ExportNamedDeclaration':
      case 'ExportAllDeclaration':
        if (node.source) target = node.source;
        break;
      case 'ImportExpression':
      case 'TSImportType':
        target = node.source;
        break;
      case 'TSExternalModuleReference':
        target = node.expression;
        break;
      case 'CallExpression':
        if (node.callee.type === 'Identifier' && node.callee.name === 'require') target = node.arguments[0] ?? null;
        break;
    }
    if (target !== undefined) result.push({ specifier: literal(target), line: node.loc.start.line, column: node.loc.start.column + 1 });
    for (const key of parsed.visitorKeys[node.type] ?? []) {
      const value = node[key];
      for (const child of Array.isArray(value) ? value : [value]) if (child?.type) visit(child);
    }
  }
  // Only script blocks are dependency-bearing source in a Svelte component.
  if (file.endsWith('.svelte')) {
    for (const element of parsed.ast.body) {
      if (element.type !== 'SvelteScriptElement') continue;
      for (const attribute of element.startTag.attributes) {
        if (attribute.key?.name === 'generics') reportUnsupportedGenerics(attribute.loc.start);
      }
      for (const node of element.body) visit(node);
    }
  } else visit(parsed.ast);
  return result;
}

function cyclesFor(edges) {
  const adjacency = new Map(names.map(name => [name, new Map()]));
  for (const edge of edges) {
    const next = adjacency.get(edge.from);
    if (!next.has(edge.to)) next.set(edge.to, edge);
  }
  const cycles = [];
  // Five fixed packages: enumerate simple cycles, starting at the earliest member.
  for (const start of names) {
    function walk(chain, imports) {
      for (const [next, edge] of adjacency.get(chain.at(-1))) {
        if (next === start) cycles.push({ packages: [...chain, start], imports: [...imports, edge] });
        else if (names.indexOf(next) > names.indexOf(start) && !chain.includes(next)) walk([...chain, next], [...imports, edge]);
      }
    }
    walk([start], []);
  }
  return cycles.sort((a, b) => compare(a.packages.join(' -> '), b.packages.join(' -> ')));
}

export function checkArchitecture(root) {
  root = path.resolve(root);
  const errors = [];
  const edges = [];
  const files = [];
  const counts = Object.fromEntries(names.map(name => [name, 0]));
  const packages = names.map(name => ({ name, dir: path.join(root, 'packages', name), src: path.join(root, 'packages', name, 'src') }));
  const display = file => slash(path.relative(root, file)) || '.';
  const error = (code, file, message, location = {}) => errors.push({ code, file: display(file), ...location, message });
  const readError = (file, cause) => error('READ_ERROR', file, `${cause.code ?? cause.name}: ${cause.message}`);
  const ownerOf = file => packages.find(pkg => within(pkg.dir, file));

  function scan(directory, pkg, ancestors = new Set()) {
    try {
      const real = fs.realpathSync(directory);
      if (!within(pkg.src, real)) {
        error('SCOPE_ESCAPE', directory, 'Symlink resolves outside its declared source root');
        return;
      }
      if (ancestors.has(real)) {
        error('SCOPE_ESCAPE', directory, 'Symlink directory loop prevents complete traversal');
        return;
      }
      const nextAncestors = new Set([...ancestors, real]);
      for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => compare(a.name, b.name))) {
        if (excluded.has(entry.name)) continue;
        const file = path.join(directory, entry.name);
        try {
          const actual = fs.realpathSync(file);
          if (!within(pkg.src, actual)) {
            error('SCOPE_ESCAPE', file, 'Symlink resolves outside its declared source root');
            continue;
          }
          const stat = fs.statSync(file);
          if (stat.isDirectory()) scan(file, pkg, nextAncestors);
          else if (stat.isFile() && eligible(entry.name)) {
            files.push(file);
            counts[pkg.name]++;
          }
        } catch (cause) { readError(file, cause); }
      }
    } catch (cause) { readError(directory, cause); }
  }

  for (const pkg of packages) {
    try {
      pkg.manifest = JSON.parse(fs.readFileSync(path.join(pkg.dir, 'package.json'), 'utf8'));
      if (pkg.manifest.name !== `@haven/${pkg.name}`) error('PACKAGE_IDENTITY', path.join(pkg.dir, 'package.json'), `Expected @haven/${pkg.name}, received ${pkg.manifest.name}`);
    } catch (cause) { readError(path.join(pkg.dir, 'package.json'), cause); }
    scan(pkg.src, pkg);
    if (counts[pkg.name] === 0) error('EMPTY_SCOPE', pkg.src, 'Source root has no eligible .ts/.svelte files');
  }

  function resolveFile(base) {
    const candidates = base.endsWith('.js')
      ? [base.slice(0, -3) + '.ts', base.slice(0, -3) + '.d.ts', base]
      : [base, ...['.ts', '.d.ts', '.svelte', '.json', '.js'].map(ext => base + ext), ...['index.ts', 'index.d.ts', 'index.svelte', 'index.js'].map(name => path.join(base, name))];
    for (const candidate of candidates) {
      try {
        if (!fs.statSync(candidate).isFile()) continue;
        const real = fs.realpathSync(candidate);
        const pkg = ownerOf(candidate);
        if (!pkg || !within(pkg.dir, real) || (within(pkg.src, candidate) && !within(pkg.src, real))) {
          error('SCOPE_ESCAPE', candidate, 'Dependency target resolves outside its package/source root');
          return null;
        }
        return real;
      } catch (cause) {
        if (!['ENOENT', 'ENOTDIR'].includes(cause.code)) { readError(candidate, cause); return null; }
      }
    }
    return null;
  }

  function exportTarget(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      for (const key of ['types', 'import', 'default']) {
        const target = exportTarget(value[key]);
        if (target) return target;
      }
    }
    return null;
  }

  files.sort(compare);
  for (const file of files) {
    let source;
    try { source = fs.readFileSync(file, 'utf8'); }
    catch (cause) { readError(file, cause); continue; }
    let references;
    try {
      references = dependencies(source, file, location => error(
        'UNSUPPORTED_SVELTE_GENERICS', file,
        'Svelte script-tag generics attributes are not supported by Scope Clarification 01; dependencies in the attribute cannot be verified',
        { line: location.line, column: location.column + 1 },
      ));
    }
    catch (cause) {
      const line = cause.lineNumber ?? cause.loc?.line ?? cause.start?.line;
      error('PARSE_ERROR', file, cause.message, Number.isInteger(line) ? { line } : {});
      continue;
    }
    for (const reference of references) {
      const { specifier, line, column } = reference;
      if (specifier === null) {
        error('COMPUTED_DEPENDENCY', file, 'Dependency is not a string literal or a template without substitutions', { line, column });
        continue;
      }
      const from = ownerOf(file).name;
      const internal = packages.find(pkg => specifier === `@haven/${pkg.name}` || specifier.startsWith(`@haven/${pkg.name}/`));
      let target;
      let to = internal?.name;
      if (internal) {
        const subpath = specifier.slice(`@haven/${internal.name}`.length).replace(/^\//, '');
        const entry = subpath
          ? exportTarget(internal.manifest?.exports?.[`./${subpath}`])
          : exportTarget(internal.manifest?.exports?.['.'] ?? internal.manifest?.exports) ?? './src/index.ts';
        // Source subpaths may name src explicitly or be relative to src, as in TS tooling.
        const bases = entry ? [path.resolve(internal.dir, entry)] : [path.resolve(internal.dir, subpath), path.resolve(internal.src, subpath)];
        for (const base of bases) {
          if (within(internal.dir, base)) target = resolveFile(base);
          if (target) break;
        }
        if (target && !within(internal.dir, target)) target = null;
      } else if (/^\.{1,2}(?:[\\/]|$)/.test(specifier) || path.isAbsolute(specifier)) {
        target = resolveFile(path.resolve(path.dirname(file), specifier));
        to = target && ownerOf(target)?.name;
      } else continue; // External bare packages have no new dependency policy.
      if (!target) error('UNRESOLVED_DEPENDENCY', file, `Cannot resolve internal/relative dependency ${JSON.stringify(specifier)}`, { line, column });
      if (to && to !== from) edges.push({ from, to, file: display(file), line, column, specifier });
    }
  }
  const order = (a, b) => compare(a.file, b.file) || (a.line ?? 0) - (b.line ?? 0) || (a.column ?? 0) - (b.column ?? 0) || compare(a.code ?? a.to, b.code ?? b.to) || compare(a.message ?? a.specifier, b.message ?? b.specifier);
  edges.sort(order);
  errors.sort(order);
  const violations = edges.filter(edge => !policy[edge.from].includes(edge.to));
  const cycles = cyclesFor(edges);
  return {
    status: errors.length ? 'INCOMPLETE' : violations.length || cycles.length ? 'VIOLATION' : 'PASS',
    files: files.map(display), counts, edges, violations, cycles, errors,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = checkArchitecture(process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url)));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === 'PASS' ? 0 : report.status === 'VIOLATION' ? 1 : 2;
}
