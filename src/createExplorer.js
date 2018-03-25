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

const configPathPackagePropError =
  'Please specify the packageProp option. The configPath argument cannot point to a package.json file if packageProp is false.';

module.exports = function createExplorer(options: ExplorerOptions) {
  // When `options.sync` is `false` (default),
  // these cache Promises that resolve with results, not the results themselves.
  const loadCache: Map<string, Promise<CosmiconfigResult>> = new Map();
  const loadSyncCache: Map<string, CosmiconfigResult> = new Map();
  const searchCache: Map<string, Promise<CosmiconfigResult>> = new Map();
  const searchSyncCache: Map<string, CosmiconfigResult> = new Map();
  const transform = options.transform || identity;
  const packageProp = options.packageProp;

  function clearLoadCache() {
    loadCache.clear();
    loadSyncCache.clear();
  }

  function clearSearchCache() {
    searchCache.clear();
    searchSyncCache.clear();
  }

  function clearCaches() {
    clearLoadCache();
    clearSearchCache();
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
          return searchDirectory(nextDirectory, searchOptions);
        },
      ],
      { ignoreEmpty: searchOptions.ignoreEmpty }
    );

    const result = resultPromise.then(transform);
    if (options.cache) {
      searchCache.set(directory, result);
    }
    return result;
  }

  function searchDirectorySync(
    directory: string,
    searchOptions: SearchOptions
  ): CosmiconfigResult {
    if (options.cache) {
      const cached = searchSyncCache.get(directory);
      if (cached !== undefined) return cached;
    }

    const rawResult = loaderSeries.sync(
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

    const result = transform(rawResult);
    if (options.cache) {
      searchSyncCache.set(directory, result);
    }
    return result;
  }

  function getAbsoluteConfigPath(configPath?: string): string {
    if (!configPath && options.configPath) {
      configPath = options.configPath;
    }

    if (typeof configPath !== 'string' || configPath === '') {
      throw new Error(
        `configPath must be a nonempty string\nconfigPath: ${JSON.stringify(
          configPath
        )}`
      );
    }

    return path.resolve(process.cwd(), configPath);
  }

  function load(configPath?: string): Promise<CosmiconfigResult> {
    return Promise.resolve().then(() => {
      const absoluteConfigPath = getAbsoluteConfigPath(configPath);

      if (options.cache) {
        const cached = loadCache.get(absoluteConfigPath);
        if (cached !== undefined) return cached;
      }

      let resultPromise;
      if (path.basename(absoluteConfigPath) === 'package.json') {
        if (!packageProp) {
          throw new Error(configPathPackagePropError);
        }
        resultPromise = loader.loadPackageProp(
          path.dirname(absoluteConfigPath),
          packageProp
        );
      } else {
        resultPromise = loadDefinedFile(absoluteConfigPath);
      }

      const result = resultPromise.then(transform);
      if (options.cache) {
        loadCache.set(absoluteConfigPath, result);
      }
      return result;
    });
  }

  function loadSync(configPath?: string): CosmiconfigResult {
    const absoluteConfigPath = getAbsoluteConfigPath(configPath);

    if (options.cache) {
      const cached = loadSyncCache.get(absoluteConfigPath);
      if (cached !== undefined) return cached;
    }

    let rawResult;
    if (path.basename(absoluteConfigPath) === 'package.json') {
      if (!packageProp) {
        throw new Error(configPathPackagePropError);
      }
      rawResult = loader.loadPackagePropSync(
        path.dirname(absoluteConfigPath),
        packageProp
      );
    } else {
      rawResult = loadDefinedFile.sync(absoluteConfigPath);
    }

    const result = transform(rawResult);
    if (options.cache) {
      loadSyncCache.set(absoluteConfigPath, result);
    }
    return result;
  }

  return {
    search,
    searchSync,
    load,
    loadSync,
    clearLoadCache,
    clearSearchCache,
    clearCaches,
  };
};

function identity(x) {
  return x;
}
