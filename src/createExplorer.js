// @flow
'use strict';

const path = require('path');
const loadDefinedFile = require('./loadDefinedFile');
const getDirectory = require('./getDirectory');
const loader = require('./loader');
const parser = require('./parser');
const searcher = require('./search');
const normalizeSearchSchema = require('./normalizeSearchSchema');

type SearchOptions = {
  ignoreEmpty: boolean,
};

function defaultSearchOptions(userOptions: SearchOptions): SearchOptions {
  return Object.assign({ ignoreEmpty: true }, userOptions);
}

type Loader = (string, string) => Object | null;
type RawSearchSchemaItem =
  | string
  | {
      filename: string,
      loader?: Loader,
      property?: string,
    };

module.exports = function createExplorer(options: ExplorerOptions) {
  const loadCache: Map<string, Promise<CosmiconfigResult>> = new Map();
  const loadSyncCache: Map<string, CosmiconfigResult> = new Map();
  const searchCache: Map<string, Promise<CosmiconfigResult>> = new Map();
  const searchSyncCache: Map<string, CosmiconfigResult> = new Map();
  const transform = options.transform || identity;
  const packageProp = options.packageProp;

  const rawSearchSchema: Array<RawSearchSchemaItem> = [];
  if (packageProp) {
    rawSearchSchema.push({ filename: 'package.json', property: packageProp });
  }
  const rcFilename = options.rc;
  if (rcFilename !== false) {
    if (options.rcStrictJson) {
      rawSearchSchema.push({ filename: rcFilename, loader: parser.parseJson });
    } else {
      rawSearchSchema.push(rcFilename);
    }
    if (options.rcExtensions) {
      rawSearchSchema.push(`${rcFilename}.json`);
      rawSearchSchema.push(`${rcFilename}.yaml`);
      rawSearchSchema.push(`${rcFilename}.yml`);
      rawSearchSchema.push(`${rcFilename}.js`);
    }
  }
  if (options.js) {
    rawSearchSchema.push(options.js);
  }
  const searchSchema = normalizeSearchSchema(
    rawSearchSchema,
    options.moduleName
  );

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
    const searchOptions = defaultSearchOptions(userSearchOptions);
    const absoluteSearchPath = path.resolve(process.cwd(), searchPath || '.');
    return getDirectory(absoluteSearchPath).then(dir => {
      return searcher(searchSchema, dir, {
        ignoreEmpty: searchOptions.ignoreEmpty,
        stopDir: options.stopDir,
        cache: options.cache ? searchCache : null,
      });
    });
  }

  function searchSync(
    searchPath: string,
    userSearchOptions: SearchOptions
  ): CosmiconfigResult {
    const searchOptions = defaultSearchOptions(userSearchOptions);
    const absoluteSearchPath = path.resolve(process.cwd(), searchPath || '.');
    const dir = getDirectory.sync(absoluteSearchPath);
    return searcher.sync(searchSchema, dir, {
      ignoreEmpty: searchOptions.ignoreEmpty,
      stopDir: options.stopDir,
      cache: options.cache ? searchSyncCache : null,
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
