import path from 'path';
import * as loaders from './loaders';
import { getPropertyByPath } from './getPropertyByPath';
import {
  CosmiconfigResult,
  ExplorerOptions,
  ExplorerOptionsSync,
  LoaderEntry,
  Cache,
  LoadedFileContent,
} from './types';

class ExplorerBase<T extends ExplorerOptions | ExplorerOptionsSync> {
  protected readonly loadCache?: Cache;
  protected readonly searchCache?: Cache;
  protected readonly config: T;

  public constructor(options: T) {
    if (options.cache === true) {
      this.loadCache = new Map();
      this.searchCache = new Map();
    }

    this.config = options;
    this.validateConfig();
  }

  public clearLoadCache(): void {
    if (this.loadCache) {
      this.loadCache.clear();
    }
  }

  public clearSearchCache(): void {
    if (this.searchCache) {
      this.searchCache.clear();
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

  protected shouldSearchStopWithResult(result: CosmiconfigResult): boolean {
    if (result === null) return false;
    if (result.isEmpty && this.config.ignoreEmptySearchPlaces) return false;
    return true;
  }

  protected nextDirectoryToSearch(
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

  protected getLoaderEntryForFile(filepath: string): LoaderEntry {
    if (path.basename(filepath) === 'package.json') {
      const loader = this.loadPackageProp.bind(this);
      return { sync: loader, async: loader };
    }

    const loaderKey = path.extname(filepath) || 'noExt';
    return this.config.loaders[loaderKey] || {};
  }

  protected loadedContentToCosmiconfigResult(
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

  protected validateFilePath(filepath: string): void {
    if (!filepath) {
      throw new Error('load and loadSync must pass a non-empty string');
    }
  }
}

function nextDirUp(dir: string): string {
  return path.dirname(dir);
}

function getExtensionDescription(filepath: string): string {
  const ext = path.extname(filepath);
  return ext ? `extension "${ext}"` : 'files without extensions';
}

export { ExplorerBase, getExtensionDescription };
