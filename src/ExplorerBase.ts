import envPaths from 'env-paths';
import os from 'os';
import path from 'path';
import {
  AsyncCache,
  Cache,
  Config,
  CosmiconfigResult,
  InternalOptions,
  InternalOptionsSync,
  DirToSearch,
} from './types.js';
import { getPropertyByPath } from './util.js';

/**
 * @internal
 */
export abstract class ExplorerBase<
  T extends InternalOptions | InternalOptionsSync,
> {
  #loadingMetaConfig = false;

  protected readonly config: T;
  protected readonly loadCache?: T extends InternalOptionsSync
    ? Cache
    : AsyncCache;
  protected readonly searchCache?: T extends InternalOptionsSync
    ? Cache
    : AsyncCache;

  public constructor(options: Readonly<T>) {
    this.config = options;
    if (options.cache) {
      this.loadCache = new Map();
      this.searchCache = new Map();
    }
    this.#validateConfig();
  }

  protected set loadingMetaConfig(value: boolean) {
    this.#loadingMetaConfig = value;
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

  protected toCosmiconfigResult(
    filepath: string,
    config: Config,
  ): CosmiconfigResult {
    if (config === null) {
      return null;
    }
    if (config === undefined) {
      return { filepath, config: undefined, isEmpty: true };
    }
    if (
      this.config.applyPackagePropertyPathToConfiguration ||
      this.#loadingMetaConfig
    ) {
      const packageProp = this.config.packageProp ?? this.config.moduleName;
      config = getPropertyByPath(config, packageProp);
    }
    if (config === undefined) {
      return { filepath, config: undefined, isEmpty: true };
    }
    return { config, filepath };
  }

  protected validateImports(
    containingFilePath: string,
    imports: Array<unknown>,
    importStack: Array<string>,
  ): asserts imports is Array<string> {
    const fileDirectory = path.dirname(containingFilePath);
    for (const importPath of imports) {
      if (typeof importPath !== 'string') {
        throw new Error(
          `${containingFilePath}: Key $import must contain a string or a list of strings`,
        );
      }
      const fullPath = path.resolve(fileDirectory, importPath);
      if (fullPath === containingFilePath) {
        throw new Error(`Self-import detected in ${containingFilePath}`);
      }
      const idx = importStack.indexOf(fullPath);
      if (idx !== -1) {
        throw new Error(
          `Circular import detected:
${[...importStack, fullPath]
  .map((path, i) => `${i + 1}. ${path}`)
  .join('\n')} (same as ${idx + 1}.)`,
        );
      }
    }
  }

  protected getSearchPlacesForDir(
    dir: DirToSearch,
    globalConfigPlaces: Array<string>,
  ): Array<string> {
    return (
      dir.isGlobalConfig ? globalConfigPlaces : this.config.searchPlaces
    ).map((place) => path.join(dir.path, place));
  }

  protected getGlobalConfigDir(): string {
    return envPaths(this.config.moduleName, { suffix: '' }).config;
  }

  protected *getGlobalDirs(startDir: string): IterableIterator<DirToSearch> {
    const stopDir = path.resolve(this.config.stopDir ?? os.homedir());
    yield { path: startDir, isGlobalConfig: false };
    let currentDir = startDir;
    while (currentDir !== stopDir) {
      const parentDir = path.dirname(currentDir);
      /* istanbul ignore if -- @preserve */
      if (parentDir === currentDir) {
        // we're probably at the root of the directory structure
        break;
      }

      yield { path: parentDir, isGlobalConfig: false };
      currentDir = parentDir;
    }

    yield { path: this.getGlobalConfigDir(), isGlobalConfig: true };
  }
}

/**
 * @internal
 */
export function getExtensionDescription(extension?: string): string {
  /* istanbul ignore next -- @preserve */
  return extension ? `extension "${extension}"` : 'files without extensions';
}
