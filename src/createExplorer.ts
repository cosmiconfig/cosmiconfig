import path from 'path';
import * as loaders from './loaders';
import { readFileAsync, readFileSync } from './readFile';
import { cacheWrapperSync, cacheWrapperAsync } from './cacheWrapper';
import { getDirectoryAsync, getDirectorySync } from './getDirectory';
import { getPropertyByPath } from './getPropertyByPath';
import {
  CosmiconfigResult,
  ExplorerOptions,
  AsyncLoader,
  SyncLoader,
  LoaderEntry,
  Config,
  Cache,
} from './types';

// An object value represents a config object.
// null represents that the loader did not find anything relevant.
// undefined represents that the loader found something relevant
// but it was empty.
type LoadedFileContent = Config | void;

function nextDirUp(dir: string): string {
  return path.dirname(dir);
}

function getExtensionDescription(filepath: string): string {
  const ext = path.extname(filepath);
  return ext ? `extension "${ext}"` : 'files without extensions';
}

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
    const startDirectory = await getDirectoryAsync(searchFrom);
    const result = await this.searchFromDirectory(startDirectory);

    return result;
  }

  private async searchFromDirectory(dir: string): Promise<CosmiconfigResult> {
    const absoluteDir = path.resolve(process.cwd(), dir);

    const run = async (): Promise<CosmiconfigResult> => {
      const cosmiconfigResult = await this.searchDirectory(absoluteDir);

      const nextDir = this.nextDirectoryToSearch(
        absoluteDir,
        cosmiconfigResult,
      );

      if (nextDir) {
        const tryNextDirectory = await this.searchFromDirectory(nextDir);

        return tryNextDirectory;
      }

      const transformResult = await this.config.transform(cosmiconfigResult);

      return transformResult;
    };

    if (this.searchCache) {
      return cacheWrapperAsync(this.searchCache, absoluteDir, run);
    }

    return run();
  }

  public searchSync(searchFrom: string = process.cwd()): CosmiconfigResult {
    const dir = getDirectorySync(searchFrom);
    const result = this.searchFromDirectorySync(dir);

    return result;
  }

  private searchFromDirectorySync(dir: string): CosmiconfigResult {
    const absoluteDir = path.resolve(process.cwd(), dir);
    const run = (): CosmiconfigResult => {
      const cosmiconfigResult = this.searchDirectorySync(absoluteDir);
      const nextDir = this.nextDirectoryToSearch(
        absoluteDir,
        cosmiconfigResult,
      );

      if (nextDir) {
        return this.searchFromDirectorySync(nextDir);
      }

      const transformResult = this.config.transform(cosmiconfigResult);

      return transformResult;
    };

    if (this.searchSyncCache) {
      return cacheWrapperSync(this.searchSyncCache, absoluteDir, run);
    }

    return run();
  }

  private async searchDirectory(dir: string): Promise<CosmiconfigResult> {
    for await (const place of this.config.searchPlaces) {
      const tryToLoadConfig = await this.loadSearchPlace(dir, place);

      if (this.shouldSearchStopWithResult(tryToLoadConfig) === true) {
        return tryToLoadConfig;
      }
    }

    // config not found
    return null;
  }

  private searchDirectorySync(dir: string): CosmiconfigResult {
    for (const place of this.config.searchPlaces) {
      const tryToLoadConfig = this.loadSearchPlaceSync(dir, place);

      if (this.shouldSearchStopWithResult(tryToLoadConfig) === true) {
        return tryToLoadConfig;
      }
    }

    // config not found
    return null;
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
    const fileContents = await readFileAsync(filepath);

    const cosmiconfigResult = await this.createCosmiconfigResult(
      filepath,
      fileContents,
    );

    return cosmiconfigResult;
  }

  private loadSearchPlaceSync(dir: string, place: string): CosmiconfigResult {
    const filepath = path.join(dir, place);
    const content = readFileSync(filepath);

    const cosmiconfigResult = this.createCosmiconfigResultSync(
      filepath,
      content,
    );

    return cosmiconfigResult;
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

  private loadPackageProp(filepath: string, content: string): unknown | null {
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

  private getSyncLoaderForFile(filepath: string): SyncLoader {
    const entry = this.getLoaderEntryForFile(filepath);
    if (!entry.sync) {
      throw new Error(
        `No sync loader specified for ${getExtensionDescription(filepath)}`,
      );
    }
    return entry.sync;
  }

  private getAsyncLoaderForFile(filepath: string): AsyncLoader {
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
    const fileContent = await this.loadFileContent(filepath, content);

    const cosmiconfigResult = this.loadedContentToCosmiconfigResult(
      filepath,
      fileContent,
    );

    return cosmiconfigResult;
  }

  private createCosmiconfigResultSync(
    filepath: string,
    content: string | null,
  ): CosmiconfigResult {
    const fileContent = this.loadFileContentSync(filepath, content);

    const cosmiconfigResult = this.loadedContentToCosmiconfigResult(
      filepath,
      fileContent,
    );

    return cosmiconfigResult;
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
      const fileContents = await readFileAsync(absoluteFilePath, {
        throwNotFound: true,
      });

      const cosmiconfigResult = await this.createCosmiconfigResult(
        absoluteFilePath,
        fileContents,
      );

      const transformResult = await this.config.transform(cosmiconfigResult);

      return transformResult;
    };

    if (this.loadCache) {
      return cacheWrapperAsync(this.loadCache, absoluteFilePath, runLoad);
    }

    return runLoad();
  }

  public loadSync(filepath: string): CosmiconfigResult {
    this.validateFilePath(filepath);
    const absoluteFilePath = path.resolve(process.cwd(), filepath);

    const runLoadSync = (): CosmiconfigResult => {
      const content = readFileSync(absoluteFilePath, { throwNotFound: true });
      const cosmiconfigResult = this.createCosmiconfigResultSync(
        absoluteFilePath,
        content,
      );

      const transformResult = this.config.transform(cosmiconfigResult);

      return transformResult;
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

export { createExplorer };
