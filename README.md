# cosmiconfig

[![Build Status](https://img.shields.io/travis/davidtheclark/cosmiconfig/master.svg?label=unix%20build)](https://travis-ci.org/davidtheclark/cosmiconfig) [![Build status](https://img.shields.io/appveyor/ci/davidtheclark/cosmiconfig/master.svg?label=windows%20build)](https://ci.appveyor.com/project/davidtheclark/cosmiconfig/branch/master)

Find and load a configuration object from

- a `package.json` property (anywhere up the directory tree)
- a JSON or YAML "rc file" (anywhere up the directory tree)
- a `.config.js` CommonJS module (anywhere up the directory tree)

For example, if your module's name is "soursocks", cosmiconfig will search out configuration in the following places:

- a `soursocks` property in `package.json` (anywhere up the directory tree)
- a `.soursocksrc` file in JSON or YAML format (anywhere up the directory tree)
- a `soursocks.config.js` file exporting a JS object (anywhere up the directory tree)

cosmiconfig continues to search in these places all the way up the directory tree until it finds acceptable configuration (or hits the home directory).

Additionally, all of these search locations are configurable: you can customize filenames or turn off any location.

You can also look for rc files with extensions, e.g. `.soursocksrc.json` or `.soursocksrc.yaml`.
You may like extensions on your rc files because you'll get syntax highlighting and linting in text editors.

## Installation

```
npm install cosmiconfig
```

Tested in Node 4+.

## Usage

Create a cosmiconfig explorer, then either `search` for or directly `load` a configuration file.

```js
const cosmiconfig = require('cosmiconfig');
// ...
const explorer = cosmiconfig(moduleName);

// Search for a configuration by walking up directories.
// See documentation for search, below.
explorer.search()
  .then((result) => {
    // result.config is the parsed configuration object.
    // result.filepath is the path to the config file that was found.
    // result.isEmpty is true if there was nothing to parse in the config file.
  })
  .catch((error) => {
    // Do something constructive.
  });

// Load a configuration directly when you know where it should be.
// The result object is the same as for search.
// See documentation for load, below.
explorer.load(pathToConfig).then(..);

// You can also search and load synchronously by specifying
// { sync: true } in your options.
const syncExplorer = cosmiconfig(moduleName, { sync: true });
const searchedFor = explorer.search();
const loaded = explorer.load(pathToConfig);
```

## API

### Result

The result object you get from `search` or `load` has the following properties:

- **config:** The parsed configuration object. `undefined` if the file is empty.
- **filepath:** The path to the configuration file that was found.
- **isEmpty:** `true` if the configuration file is empty. This property will not be present if the configuration file is not empty.

### Create an explorer

```js
const explorer = cosmiconfig(moduleName[, cosmiconfigOptions])
```

Creates a cosmiconfig instance ("explorer") configured according to the arguments, and initializes its caches.

#### moduleName

Type: `string`. **Required.**

Your module name. This is used to create the default filenames that cosmiconfig will look for.

#### cosmiconfigOptions

##### packageProp

Type: `string` or `false`.
Default: `'${moduleName}'`.

Name of the property in `package.json` to look for.

If `false`, cosmiconfig will not look in `package.json` files.

##### rc

Type: `string` or `false`.
Default: `.${moduleName}rc`.

Name of the "rc file" to look for, which can be formatted as JSON or YAML.

If `false`, cosmiconfig will not look for an rc file.

If `rcExtensions: true`, the rc file can also have extensions that specify the syntax, e.g. `.${moduleName}rc.json`.
You may like extensions on your rc files because you'll get syntax highlighting and linting in text editors.
Also, with `rcExtensions: true`, you can use JS modules as rc files, e.g. `.${moduleName}rc.js`.

##### js

Type: `string` or `false`.
Default: `${moduleName}.config.js`.

Name of the JS file to look for, which must export the configuration object.

If `false`, cosmiconfig will not look for a JS file.

##### rcStrictJson

Type: `boolean`.
Default: `false`.

If `true`, cosmiconfig will expect rc files to be strict JSON. No YAML permitted, and no sloppy JSON.

By default, rc files are parsed with [js-yaml](https://github.com/nodeca/js-yaml), which is
more permissive with punctuation than standard strict JSON.

##### rcExtensions

Type: `boolean`.
Default: `false`.

If `true`, cosmiconfig will look for rc files with extensions, in addition to rc files without.

This adds a few steps to the search process.
Instead of *just* looking for `.goldengrahamsrc` (no extension), it will also look for the following, in this order:

- `.goldengrahamsrc.json`
- `.goldengrahamsrc.yaml`
- `.goldengrahamsrc.yml`
- `.goldengrahamsrc.js`

##### stopDir

Type: `string`.
Default: Absolute path to your home directory.

Directory where the search will stop.

##### cache

Type: `boolean`.
Default: `true`.

If `false`, no caches will be used.
Read more about ["Caching"](#caching) below.

##### sync

Type: `boolean`.
Default: `false`.

If `true`, cosmiconfig will search and load configurations *synchronously*.
By default, it's asynchronous.

##### transform

Type: `(Result) => Promise<Result> | Result`.

A function that transforms the parsed configuration. Receives the [result] object.

If the option [`sync`] is `false` (default), the function must return a Promise that resolves with the transformed result.
If the option [`sync`] is `true`, the function must be synchronous and return the transformed result.

The reason you might use this option instead of simply applying your transform function some other way is that *the transformed result will be cached*. If your transformation involves additional filesystem I/O or other potentially slow processing, you can use this option to avoid repeating those steps every time a given configuration is searched or loaded.

##### configPath

Type: `string`.

If provided, the explorer's [`load()`] will default to loading a config from this path. Passing a string parameter to [`load()`] will override this option.

##### format

Type: `'json' | 'yaml' | 'js'`

The expected file format for the config when running [`load()`].

If not specified, cosmiconfig will try to infer the format using the extension name (if it has one).
In the event that the file does not have an extension or the extension is unrecognized, cosmiconfig will try to parse it as a JSON, YAML, or JS file.

### explorer.search

```js
explorer.search([searchPath][, searchOptions])
```

Searches for a configuration file. In async mode (default), returns a Promise that resolves a [result] object or with `null`, if no configuration file is found. In [`sync`] mode, returns a [result] object or `null`.

So let's say `const explorer = cosmiconfig('goldengrahams');` — here's how [`search()`] will work:

- Starting from `process.cwd()` (or some other directory defined by the `searchPath` argument to [`search()`]), it looks for configuration objects in three places, in this order:
  1. A `goldengrahams` property in a `package.json` file (or some other property defined by the cosmiconfig option [`packageProp`]);
  2. A `.goldengrahamsrc` file with JSON or YAML syntax (or some other filename defined by the cosmiconfig option [`rc`]);
  3. A `goldengrahams.config.js` JS file exporting the object (or some other filename defined by the cosmiconfig option [`js`]).
- If none of those searches reveal a configuration object, it moves up one directory level and tries again. So the search continues in `./`, `../`, `../../`, `../../../`, etc., checking those three locations in each directory.
- It continues searching until it arrives at your home directory (or some other directory defined by the cosmiconfig option [`stopDir`]).
- If at any point a parseable configuration is found, the [`search()`] Promise resolves with its [result] \(or, in [`sync`] mode, the [result] is returned).
- If no configuration object is found, the [`search()`] Promise resolves with `null` (or, in [`sync`] mode, `null` is returned).
- If a configuration object is found *but is malformed* (causing a parsing error), the [`search()`] Promise rejects and shares that error (so you should `.catch()` it). (Or, in [`sync`] mode, the error is thrown.)

\*\*If you know where your configuration file should be located, you should instead use [`load()`], instead.

#### searchPath

Type: `string`.
Default: `process.cwd()`.

[`search()`] will start its search from this directory.

#### searchOptions

##### ignoreEmpty

Type: `boolean`.
Default: `true`.

By default, `search` ignores empty configuration files and continues searching up the tree. If this option is `false` and an empty configuration file is found, the [result] will include `config: undefined` and `isEmpty: true`.

### explorer.load

```js
explorer.load([loadPath])
```

Loads a configuration file directly. Rejects with an error if the file does not exist or if the file cannot be parsed. Upon success it returns a Promise that resolves with a [result].

In [`sync`] mode, directly returns the [result] or throws an error.

If you have set the `cosmiconfig` option [`configPath`], [`load()`] will look there by default.

```js
explorer.load() // Tries to load cosmiconfigOptions.configPath.
explorer.load('load/this/file.json'); // Tries to load load/this/file.json.
```

### explorer.clearLoadCache

Clears the cache used in [`load()`].

### explorer.clearSearchCache

Clears the cache used in [`search()`].

### explorer.clearCaches

Performs both [`clearLoadCache()`] and [`clearSearchCache()`].

## Caching

As of v2, cosmiconfig uses caching to reduce the need for repetitious reading of the filesystem. Every new cosmiconfig instance (created with `cosmiconfig()`) has its own caches.

To avoid or work around caching, you can do the following:

- Set the `cosmiconfig` option [`cache`] to `false`.
- Use the cache clearing methods documented above.
- Create separate instances of cosmiconfig (separate "explorers").

## Differences from [rc](https://github.com/dominictarr/rc)

[rc](https://github.com/dominictarr/rc) serves its focused purpose well. cosmiconfig differs in a few key ways — making it more useful for some projects, less useful for others:

- Looks for configuration in some different places: in a `package.json` property, an rc file, a `.config.js` file, and rc files with extensions.
- Built-in support for JSON, YAML, and CommonJS formats.
- Stops at the first configuration found, instead of finding all that can be found up the directory tree and merging them automatically.
- Options.
- Asynchronous by default (though can be run synchronously).

## Contributing & Development

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

And please do participate!

[result]: #result

[`sync`]: #sync

[`load()`]: #explorerload

[`search()`]: #explorersearch

[`clearloadcache()`]: #explorerclearloadcache

[`clearsearchcache()`]: #explorerclearsearchcache

[`packageprop`]: #packageprop

[`rc`]: #rc

[`js`]: #js

[`cache`]: #cache

[`stopdir`]: #stopdir

[`configpath`]: #configpath

[`ignoreempty`]: #ignoreempty
