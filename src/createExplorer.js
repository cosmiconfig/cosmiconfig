// @flow
'use strict';

const path = require('path');
const loadDefinedFile = require('./loadDefinedFile');
const getDirectory = require('./getDirectory');
const loader = require('./loader');
const loaderSeries = require('./loaderSeries');

type SearchOptions = {
  ignoreEmpty: boolean,
};

function defaultSearchOptions(userOptions: SearchOptions): SearchOptions {
  return Object.assign(
    {
      ignoreEmpty: true,
    },
    userOptions
  );
}

module.exports = function createExplorer(options: CreateExplorerOptions) {
  // When `options.sync` is `false` (default),
  // these cache Promises that resolve with results, not the results themselves.
  const loadCache = options.cache ? new Map() : null;
  const syncSearchCache: Map<string, CosmiconfigResult> = new Map();
  const searchCache: Map<string, Promise<CosmiconfigResult>> = new Map();
  const transform = options.transform || identity;
  const packageProp = options.packageProp;

  function clearLoadCache() {
    loadCache.clear();
  }

  function clearSearchCache() {
    searchCache.clear();
    syncSearchCache.clear();
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
    userSearchOptions: SearchOptions
  ): Promise<CosmiconfigResult> {
    searchPath = searchPath || process.cwd();
    const searchOptions = defaultSearchOptions(userSearchOptions);
    const absoluteSearchPath = path.resolve(process.cwd(), searchPath);
    return getDirectory(absoluteSearchPath).then(dir => {
      return searchDirectory(dir, searchOptions);
    });
  }

  function searchSync(
    searchPath: string,
    userSearchOptions: SearchOptions
  ): CosmiconfigResult {
    searchPath = searchPath || process.cwd();
    const searchOptions = defaultSearchOptions(userSearchOptions);
    const absoluteSearchPath = path.resolve(process.cwd(), searchPath);
    const dir = getDirectory.sync(absoluteSearchPath);
    return searchDirectorySync(dir, searchOptions);
  }

  function searchDirectory(
    directory: string,
    searchOptions: SearchOptions
  ): Promise<CosmiconfigResult> {
    if (options.cache) {
      const cached = searchCache.get(directory);
      if (cached !== undefined) return cached;
    }

    const resultPromise = loaderSeries(
      [
        () => {
          if (!packageProp) return null;
          return loader.loadPackageProp(directory, packageProp);
        },
        () => {
          if (!options.rc) return null;
          return loader.loadRcFile(path.join(directory, options.rc), {
            strictJson: options.rcStrictJson,
            extensions: options.rcExtensions,
            ignoreEmpty: searchOptions.ignoreEmpty,
          });
        },
        () => {
          if (!options.js) return null;
          return loader.loadJsFile(path.join(directory, options.js));
        },
        () => {
          const nextDirectory = path.dirname(directory);
          if (nextDirectory === directory || directory === options.stopDir) {
            return null;
          }
          return search(nextDirectory, searchOptions);
        },
      ],
      { ignoreEmpty: searchOptions.ignoreEmpty }
    );

    if (options.cache) {
      searchCache.set(directory, resultPromise);
    }
    return resultPromise;
  }

  function searchDirectorySync(
    directory: string,
    searchOptions: SearchOptions
  ): CosmiconfigResult {
    if (options.cache) {
      const cached = syncSearchCache.get(directory);
      if (cached !== undefined) return cached;
    }

    const result = loaderSeries.sync(
      [
        () => {
          if (!packageProp) return null;
          return loader.loadPackagePropSync(directory, packageProp);
        },
        () => {
          if (!options.rc) return null;
          return loader.loadRcFileSync(path.join(directory, options.rc), {
            strictJson: options.rcStrictJson,
            extensions: options.rcExtensions,
            ignoreEmpty: searchOptions.ignoreEmpty,
          });
        },
        () => {
          if (!options.js) return null;
          return loader.loadJsFileSync(path.join(directory, options.js));
        },
        () => {
          const nextDirectory = path.dirname(directory);
          if (nextDirectory === directory || directory === options.stopDir) {
            return null;
          }
          return searchDirectorySync(nextDirectory, searchOptions);
        },
      ],
      { ignoreEmpty: searchOptions.ignoreEmpty }
    );

    if (options.cache) {
      syncSearchCache.set(directory, result);
    }
    return result;
  }

  function load(
    configPath: string
  ): Promise<CosmiconfigResult> | CosmiconfigResult {
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
    searchSync,
    load,
    clearLoadCache,
    clearSearchCache,
    clearCaches,
  };
};

function identity(x) {
  return x;
}
