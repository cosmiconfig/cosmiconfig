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
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',

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
