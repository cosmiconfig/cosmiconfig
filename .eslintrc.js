{
  "parser": "babel-eslint",
  "parserOptions": {
    "sourceType": "script"
  },
  "extends": [
    "eslint-config-davidtheclark-node",
    "plugin:jest/recommended",
    "prettier"
  ],
  "plugins": ["jest", "flowtype"],
  "rules": {
    "no-var": "off",
    "prefer-const": "off",
    "prefer-arrow-callback": "off",
    "node/no-unsupported-features": ["error", { "version": "8.9" }], // first LTS 8 release
    "func-names": ["error", "always"],
    "prefer-template": "error",
    "object-shorthand": [
      "error",
      "always",
      { "avoidExplicitReturnArrows": true }
    ],
    "flowtype/define-flow-type": "error",

    "jest/consistent-test-it": ["error", { "fn": "test" }],
    "jest/no-empty-title": "error",
    "jest/no-test-callback": "error",
    "jest/prefer-todo": "error"
  }
}
