'use strict';

// first node 8.x LTS release
const supportedNodeVersion = '8.9';

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
    'plugin:jest/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  plugins: ['jest', '@typescript-eslint'],
  rules: {
    'node/no-unsupported-features': 'off',
    'node/no-unsupported-features/es-builtins': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-unsupported-features/node-builtins': 'off',

    'prefer-arrow-callback': 'off',
    'func-names': ['error', 'always'],
    'prefer-template': 'error',
    'object-shorthand': [
      'error',
      'always',
      { avoidExplicitReturnArrows: true },
    ],

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
      tryExtensions: ['.js', '.ts'],
    },
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
