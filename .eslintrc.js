'use strict';

// first node 8.x LTS release
const supportedNodeVersion = '8.9';
const allExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'];

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint-config-davidtheclark-node',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  plugins: ['jest', '@typescript-eslint', 'import'],
  rules: {
    'no-var': 'off',
    'prefer-const': 'off',
    'prefer-arrow-callback': 'off',
    'func-names': ['error', 'always'],
    'prefer-template': 'error',
    'object-shorthand': [
      'error',
      'always',
      { avoidExplicitReturnArrows: true },
    ],

    /**
     * eslint-plugin-typescript
     */
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowTypedFunctionExpressions: true,
      },
    ],
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/array-type': ['error', 'generic'],

    // requires type information rules
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-unnecessary-qualifier': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    // '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-regexp-exec': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
    '@typescript-eslint/promise-function-async': ['error', { allowAny: true }],
    '@typescript-eslint/require-array-sort-compare': 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
    // '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/unbound-method': 'error',

    /**
     * eslint-plugin-node
     */
    'node/no-unpublished-require': 'off',
    'node/no-unsupported-features': 'off',
    'node/no-unsupported-features/es-builtins': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-unsupported-features/node-builtins': 'off',
    // Redundant with import/no-extraneous-dependencies
    'node/no-extraneous-import': 'off',
    'node/no-extraneous-require': 'off',
    // Redundant with import/no-unresolved
    'node/no-missing-import': 'off',
    'node/no-missing-require': 'off',

    /**
     * eslint-plugin-import
     */
    'import/no-default-export': 'error',
    'import/no-named-export': 'off',
    'import/prefer-default-export': 'off',

    /**
     * eslint-plugin-jest
     */
    'jest/consistent-test-it': ['error', { fn: 'test' }],
    'jest/no-empty-title': 'error',
    'jest/no-test-callback': 'error',
    'jest/prefer-todo': 'error',
  },
  settings: {
    node: {
      convertPath: {
        'src/**/*.{js,ts}': ['^src/(.+?)\\.(js|ts)$', 'dist/$1.js'],
        'src/**/.*.{js,ts}': ['^src/(.+?)\\.(js|ts)$', 'dist/$1.js'],
      },
      tryExtensions: allExtensions,
    },
    'import/resolver': {
      node: {
        extensions: allExtensions,
      },
    },
    'import/extensions': allExtensions,
  },
  overrides: [
    {
      files: ['*.test.{js,ts}', '.*.test.{js,ts}'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['*.js', '.*.js'],
      excludedFiles: ['*/**', '*/.**'],
      parserOptions: {
        sourceType: 'script',
      },
      rules: {
        strict: ['error', 'safe'],

        'node/no-unpublished-require': 'off',
        'node/no-unsupported-features/es-builtins': [
          'error',
          { version: supportedNodeVersion },
        ],
        'node/no-unsupported-features/es-syntax': [
          'error',
          { version: supportedNodeVersion },
        ],
        'node/no-unsupported-features/node-builtins': [
          'error',
          { version: supportedNodeVersion },
        ],
      },
    },
  ],
};
