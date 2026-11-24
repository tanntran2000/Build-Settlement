import { createRequire } from 'node:module';
import path from 'node:path';

const root = process.cwd();
const require = createRequire(path.resolve(root, 'package.json'));
const ts = require('typescript');
const oldPath = '../../../core/src/__tests__/helpers/npcs.js';
const newPath = '@haven/core/testing/npcs';
let errors = 0;
for (const name of ['simulation', 'persistence']) {
  const project = path.resolve('packages', name, 'tsconfig.json');
  const config = ts.readConfigFile(project, ts.sys.readFile).config;
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(project), { noEmit: true });
  const host = ts.createCompilerHost(parsed.options);
  const originalRead = host.readFile.bind(host);
  const changes = new Set();
  host.readFile = (file) => {
    const text = originalRead(file);
    if (!text) return text;
    const normalized = file.toLowerCase().replaceAll('\\', '/');
    if (normalized.endsWith('/@haven/core/package.json') || normalized.endsWith('/packages/core/package.json')) {
      const data = JSON.parse(text);
      data.exports['./testing/npcs'] = './src/__tests__/helpers/npcs.ts';
      return JSON.stringify(data);
    }
    if (normalized.includes('/__tests__/') && text.includes(oldPath)) {
      changes.add(path.relative(root, file).replaceAll('\\', '/'));
      return text.replaceAll(oldPath, newPath);
    }
    return text;
  };
  const program = ts.createProgram(parsed.fileNames, parsed.options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  errors += diagnostics.length;
  console.log(JSON.stringify({project:name, revisedTestImports:[...changes].sort(), diagnostics:diagnostics.length}));
  if (diagnostics.length) {
    console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => root, getNewLine: () => '\n', getCanonicalFileName: file => file,
    }));
  }
}
process.exitCode = errors ? 1 : 0;

