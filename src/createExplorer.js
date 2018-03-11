// @flow
'use strict';

const path = require('path');
const loadPackageProp = require('./loadPackageProp');
const loadRc = require('./loadRc');
const loadJs = require('./loadJs');
const loadDefinedFile = require('./loadDefinedFile');
const funcRunner = require('./funcRunner');
const getDirectory = require('./getDirectory');

module.exports = function createExplorer(options: {
  packageProp?: string | false,
  rc?: string | false,
  js?: string | false,
  format?: 'json' | 'yaml' | 'js',
  rcStrictJson?: boolean,
  rcExtensions?: boolean,
  stopDir?: string,
  cache?: boolean,
  sync?: boolean,
  transform?: (?Object) => ?Object,
  configPath?: string,
}) {
  // When `options.sync` is `false` (default),
  // these cache Promises that resolve with results, not the results themselves.
  const loadCache = options.cache ? new Map() : null;
  const searchCache = options.cache ? new Map() : null;
  const transform = options.transform || identity;
  const packageProp = options.packageProp;

  function clearLoadCache() {
    if (loadCache) loadCache.clear();
  }

  function clearSearchCache() {
    if (searchCache) searchCache.clear();
  }

  function clearCaches() {
    clearLoadCache();
    clearSearchCache();
  }

  function throwError(error) {
    if (options.sync) {
      throw error;
    } else {
      return Promise.reject(error);
    }
  }

  function search(
    searchPath: string,
    searchOptions: { ignoreEmpty?: boolean }
  ): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
    const sanitizedOpts = Object.assign(
      {},
      {
        ignoreEmpty: true,
      },
      searchOptions
    );

    if (!searchPath) searchPath = process.cwd();

    const absoluteSearchPath = path.resolve(process.cwd(), searchPath);
    const searchPathDir = getDirectory(absoluteSearchPath, options.sync);

    return searchPathDir instanceof Promise
      ? searchPathDir.then(pathDir => searchDirectory(pathDir, sanitizedOpts))
      : searchDirectory(searchPathDir, sanitizedOpts);
  }

  function searchDirectory(
    directory: string,
    searchOptions: { ignoreEmpty: boolean }
  ): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
    if (searchCache && searchCache.has(directory)) {
      return searchCache.get(directory);
    }

    const result = funcRunner(!options.sync ? Promise.resolve() : undefined, [
      () => {
        if (!packageProp) return;
        return loadPackageProp(directory, {
          packageProp,
          sync: options.sync,
        });
      },
      result => {
        if (result || !options.rc) return result;
        return loadRc(path.join(directory, options.rc), {
          ignoreEmpty: searchOptions.ignoreEmpty,
          sync: options.sync,
          rcStrictJson: options.rcStrictJson,
          rcExtensions: options.rcExtensions,
        });
      },
      result => {
        if (result || !options.js) return result;
        return loadJs(path.join(directory, options.js), {
          ignoreEmpty: searchOptions.ignoreEmpty,
          sync: options.sync,
        });
      },
      result => {
        if (result) return result;

        const nextDirectory = path.dirname(directory);

        if (nextDirectory === directory || directory === options.stopDir)
          return null;

        return searchDirectory(nextDirectory, searchOptions);
      },
      transform,
    ]);

    if (searchCache) searchCache.set(directory, result);
    return result;
  }

  function load(
    configPath: string
  ): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
    if (!configPath && options.configPath) configPath = options.configPath;

    if (typeof configPath !== 'string' || configPath === '') {
      return throwError(
        new Error(
          `configPath must be a nonempty string\nconfigPath: ${JSON.stringify(
            configPath
          )}`
        )
      );
    }

    const absoluteConfigPath = path.resolve(process.cwd(), configPath);
    if (loadCache && loadCache.has(absoluteConfigPath)) {
      return loadCache.get(absoluteConfigPath);
    }

    let loadIt;
    if (path.basename(absoluteConfigPath) === 'package.json') {
      if (!packageProp) {
        return throwError(
          new Error(
            'Please specify the packageProp option. The configPath argument cannot point to a package.json file if packageProp is false.'
          )
        );
      }
      loadIt = () =>
        loadPackageProp(path.dirname(absoluteConfigPath), {
          packageProp,
          sync: options.sync,
        });
    } else {
      loadIt = () =>
        loadDefinedFile(absoluteConfigPath, {
          sync: options.sync,
          format: options.format,
        });
    }

    const loadResult = loadIt();
    const result =
      loadResult instanceof Promise
        ? loadResult.then(transform)
        : transform(loadResult);
    if (loadCache) loadCache.set(absoluteConfigPath, result);
    return result;
  }

  return {
    search,
    load,
    clearLoadCache,
    clearSearchCache,
    clearCaches,
  };
};

function identity(x) {
  return x;
}
