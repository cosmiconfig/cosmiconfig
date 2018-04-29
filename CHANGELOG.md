# Changelog

## 5.0.0

The API has been completely revamped to increase clarity and enable a very wide range of new usage. **Please read the readme for all the details.**

While the defaults remain just as useful as before — and you can still pass no options at all — now you can also do all kinds of wild and crazy things.

- The `loaders` option allows you specify custom functions to derive config objects from files. Your loader functions could parse ES2015 modules or TypeScript, JSON5, even INI or XML. Whatever suits you.
- The `searchPlaces` option allows you to specify exactly where cosmiconfig looks within each directory it searches.
- The combination of `loaders` and `searchPlaces` means that you should be able to load pretty much any kind of configuration file you want, from wherever you want it to look.

Additionally, the overloaded `load()` function has been split up into several clear and focused functions:

- `search()` now searches up the directory tree, and `load()` loads a configuration file that you don't need to search for.
- The `sync` option has been replaced with separate synchronous functions: `searchSync()` and `loadSync()`.
- `clearFileCache()` and `clearDirectoryCache()` have been renamed to `clearLoadCache()` and `clearSearchPath()` respectively.

More details:

- The default JS loader uses `require`, instead of `require-from-string`. So you could use `require` hooks to control the loading of JS files (e.g. pass them through esm or Babel).
- The options `rc`, `js`, and `rcExtensions` have all been removed. You can accomplish the same and more with `searchPlaces`.
- The option `rcStrictJson` has been removed. To get the same effect, you can specify `noExt: cosmiconfig.loadJson` in your `loaders` object.
- `packageProp` no longer accepts `false`. If you don't want to look in `package.json`, write a `searchPlaces` array that does not include it.
- By default, empty files are ignored by `search()`. The new option `ignoreEmptySearchPlaces` allows you to load them, instead, in case you want to do something with empty files.
- The option `configPath` has been removed. Just pass your filepaths directory to `load()`.

## 4.0.0

- Licensing improvement: updated `parse-json` from `3.0.0` to `4.0.0`(see [sindresorhus/parse-json#12][parse-json-pr-12]).
- Changed: error message format for `JSON` parse errors(see [#101][pr-101]). If you were relying on the format of JSON-parsing error messages, this will be a breaking change for you.
- Changed: set default for `searchPath` as `process.cwd()` in `explorer.load`.

## 3.1.0

- Added: infer format based on filePath

## 3.0.1

- Fixed: memory leak due to bug in `require-from-string`.
- Added: for JSON files, append position to end of error message.

## 3.0.0

- Removed: support for loading config path using the `--config` flag. cosmiconfig will not parse command line arguments. Your application can parse command line arguments and pass them to cosmiconfig.
- Removed: `argv` config option.
- Removed: support for Node versions &lt; 4.
- Added: `sync` option.
- Fixed: Throw a clear error on getting empty config file.
- Fixed: when a `options.configPath` is `package.json`, return the package prop, not the entire JSON file.

## 2.2.2

- Fixed: `options.configPath` and `--config` flag are respected.

## 2.2.0, 2.2.1

- 2.2.0 included a number of improvements but somehow broke stylelint. The changes were reverted in 2.2.1, to be restored later.

## 2.1.3

- Licensing improvement: switched from `json-parse-helpfulerror` to `parse-json`.

## 2.1.2

- Fixed: bug where an `ENOENT` error would be thrown is `searchPath` referenced a non-existent file.
- Fixed: JSON parsing errors in Node v7.

## 2.1.1

- Fixed: swapped `graceful-fs` for regular `fs`, fixing a garbage collection problem.

## 2.1.0

- Added: Node 0.12 support.

## 2.0.2

- Fixed: Node version specified in `package.json`.

## 2.0.1

- Fixed: no more infinite loop in Windows.

## 2.0.0

- Changed: module now creates cosmiconfig instances with `load` methods (see README).
- Added: caching (enabled by the change above).
- Removed: support for Node versions &lt;4.

## 1.1.0

- Add `rcExtensions` option.

## 1.0.2

- Fix handling of `require()`'s within JS module configs.

## 1.0.1

- Switch Promise implementation to pinkie-promise.

## 1.0.0

- Initial release.

[parse-json-pr-12]: https://github.com/sindresorhus/parse-json/pull/12

[pr-101]: https://github.com/davidtheclark/cosmiconfig/pull/101
