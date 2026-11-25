// Node 24 no-build source runner adapted from the B3 timing worker.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function connectSource(root, dependencies) {
  const require = createRequire(resolve(dependencies, 'package.json'));
  const ts = require('typescript');
  registerHooks({
    resolve(specifier, context, next) {
      if (specifier.startsWith('@haven/')) {
        return next(pathToFileURL(resolve(root, 'packages', specifier.split('/')[1], 'src/index.ts')).href, context);
      }
      if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts')) {
        const candidate = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
        if (existsSync(candidate)) return next(candidate.href, context);
      }
      return next(specifier, context);
    },
    load(url, context, next) {
      if (url.startsWith('file:') && url.endsWith('.ts')) {
        const { outputText } = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
        });
        return { format: 'module', source: outputText, shortCircuit: true };
      }
      return next(url, context);
    },
  });
  return { require, from: file => import(pathToFileURL(resolve(root, file)).href) };
}

