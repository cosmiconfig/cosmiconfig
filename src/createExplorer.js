// @flow
'use strict';

const path = require('path');
const loadDefinedFile = require('./loadDefinedFile');
const getDirectory = require('./getDirectory');
const loader = require('./loader');
const parser = require('./parser');
const searchDirectory = require('./searchDirectory');
const normalizeSearchSchema = require('./normalizeSearchSchema');
const cacheWrapper = require('./cacheWrapper');

type RawSearchOptions = ?{
  ignoreEmpty?: boolean,
};
type SearchOptions = {
  ignoreEmpty: boolean,
};
function normalizeSearchOptions(userOptions: RawSearchOptions): SearchOptions {
  return Object.assign({ ignoreEmpty: true }, userOptions);
}

type RawLoadOptions = ?{
  property?: string,
};
type LoadOptions = {
  property: string,
};
function normalizeLoadOptions(
  userOptions: RawLoadOptions,
  moduleName: string
): LoadOptions {
  return Object.assign({ property: moduleName }, userOptions);
}

module.exports = function createExplorer(options: ExplorerOptions) {
  const loadCache: ?Map<string, Promise<CosmiconfigResult>> = options.cache
    ? new Map()
    : null;
  const loadSyncCache: ?Map<string, CosmiconfigResult> = options.cache
    ? new Map()
    : null;
  const searchCache: ?Map<string, Promise<CosmiconfigResult>> = options.cache
    ? new Map()
    : null;
  const searchSyncCache: ?Map<string, CosmiconfigResult> = options.cache
    ? new Map()
    : null;
  const transform = options.transform || identity;
  // const packageProp = options.packageProp;

  // const rawSearchSchema: Array<RawSearchSchemaItem> = [];
  // if (packageProp) {
  //   rawSearchSchema.push({ filename: 'package.json', property: packageProp });
  // }
  // const rcFilename = options.rc;
  // if (rcFilename !== false) {
  //   if (options.rcStrictJson) {
  //     rawSearchSchema.push({ filename: rcFilename, loader: parser.parseJson });
  //   } else {
  //     rawSearchSchema.push(rcFilename);
  //   }
  //   if (options.rcExtensions) {
  //     rawSearchSchema.push(`${rcFilename}.json`);
  //     rawSearchSchema.push(`${rcFilename}.yaml`);
  //     rawSearchSchema.push(`${rcFilename}.yml`);
  //     rawSearchSchema.push(`${rcFilename}.js`);
  //   }
  // }
  // if (options.js) {
  //   rawSearchSchema.push(options.js);
  // }
  const searchSchema = normalizeSearchSchema(
    options.searchSchema,
    options.moduleName
  );

  function clearLoadCache() {
    loadCache && loadCache.clear();
    loadSyncCache && loadSyncCache.clear();
  }

  function clearSearchCache() {
    searchCache && searchCache.clear();
    searchSyncCache && searchSyncCache.clear();
  }

  function clearCaches() {
    clearLoadCache();
    clearSearchCache();
  }

  function search(
    searchPath: string,
    rawSearchOptions: RawSearchOptions
  ): Promise<CosmiconfigResult> {
    const searchOptions = normalizeSearchOptions(rawSearchOptions);
    const absoluteSearchPath = path.resolve(process.cwd(), searchPath || '.');
    return getDirectory(absoluteSearchPath).then(dir => {
      return searchDirectory(searchSchema, dir, {
        ignoreEmpty: searchOptions.ignoreEmpty,
        stopDir: options.stopDir,
        cache: searchCache,
      });
    });
  }

  function searchSync(
    searchPath: string,
    rawSearchOptions: RawSearchOptions
  ): CosmiconfigResult {
    const searchOptions = normalizeSearchOptions(rawSearchOptions);
    const absoluteSearchPath = path.resolve(process.cwd(), searchPath || '.');
    const dir = getDirectory.sync(absoluteSearchPath);
    return searchDirectory.sync(searchSchema, dir, {
      ignoreEmpty: searchOptions.ignoreEmpty,
      stopDir: options.stopDir,
      cache: searchSyncCache,
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

  function getLoadResult(sync: boolean, absoluteConfigPath: string, options: LoadOptions): any {
    const pkg = sync ? loader.loadPackagePropSync : loader.loadPackageProp;
    const definedFile = sync ? loadDefinedFile.sync : loadDefinedFile;
    if (path.basename(absoluteConfigPath) === 'package.json') {
      return pkg(path.dirname(absoluteConfigPath), packageProp);
    }
    return definedFile(absoluteConfigPath);
  }

  function load(
    configPath?: string,
    rawLoadOptions: RawLoadOptions
  ): Promise<CosmiconfigResult> {
    const loadOptions = normalizeLoadOptions(rawLoadOptions);
    return Promise.resolve().then(() => {
      const absoluteConfigPath = getAbsoluteConfigPath(configPath);
      return cacheWrapper(loadCache, absoluteConfigPath, () => {
        const resultPromise = getLoadResult(false, absoluteConfigPath, options);
        return resultPromise.then(transform);
      });
    });
  }

  function loadSync(
    configPath?: string,
    rawLoadOptions: RawLoadOptions
  ): CosmiconfigResult {
    const loadOptions = normalizeLoadOptions(rawLoadOptions);
    const absoluteConfigPath = getAbsoluteConfigPath(configPath);
    return cacheWrapper(loadSyncCache, absoluteConfigPath, () => {
      const rawResult = getLoadResult(true, absoluteConfigPath, options);
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
