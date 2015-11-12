# cosmiconfig [![Build Status](https://travis-ci.org/davidtheclark/cosmiconfig.svg?branch=master)](https://travis-ci.org/davidtheclark/cosmiconfig)

Find and load config from a package.json property, rc file (JSON or YAML), or CommonJS module.

## Intended API

```js
var comsiconfig = require('cosmiconfig');

comsiconfig('mymodule'[, options]).then(function(result) {
  // result.config is the parsed configuration object
  // result.filepath is the path to the config file that was found
});
```

Looks for `mymodule` properties in `package.json` files, `.mymodulerc`, and `mymodule.config.js`.

Starts from `process.cwd()` (or `options.cwd`), and looks for these files in `./ ../ ../../ ../../../` etc., all the way to the user's home directory, checking first for `mymodule` in `package.json`, second for `.mymodulerc`, third for `mymodule.config.js`. Stops looking when the first of those is found, and uses that one as the config.

All of the filenames are configurable.

Built-in JSON and YAML support.

Option to `allowExtends`, which means `extends` properties will be used to extend the configratuion, in the manner of ESLint and stylelint. The `extends` value is a single string or an array of strings. Each string must be a lookup that `require()` would understand, so either:

- A npm module name
- An absolute path
- A relative path, relative to the config file that is extending

If config A extends config B, the result is config A's properties merged into config B, with config A taking priority.

The whole thing happens asynchronously and returns a Promise.
