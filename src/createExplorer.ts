import path from 'path';
import * as loaders from './loaders';
import { readFile, readFileSync } from './readFile';
import { cacheWrapper, cacheWrapperSync } from './cacheWrapper';
import { getDirectory, getDirectorySync } from './getDirectory';
import { getPropertyByPath } from './getPropertyByPath';
import {
  CosmiconfigResult,
  ExplorerOptions,
  LoaderEntry,
  Config,
  Cache,
} from './types';
import { LoaderAsync, LoaderSync } from './index';

// An object value represents a config object.
// null represents that the loader did not find anything relevant.
// undefined represents that the loader found something relevant
// but it was empty.
type LoadedFileContent = Config | null | undefined;

class Explorer {
  private readonly loadCache?: Cache;
  private readonly loadSyncCache?: Cache;
  private readonly searchCache?: Cache;
  private readonly searchSyncCache?: Cache;
  private readonly config: ExplorerOptions;

  public constructor(options: ExplorerOptions) {
    if (options.cache === true) {
      this.loadCache = new Map();
      this.loadSyncCache = new Map();
      this.searchCache = new Map();
      this.searchSyncCache = new Map();
    }

    this.config = options;
    this.validateConfig();
  }

  public clearLoadCache(): void {
    if (this.loadCache) {
      this.loadCache.clear();
    }
    if (this.loadSyncCache) {
      this.loadSyncCache.clear();
    }
  }

  public clearSearchCache(): void {
    if (this.searchCache) {
      this.searchCache.clear();
    }
    if (this.searchSyncCache) {
      this.searchSyncCache.clear();
    }
  }

  public clearCaches(): void {
    this.clearLoadCache();
    this.clearSearchCache();
  }

  private validateConfig(): void {
    const config = this.config;

    config.searchPlaces.forEach((place): void => {
      const loaderKey = path.extname(place) || 'noExt';
      const loader = config.loaders[loaderKey];
      if (!loader) {
        throw new Error(
          `No loader specified for ${getExtensionDescription(
            place,
          )}, so searchPlaces item "${place}" is invalid`,
        );
      }
    });
  }

  public async search(
    searchFrom: string = process.cwd(),
  ): Promise<CosmiconfigResult> {
    return getDirectory(searchFrom).then(
      async (dir): Promise<CosmiconfigResult> => {
        return this.searchFromDirectory(dir);
      },
    );
  }

  private async searchFromDirectory(dir: string): Promise<CosmiconfigResult> {
    const absoluteDir = path.resolve(process.cwd(), dir);
    const run = async (): Promise<CosmiconfigResult> => {
      return this.searchDirectory(absoluteDir).then(
        async (result): Promise<CosmiconfigResult> => {
          const nextDir = this.nextDirectoryToSearch(absoluteDir, result);
          if (nextDir) {
            return this.searchFromDirectory(nextDir);
          }
          return this.config.transform(result);
        },
      );
    };

    if (this.searchCache) {
      return cacheWrapper(this.searchCache, absoluteDir, run);
    }
    return run();
  }

  public searchSync(searchFrom: string = process.cwd()): CosmiconfigResult {
    const dir = getDirectorySync(searchFrom);
    return this.searchFromDirectorySync(dir);
  }

  private searchFromDirectorySync(dir: string): CosmiconfigResult {
    const absoluteDir = path.resolve(process.cwd(), dir);
    const run = (): CosmiconfigResult => {
      const result = this.searchDirectorySync(absoluteDir);
      const nextDir = this.nextDirectoryToSearch(absoluteDir, result);
      if (nextDir) {
        return this.searchFromDirectorySync(nextDir);
      }
      // @ts-ignore
      return this.config.transform(result);
    };

    if (this.searchSyncCache) {
      return cacheWrapperSync(this.searchSyncCache, absoluteDir, run);
    }
    return run();
  }

  private async searchDirectory(dir: string): Promise<CosmiconfigResult> {
    return this.config.searchPlaces.reduce(
      async (
        prevResultPromise: Promise<CosmiconfigResult>,
        place,
      ): Promise<CosmiconfigResult> => {
        return prevResultPromise.then(
          async (prevResult: CosmiconfigResult): Promise<CosmiconfigResult> => {
            if (this.shouldSearchStopWithResult(prevResult)) {
              return prevResult;
            }
            return this.loadSearchPlace(dir, place);
          },
        );
      },
      Promise.resolve(null),
    );
  }

  private searchDirectorySync(dir: string): CosmiconfigResult {
    let result = null;
    for (const place of this.config.searchPlaces) {
      result = this.loadSearchPlaceSync(dir, place);
      if (this.shouldSearchStopWithResult(result)) break;
    }
    return result;
  }

  private shouldSearchStopWithResult(result: CosmiconfigResult): boolean {
    if (result === null) return false;
    if (result.isEmpty && this.config.ignoreEmptySearchPlaces) return false;
    return true;
  }

  private async loadSearchPlace(
    dir: string,
    place: string,
  ): Promise<CosmiconfigResult> {
    const filepath = path.join(dir, place);
    return readFile(filepath).then(
      async (content): Promise<CosmiconfigResult> => {
        return this.createCosmiconfigResult(filepath, content);
      },
    );
  }

  private loadSearchPlaceSync(dir: string, place: string): CosmiconfigResult {
    const filepath = path.join(dir, place);
    const content = readFileSync(filepath);
    return this.createCosmiconfigResultSync(filepath, content);
  }

