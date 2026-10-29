import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'docs/**',
      '.claude/**',
      '.playwright-cli/**',
      'node_modules/**',
      '*.cjs',
      'log.js',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Clean Architecture dependency rule (docs/adr/0001): inner layers never import outer ones.
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['phaser', 'react', 'react-dom', '**/application/**', '**/infrastructure/**'],
          message: 'domain/ must not import frameworks or outer layers (ADR 0001).',
        }],
      }],
      'no-restricted-globals': ['error',
        { name: 'window', message: 'domain/ must not touch the browser.' },
        { name: 'document', message: 'domain/ must not touch the browser.' },
        { name: 'localStorage', message: 'domain/ must not touch the browser; use a port.' },
        { name: 'sessionStorage', message: 'domain/ must not touch the browser; use a port.' },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['phaser', 'react', 'react-dom', '**/infrastructure/**'],
          message: 'application/ must not import frameworks or infrastructure (ADR 0001).',
        }],
      }],
      'no-restricted-globals': ['error',
        { name: 'window', message: 'application/ must not touch the browser.' },
        { name: 'document', message: 'application/ must not touch the browser.' },
        { name: 'localStorage', message: 'application/ must not touch the browser; use a port.' },
        { name: 'sessionStorage', message: 'application/ must not touch the browser; use a port.' },
      ],
    },
  },
);
