'use strict';

// first node 8.x LTS release
const supportedNodeVersion = '8.9';

module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
  },
  extends: [
    'eslint-config-davidtheclark-node',
    'plugin:jest/recommended',
    'prettier',
  ],
  plugins: ['jest', 'flowtype'],
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
     * eslint-plugin-flowtype
     */
    'flowtype/define-flow-type': 'error',

    /**
     * eslint-plugin-node
     */
    'node/no-unpublished-require': 'off',
    'node/no-unsupported-features': 'off',
    'node/no-unsupported-features/es-builtins': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-unsupported-features/node-builtins': 'off',

    /**
     * eslint-plugin-jest
     */
    'jest/consistent-test-it': ['error', { fn: 'test' }],
    'jest/no-empty-title': 'error',
    'jest/no-test-callback': 'error',
    'jest/prefer-todo': 'error',
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
