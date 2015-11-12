# cosmiconfig [![Build Status](https://travis-ci.org/davidtheclark/cosmiconfig.svg?branch=master)](https://travis-ci.org/davidtheclark/cosmiconfig)

Find and load a configuration object from a `package.json` property, JSON or YAML "rc file", or `.config.js` CommonJS module.

For example, if your module's name is "soursocks," cosmiconfig will search out configuration in the following places:
- a `soursocks` property in `package.json`;
- a `.soursocksrc` file in JSON or YAML format;
- a `soursocks.config.js` file exporting a JS object.

cosmiconfig continues to search in these places all the way down the file tree until it finds acceptable configuration or hits the home directory. And it does all this asynchronously, so it shouldn't get in your way.

Last but not least: cosmiconfig contains built-in support for `extends` functionality — so your module can provide shareable configs with no extra effort on your part (!).

## API


```js
var cosmiconfig = require('cosmiconfig');

cosmiconfig(yourModuleName[, options])
  .then(function(result) {
    // result.config is the parsed configuration object
    // result.filepath is the path to the config file that was found
  })
  .catch(function(parsingError) {
    // do something constructive
  });
```

The function `cosmiconfig()` searches for configuration objects and returns a Promise;
and that Promise resolves with an object containing the information you're looking for.

So let's say `yourModuleName = 'goldengrahams'` — here's how cosmiconfig will work:

- Starting from `process.cwd()` (or some other directory defined by `options.cwd`), it looks for configuration objects in three places, in this order:
  1. A `goldengrahams` property in a `package.json` file (or some other property defined by `options.packageProp`);
  2. A `.goldengrahamsrc` file with JSON or YAML syntax (or some other filename defined by `options.rcName`);
  3. A `goldengrahams.config.js` JS file exporting the object (or some other filename defined by `options.jsName`).
- If none of those searches reveal a configuration object, it moves down one directory and tries again. So the search continues in `./`, `../`, `../../`, `../../../`, etc., checking those three locations in each directory.
- It continues searching until it arrives at your user directory (or some other directory defined by `options.stopDir`).
- If at any point a parseable configuration is found, the `cosmiconfig()` Promise resolves with its result object.
- If no configuration object is found, the `cosmiconfig()` Promise resolves with `null`.
- If a configuration object is found *but is malformed* (causing a parsing error), the `cosmiconfig()` Promise rejects and shares that error (so you should `.catch()` it).

### cosmiconfig(moduleName[, options])

Returns a promise that resolves with `null` (if no configuration was found) or an object with the following properties:

- **config**: The parsed configuration object that was found.
- **filepath**: The path to the file that housed that configuration object.

#### moduleName

Type: `string`

You module name. This is used to create the filenames that cosmiconfig will look for.

#### Options

##### cwd

Type: `string`
Default: `process.cwd()`

Directory to start the search from.

##### rcName

Type: `string`
Default: `'.[moduleName]rc'`

Name of the "rc file" to look for, which can be formatted as JSON or YAML.

##### jsName

Type: `string`
Default: `'[moduleName].config.js'`

Name of a JS file to look for, which must export the configuration object.

##### stopDir

Type: `string`
Default: Absolute path to your home directory

Path which the search will stop.

##### allowExtends

Type: `Boolean`
Default: `false`

If `true`, allow configuration objects to extend other configuration objects via the `extends` property. See below.

## Extends

If you set `options.allowExtends = true`, configuration objects will be able to explicity extend other configuration objects. This opens the door to shareable configs, in the manner of ESLint and stylelint.

Configurations can contain an `extends` value that is a single string or an array of strings. Each string must be a lookup that `require()` will understand from the context of the that file, so one of the following:

- an npm module name;
- an absolute path;
- a relative path, relative to the configuration file that is contains the `extends`.

When one config extends another, it merges its own properties into the other's. For example, if Config A extends Config B, the result that cosmiconfig returns is Config A's properties merged into Config B (so Config A's take priority).

*You can extend multiple configs, and extended configs can extend other configs.* So if you load Config A, which extends Config B and Config C, and Config C extends Config D — the resultant configuration object be the merging of all, A, B, C, and D. Wowza.

## Differences from [rc](https://github.com/dominictarr/rc)

[rc](https://github.com/dominictarr/rc) serves its focused purpose well. cosmiconfig differs in a few key ways — making it more useful for some projects, less useful for others:

- Looks for configuration in some different places: in a `package.json` property, an rc file, and a `.config.js` file.
- Built-in support for JSON, YAML, and CommonJS formats.
- Stops at the first configuration found, instead of finding all that can be found down the filetree and merging them automatically.
- Provides a few configuration options (e.g. different file name expectations).
- Provides `extends` support.
- Asynchronicity.