  private nextDirectoryToSearch(
    currentDir: string,
    currentResult: CosmiconfigResult,
  ): string | null {
    if (this.shouldSearchStopWithResult(currentResult)) {
      return null;
    }
    const nextDir = nextDirUp(currentDir);
    if (nextDir === currentDir || currentDir === this.config.stopDir) {
      return null;
    }
    return nextDir;
  }

  private loadPackageProp(filepath: string, content: string): unknown {
    const parsedContent = loaders.loadJson(filepath, content);
    const packagePropValue = getPropertyByPath(
      parsedContent,
      this.config.packageProp,
    );
    return packagePropValue || null;
  }

  private getLoaderEntryForFile(filepath: string): LoaderEntry {
    if (path.basename(filepath) === 'package.json') {
      const loader = this.loadPackageProp.bind(this);
      return { sync: loader, async: loader };
    }

    const loaderKey = path.extname(filepath) || 'noExt';
    return this.config.loaders[loaderKey] || {};
  }

  private getSyncLoaderForFile(filepath: string): LoaderSync {
    const entry = this.getLoaderEntryForFile(filepath);
    if (!entry.sync) {
      throw new Error(
        `No sync loader specified for ${getExtensionDescription(filepath)}`,
      );
    }
    return entry.sync;
  }

  private getAsyncLoaderForFile(filepath: string): LoaderAsync {
    const entry = this.getLoaderEntryForFile(filepath);
    const loader = entry.async || entry.sync;
    if (!loader) {
      throw new Error(
        `No async loader specified for ${getExtensionDescription(filepath)}`,
      );
    }
    return loader;
  }

  private async loadFileContent(
    filepath: string,
    content: string | null,
  ): Promise<LoadedFileContent> {
    if (content === null) {
      return null;
    }
    if (content.trim() === '') {
      return undefined;
    }
    const loader = this.getAsyncLoaderForFile(filepath);
    const loaderResult = await loader(filepath, content);
    return loaderResult;
  }

  private loadFileContentSync(
    filepath: string,
    content: string | null,
  ): LoadedFileContent {
    if (content === null) {
      return null;
    }
    if (content.trim() === '') {
      return undefined;
    }
    const loader = this.getSyncLoaderForFile(filepath);
    const loaderResult = loader(filepath, content);
    return loaderResult;
  }

  private loadedContentToCosmiconfigResult(
    filepath: string,
    loadedContent: LoadedFileContent,
  ): CosmiconfigResult {
    if (loadedContent === null) {
      return null;
    }
    if (loadedContent === undefined) {
      return { filepath, config: undefined, isEmpty: true };
    }
    return { config: loadedContent, filepath };
  }

  private async createCosmiconfigResult(
    filepath: string,
    content: string | null,
  ): Promise<CosmiconfigResult> {
    return Promise.resolve()
      .then((): Promise<LoadedFileContent> | LoadedFileContent => {
        return this.loadFileContent(filepath, content);
      })
      .then(
        (loaderResult): CosmiconfigResult => {
          return this.loadedContentToCosmiconfigResult(filepath, loaderResult);
        },
      );
  }

  private createCosmiconfigResultSync(
    filepath: string,
    content: string | null,
  ): CosmiconfigResult {
    const loaderResult = this.loadFileContentSync(filepath, content);
    return this.loadedContentToCosmiconfigResult(filepath, loaderResult);
  }

  private validateFilePath(filepath: string): void {
    if (!filepath) {
      throw new Error('load and loadSync must pass a non-empty string');
    }
  }

  public async load(filepath: string): Promise<CosmiconfigResult> {
    this.validateFilePath(filepath);
    const absoluteFilePath = path.resolve(process.cwd(), filepath);

    const runLoad = async (): Promise<CosmiconfigResult> => {
      return readFile(absoluteFilePath, { throwNotFound: true })
        .then(
          async (content): Promise<CosmiconfigResult> => {
            return this.createCosmiconfigResult(absoluteFilePath, content);
          },
        )
        .then(this.config.transform);
    };

    if (this.loadCache) {
      return cacheWrapper(this.loadCache, absoluteFilePath, runLoad);
    }

    return runLoad();
  }

  public loadSync(filepath: string): CosmiconfigResult {
    this.validateFilePath(filepath);
    const absoluteFilePath = path.resolve(process.cwd(), filepath);

    const runLoadSync = (): CosmiconfigResult => {
      const content = readFileSync(absoluteFilePath, {
        throwNotFound: true,
      });
      const result = this.createCosmiconfigResultSync(
        absoluteFilePath,
        content,
      );

      // @ts-ignore
      return this.config.transform(result);
    };

    if (this.loadSyncCache) {
      return cacheWrapperSync(
        this.loadSyncCache,
        absoluteFilePath,
        runLoadSync,
      );
    }

    return runLoadSync();
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createExplorer(options: ExplorerOptions) {
  const explorer = new Explorer(options);

  return {
    search: explorer.search.bind(explorer),
    searchSync: explorer.searchSync.bind(explorer),
    load: explorer.load.bind(explorer),
    loadSync: explorer.loadSync.bind(explorer),
    clearLoadCache: explorer.clearLoadCache.bind(explorer),
    clearSearchCache: explorer.clearSearchCache.bind(explorer),
    clearCaches: explorer.clearCaches.bind(explorer),
  } as const;
}

function nextDirUp(dir: string): string {
  return path.dirname(dir);
}

function getExtensionDescription(filepath: string): string {
  const ext = path.extname(filepath);
  return ext ? `extension "${ext}"` : 'files without extensions';
}

export { createExplorer };
