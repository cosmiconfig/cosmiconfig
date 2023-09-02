import path from 'path';
import { getPropertyByPath } from './getPropertyByPath';
import { Loader } from './index';
import {
  Cache,
  CosmiconfigResult,
  ExplorerOptions,
  ExplorerOptionsSync,
  LoadedFileContent,
} from './types';
import { loadJson } from './loaders';

class ExplorerBase<T extends ExplorerOptions | ExplorerOptionsSync> {
  protected readonly loadCache?: Cache;
  protected readonly searchCache?: Cache;
  protected readonly config: T;

  public constructor(options: T) {
    if (options.cache) {
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

      if (typeof loader !== 'function') {
        throw new Error(
          `loader for ${getExtensionDescription(
            place,
          )} is not a function (type provided: "${typeof loader}"), so searchPlaces item "${place}" is invalid`,
        );
      }
    });
  }

  protected shouldSearchStopWithResult(result: CosmiconfigResult): boolean {
    if (result === null) return false;
    return !(result.isEmpty && this.config.ignoreEmptySearchPlaces);
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
    const parsedContent = loadJson(filepath, content);
    const packagePropValue = getPropertyByPath(
      parsedContent,
      this.config.packageProp,
    );
    return packagePropValue || null;
  }

  protected getLoaderEntryForFile(filepath: string): Loader {
    if (path.basename(filepath) === 'package.json') {
      return this.loadPackageProp.bind(this);
    }

    const loaderKey = path.extname(filepath) || 'noExt';

    const loader = this.config.loaders[loaderKey];

    if (!loader) {
      throw new Error(
        `No loader specified for ${getExtensionDescription(filepath)}`,
      );
    }

    return loader;
  }

  protected loadedContentToCosmiconfigResult(
    filepath: string,
    loadedContent: LoadedFileContent,
    forceProp: boolean,
  ): CosmiconfigResult {
    if (loadedContent === null) {
      return null;
    }
    if (loadedContent === undefined) {
      return { filepath, config: undefined, isEmpty: true };
    }
    if (this.config.usePackagePropInConfigFiles || forceProp) {
      loadedContent = getPropertyByPath(loadedContent, this.config.packageProp);
    }
    if (loadedContent === undefined) {
      return { filepath, config: undefined, isEmpty: true };
    }
    return { config: loadedContent, filepath };
  }

  protected validateFilePath(filepath: string): void {
    if (!filepath) {
      throw new Error('load must pass a non-empty string');
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
