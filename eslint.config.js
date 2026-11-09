/**
 * ESLint config = our STATIC analysis.
 * It reads the code without running it and fails the CI pipeline on:
 *  - common bugs (eslint recommended rules)
 *  - risky security patterns (eslint-plugin-security)
 *  - innerHTML / outerHTML / document.write (our own XSS rule, see security memo)
 */
'use strict';

const js = require('@eslint/js');
const globals = require('globals');
const security = require('eslint-plugin-security');

const noUnsafeHtml = [
  'error',
  { property: 'innerHTML', message: 'Use textContent instead (XSS risk).' },
  { property: 'outerHTML', message: 'Build elements with createElement instead (XSS risk).' },
  { property: 'insertAdjacentHTML', message: 'Build elements with createElement instead (XSS risk).' },
  { object: 'document', property: 'write', message: 'document.write can inject HTML (XSS risk).' },
];

module.exports = [
  { ignores: ['node_modules/**'] },
  js.configs.recommended,
  security.configs.recommended,
  {
    rules: {
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-properties': noUnsafeHtml,
    },
  },
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, module: 'readonly' },
    },
  },
  {
    files: ['server.js', 'eslint.config.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
];
