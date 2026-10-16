import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/.git/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.js', '**/*.mjs'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-debugger': 'error',
      'no-dupe-args': 'error',
      'no-unsafe-finally': 'error',
      'no-unreachable': 'error',
      'constructor-super': 'error',
      'valid-typeof': 'error',
    },
  },
  ...sveltePlugin.configs['flat/base'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      'no-debugger': 'error',
      'no-dupe-args': 'error',
      'no-unsafe-finally': 'error',
      'no-unreachable': 'error',
      'constructor-super': 'error',
      'valid-typeof': 'error',
    },
  },
];
