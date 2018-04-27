// @flow
'use strict';

const path = require('path');
const loaders = require('./loaders');
const readFile = require('./readFile');
const cacheWrapper = require('./cacheWrapper');
const getDirectory = require('./getDirectory');

class Explorer {
  loadCache: ?Map<string, Promise<CosmiconfigResult>>;
  loadSyncCache: ?Map<string, CosmiconfigResult>;
  searchCache: ?Map<string, Promise<CosmiconfigResult>>;
  searchSyncCache: ?Map<string, CosmiconfigResult>;
  config: ExplorerOptions;

  constructor(options: ExplorerOptions) {
    this.loadCache = options.cache ? new Map() : null;
    this.loadSyncCache = options.cache ? new Map() : null;
    this.searchCache = options.cache ? new Map() : null;
    this.searchSyncCache = options.cache ? new Map() : null;
    this.config = options;
  }

  clearLoadCache() {
    if (this.loadCache) {
      this.loadCache.clear();
    }
    if (this.loadSyncCache) {
      this.loadSyncCache.clear();
    }
  }

  clearSearchCache() {
    if (this.searchCache) {
      this.searchCache.clear();
    }
    if (this.searchSyncCache) {
      this.searchSyncCache.clear();
    }
  }

  clearCaches() {
    this.clearLoadCache();
    this.clearSearchCache();
  }

  search(searchFrom?: string): Promise<CosmiconfigResult> {
    searchFrom = searchFrom || process.cwd();
    return getDirectory(searchFrom).then(dir => {
      return this.searchFromDirectory(dir);
    });
  }

  searchFromDirectory(dir: string): Promise<CosmiconfigResult> {
    const absoluteDir = path.resolve(process.cwd(), dir);
    const run = () => {
      return this.searchDirectory(absoluteDir).then(result => {
        const nextDir = this.nextDirectoryToSearch(absoluteDir, result);
        if (nextDir) {
          return this.searchFromDirectory(nextDir);
        }
        return this.config.transform(result);
      });
    };

    if (this.searchCache) {
      return cacheWrapper(this.searchCache, absoluteDir, run);
    }
    return run();
  }

  searchSync(searchFrom?: string): CosmiconfigResult {
    searchFrom = searchFrom || process.cwd();
    const dir = getDirectory.sync(searchFrom);
    return this.searchFromDirectorySync(dir);
  }

  searchFromDirectorySync(dir: string): CosmiconfigResult {
    const absoluteDir = path.resolve(process.cwd(), dir);
    const run = () => {
      const result = this.searchDirectorySync(absoluteDir);
      const nextDir = this.nextDirectoryToSearch(absoluteDir, result);
      if (nextDir) {
        return this.searchFromDirectorySync(nextDir);
      }
      return this.config.transform(result);
    };

    if (this.searchSyncCache) {
      return cacheWrapper(this.searchSyncCache, absoluteDir, run);
    }
    return run();
  }

  searchDirectory(dir: string): Promise<CosmiconfigResult> {
    return this.config.searchPlaces.reduce((prevResultPromise, place) => {
      return prevResultPromise.then(prevResult => {
        if (this.shouldSearchStopWithResult(prevResult)) {
          return prevResult;
        }
        return this.loadSearchPlace(dir, place);
      });
    }, Promise.resolve(null));
  }

  searchDirectorySync(dir: string): CosmiconfigResult {
    let result = null;
    for (const place of this.config.searchPlaces) {
      result = this.loadSearchPlaceSync(dir, place);
      if (this.shouldSearchStopWithResult(result)) break;
    }
    return result;
  }

  shouldSearchStopWithResult(result: CosmiconfigResult): boolean {
    if (result === null) return false;
    if (result.isEmpty && this.config.ignoreEmptySearchPlaces) return false;
    return true;
  }

  loadSearchPlace(dir: string, place: string): Promise<CosmiconfigResult> {
    const filepath = path.join(dir, place);
    return readFile(filepath).then(content => {
      return this.createCosmiconfigResult(filepath, content);
    });
  }

  loadSearchPlaceSync(dir: string, place: string): CosmiconfigResult {
    const filepath = path.join(dir, place);
    const content = readFile.sync(filepath);
    return this.createCosmiconfigResult(filepath, content);
  }

  nextDirectoryToSearch(
    currentDir: string,
    currentResult: CosmiconfigResult
  ): ?string {
    if (this.shouldSearchStopWithResult(currentResult)) {
      return null;
    }
    const nextDir = nextDirUp(currentDir);
    if (nextDir === currentDir || currentDir === this.config.stopDir) {
      return null;
    }
    return nextDir;
  }

  loadPackageProp(filepath: string, content: string) {
    const parsedContent = loaders.loadJson(filepath, content);
    const packagePropValue = parsedContent[this.config.packageProp];
    return packagePropValue || null;
  }

  getLoaderForFile(filepath: string): Loader {
    if (path.basename(filepath) === 'package.json') {
      return this.loadPackageProp.bind(this);
    }
    const extname = path.extname(filepath);
    let loader =
      extname === '' ? this.config.loaders.noExt : this.config.loaders[extname];
    if (!loader) {
      const extensionDescription = extname
        ? `extension "${extname}"`
        : 'files without extensions';
      throw new Error(
        `No loader specified for ${extensionDescription}. Cannot load ${filepath}.`
      );
    }
    return loader;
  }

  createCosmiconfigResult(
    filepath: string,
    content: string | null
  ): CosmiconfigResult {
    if (content === null) {
      return null;
    }
    if (content.trim() === '') {
      return { filepath, config: undefined, isEmpty: true };
    }
    const loader = this.getLoaderForFile(filepath);
    const config = loader(filepath, content);
    if (config === null) {
      return null;
    }
    return { config, filepath };
  }

  validateFilePath(filepath?: string) {
    if (!filepath) {
      throw new Error('load and loadSync must be pass a non-empty string');
    }
  }

  load(filepath: string): Promise<CosmiconfigResult> {
    return Promise.resolve().then(() => {
      this.validateFilePath(filepath);
      const absoluteFilePath = path.resolve(process.cwd(), filepath);
      return cacheWrapper(this.loadCache, absoluteFilePath, () => {
        return readFile(absoluteFilePath, { throwNotFound: true })
          .then(content => {
            return this.createCosmiconfigResult(filepath, content);
          })
          .then(this.config.transform);
      });
    });
  }

  loadSync(filepath: string): CosmiconfigResult {
    this.validateFilePath(filepath);
    const absoluteFilePath = path.resolve(process.cwd(), filepath);
    return cacheWrapper(this.loadSyncCache, absoluteFilePath, () => {
      const content = readFile.sync(absoluteFilePath, { throwNotFound: true });
      const result = this.createCosmiconfigResult(filepath, content);
      return this.config.transform(result);
    });
  }
}

module.exports = function createExplorer(options: ExplorerOptions) {
  const explorer = new Explorer(options);

  return {
    search: explorer.search.bind(explorer),
    searchSync: explorer.searchSync.bind(explorer),
    load: explorer.load.bind(explorer),
    loadSync: explorer.loadSync.bind(explorer),
    clearLoadCache: explorer.clearLoadCache.bind(explorer),
    clearSearchCache: explorer.clearSearchCache.bind(explorer),
    clearCaches: explorer.clearCaches.bind(explorer),
  };
};

function nextDirUp(dir: string): string {
  return path.dirname(dir);
}
