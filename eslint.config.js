import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import boxy from './tools/eslint-plugin-boxy/index.js';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'dev-dist', 'coverage', 'playwright-report', 'src/styles/tokens.ts', 'src/test/oracle/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, boxy },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'boxy/no-dash': 'error',
      'boxy/no-emoji-in-jsx': 'error',
      'boxy/no-raw-color': 'error',
      'boxy/no-version-label': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'yjs', message: 'Only src/data may talk to Yjs. Use a repository.' },
            { name: 'dexie', message: 'Only src/data may talk to Dexie. Use a repository.' },
          ],
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/data/**/*.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['scripts/**/*.mjs', 'tools/**/*.js', '*.config.{js,ts,mjs}', 'e2e/**/*.{ts,mjs}'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
