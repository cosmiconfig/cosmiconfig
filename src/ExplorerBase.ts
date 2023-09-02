import path from 'path';
import {
  AsyncCache,
  Cache,
  ExplorerOptions,
  ExplorerOptionsSync,
} from './types';

export abstract class ExplorerBase<
  T extends ExplorerOptions | ExplorerOptionsSync,
> {
  protected readonly config: T;
  protected readonly loadCache?: T extends ExplorerOptionsSync
    ? Cache
    : AsyncCache;
  protected readonly searchCache?: T extends ExplorerOptionsSync
    ? Cache
    : AsyncCache;

  public constructor(options: T) {
    this.config = options;
    if (options.cache) {
      this.loadCache = new Map();
      this.searchCache = new Map();
    }
    this.#validateConfig();
  }

  #validateConfig(): void {
    const config = this.config;

    for (const place of config.searchPlaces) {
      const extension = path.extname(place);
      const loader =
        this.config.loaders[extension || 'noExt'] ??
        this.config.loaders['default'];
      if (loader === undefined) {
        throw new Error(
          `Missing loader for ${getExtensionDescription(place)}.`,
        );
      }
      if (typeof loader !== 'function') {
        throw new Error(
          `Loader for ${getExtensionDescription(
            place,
          )} is not a function: Received ${typeof loader}.`,
        );
      }
    }
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
}

export function getExtensionDescription(extension?: string): string {
  return extension ? `extension "${extension}"` : 'files without extensions';
}
