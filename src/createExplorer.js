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
  return Object.assign({ ignoreEmpty: true }, userOptions);
}

module.exports = function createExplorer(options: ExplorerOptions) {
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

  function cacheWrapper<T>(cache: Map<string, T>, key: string, fn: () => T): T {
    if (options.cache) {
      const cached = cache.get(key);
      if (cached !== undefined) return cached;
    }

    const result = fn();

    if (options.cache) {
      cache.set(key, result);
    }
    return result;
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

  function getSearchDirectoryLoaderSeries(
    sync: boolean,
    dir: string,
    searchOptions: SearchOptions
  ): Array<Function> {
    const pkg = sync ? loader.loadPackagePropSync : loader.loadPackageProp;
    const rcFile = sync ? loader.loadRcFileSync : loader.loadRcFile;
    const js = sync ? loader.loadJsFileSync : loader.loadJsFile;
    const search = sync ? searchDirectorySync : searchDirectory;

    return [
      () => {
        if (!packageProp) return null;
        return pkg(dir, packageProp);
      },
      () => {
        if (!options.rc) return null;
        return rcFile(path.join(dir, options.rc), {
          strictJson: options.rcStrictJson,
          extensions: options.rcExtensions,
          ignoreEmpty: searchOptions.ignoreEmpty,
        });
      },
      () => {
        if (!options.js) return null;
        return js(path.join(dir, options.js));
      },
      () => {
        const nextDirectory = path.dirname(dir);
        if (nextDirectory === dir || dir === options.stopDir) {
          return null;
        }
        return search(nextDirectory, searchOptions);
      },
    ];
  }

  function searchDirectory(
    dir: string,
    searchOptions: SearchOptions
  ): Promise<CosmiconfigResult> {
    return cacheWrapper(searchCache, dir, () => {
      const series = getSearchDirectoryLoaderSeries(false, dir, searchOptions);
      const resultPromise = loaderSeries(series, {
        ignoreEmpty: searchOptions.ignoreEmpty,
      });
      return resultPromise.then(transform);
    });
  }

  function searchDirectorySync(
    dir: string,
    searchOptions: SearchOptions
  ): CosmiconfigResult {
    return cacheWrapper(searchSyncCache, dir, () => {
      const series = getSearchDirectoryLoaderSeries(true, dir, searchOptions);
      const rawResult = loaderSeries.sync(series, {
        ignoreEmpty: searchOptions.ignoreEmpty,
      });
      return transform(rawResult);
    });
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

  function getLoadResult(sync: boolean, absoluteConfigPath: string): any {
    const pkg = sync ? loader.loadPackagePropSync : loader.loadPackageProp;
    const definedFile = sync ? loadDefinedFile.sync : loadDefinedFile;
    if (path.basename(absoluteConfigPath) === 'package.json') {
      if (!packageProp) {
        throw new Error(
          'Please specify the packageProp option. The configPath argument cannot point to a package.json file if packageProp is false.'
        );
      }
      return pkg(path.dirname(absoluteConfigPath), packageProp);
    }
    return definedFile(absoluteConfigPath);
  }

  function load(configPath?: string): Promise<CosmiconfigResult> {
    return Promise.resolve().then(() => {
      const absoluteConfigPath = getAbsoluteConfigPath(configPath);
      return cacheWrapper(loadCache, absoluteConfigPath, () => {
        const resultPromise = getLoadResult(false, absoluteConfigPath);
        return resultPromise.then(transform);
      });
    });
  }

  function loadSync(configPath?: string): CosmiconfigResult {
    const absoluteConfigPath = getAbsoluteConfigPath(configPath);
    return cacheWrapper(loadSyncCache, absoluteConfigPath, () => {
      const rawResult = getLoadResult(true, absoluteConfigPath);
      return transform(rawResult);
    });
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
