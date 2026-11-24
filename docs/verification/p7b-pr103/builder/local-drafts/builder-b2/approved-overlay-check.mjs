import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const root = process.cwd();
const packet = process.argv[2];
const require = createRequire(path.join(root, 'package.json'));
const ts = require('typescript');
let failure = false;
const sources = JSON.parse(fs.readFileSync(path.join(packet, 'source-replacements.json'), 'utf8')).files;
const generated = JSON.parse(fs.readFileSync(path.join(packet, 'generated-byte-proposals.json'), 'utf8')).files;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const canonical = (name) => path.resolve(root, name).toLowerCase();
const split = (text) => text.match(/[^\r\n]*(?:\r\n|\n|$)/g).filter(Boolean);

function buildOverlay(stage) {
  const files = new Map();
  for (const f of sources) {
    const baseline = execFileSync('git', ['show', `HEAD:${f.path}`], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    if (stage === 'final') {
      if (sha(baseline) !== f.before.sha256) throw new Error('B1 blob mismatch: ' + f.path);
    }
    const lines = split(baseline);
    let selected = f.replacements;
    if (stage !== 'final') {
      selected = selected.filter(h => {
        if (f.path === 'packages/core/src/data/validate.ts') return [8, 988].includes(h.startLine);
        if (f.path === 'packages/core/src/index.ts') return h.startLine === 15;
        if (f.path === 'packages/core/src/world/npc.ts') return h.startLine === 14;
        return stage === 'b2.1-with-gold' && f.path === 'packages/core/src/data/tuning.json' && h.startLine === 539;
      });
    }
    if (!selected.length) continue;
    for (const h of [...selected].sort((a, b) => b.startLine - a.startLine || b.endLine - a.endLine)) {
      if (lines.slice(h.startLine - 1, h.endLine).join('') !== h.before) throw new Error('hunk before mismatch: ' + f.path);
      lines.splice(h.startLine - 1, h.endLine - h.startLine + 1, h.after);
    }
    const text = lines.join('');
    if (stage === 'final' && sha(text) !== f.after.sha256) throw new Error('proposed hash mismatch: ' + f.path);
    files.set(canonical(f.path), { name: f.path, text: f.operation === 'delete' ? null : text });
  }
  for (const g of generated) {
    if (stage !== 'final' && !/world\/npc-(generator|household|price)\.ts$|npc-generator\.json$/.test(g.path)) continue;
    if (sha(g.after) !== g.afterSha256) throw new Error('generated hash mismatch: ' + g.path);
    const text = g.path.endsWith('npc-generator.json') ? g.after.replace('"Briala"', '"Veylathenne"') : g.after;
    files.set(canonical(g.path), { name: g.path, text });
  }
  return files;
}

function diagnose(stage, files) {
  const main = 'packages/core/tsconfig.json';
  const config = ts.readConfigFile(main, ts.sys.readFile).config;
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, path.resolve(path.dirname(main)), { noEmit: true });
  const host = ts.createCompilerHost(parsed.options);
  const overrides = (file) => files.get(canonical(file));
  const read = host.readFile.bind(host);
  const exists = host.fileExists.bind(host);
  host.readFile = (file) => overrides(file) ? overrides(file).text ?? undefined : read(file);
  host.fileExists = (file) => overrides(file) ? overrides(file).text !== null : exists(file);
  const existingDirectories = host.directoryExists.bind(host);
  const virtualDirectories = new Set([...files].filter(([, entry]) => entry.text !== null).map(([name]) => path.dirname(name)));
  host.directoryExists = (directory) => virtualDirectories.has(canonical(directory)) || existingDirectories(directory);
  const filesUnderCore = [...files.values()].filter(f => f.text !== null && f.name.startsWith('packages/core/src/') && f.name.endsWith('.ts')).map(f => path.resolve(f.name));
  const roots = stage === 'final'
    ? [...new Set([...parsed.fileNames, ...filesUnderCore])].filter(f => host.fileExists(f))
    : [path.resolve('packages/core/src/index.ts')];
  const program = ts.createProgram(roots, parsed.options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  console.log(`\n${stage}: ${diagnostics.length} TypeScript diagnostics`);
  if (diagnostics.length) failure = true;
  for (const diagnostic of diagnostics) {
    const loc = diagnostic.file && diagnostic.start !== undefined ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : undefined;
    const file = diagnostic.file ? path.relative(root, diagnostic.file.fileName).replaceAll('\\', '/') : '';
    console.log(`${file}${loc ? ':' + (loc.line + 1) : ''} TS${diagnostic.code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
  }
}
for (const stage of ['b2.1-exact', 'b2.1-with-gold', 'final']) {
  const files = buildOverlay(stage);
  const tuning = JSON.parse(files.get(canonical('packages/core/src/data/tuning.json'))?.text ?? fs.readFileSync('packages/core/src/data/tuning.json','utf8'));
  const data = JSON.parse(files.get(canonical('packages/core/src/data/npc-generator.json')).text);
  console.log(`${stage}: validator expected opening Gold ${tuning.GOODS_STOCK_TRIAL.initialGoldMilli}; generator data ${data.P7B_TRIAL.startGoldMilli}`);
  diagnose(stage, files);
  if (stage === 'final') {
    const { ESLint } = require('eslint');
    const lint = new ESLint({ cwd: root });
    const candidateFiles = [...files.values()].filter(f => f.text && /\.(?:ts|svelte)$/.test(f.name));
    let count = 0;
    for (const f of candidateFiles) {
      const [result] = await lint.lintText(f.text, { filePath: f.name });
      for (const message of result?.messages ?? []) {
        if (message.severity > 0) {
          count++;
          console.log(`LINT ${f.name}:${message.line} ${message.ruleId ?? ''} ${message.message}`);
        }
      }
    }
    console.log(`Lint diagnostics: ${count}`);
    if (count > 0) failure = true;
  }
}

if (failure) process.exitCode = 1;

