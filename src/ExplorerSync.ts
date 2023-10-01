import fs from 'fs';
import path from 'path';
import { isDirectorySync } from 'path-type';
import { ExplorerBase, getExtensionDescription } from './ExplorerBase.js';
import { loadJson } from './loaders.js';
import { hasOwn, mergeAll } from './merge';
import { Config, CosmiconfigResult, InternalOptionsSync } from './types.js';
import { emplace, getPropertyByPath } from './util.js';

/**
 * @internal
 */
export class ExplorerSync extends ExplorerBase<InternalOptionsSync> {
  public load(filepath: string): CosmiconfigResult {
    filepath = path.resolve(filepath);

    const load = (): CosmiconfigResult => {
      return this.config.transform(this.#readConfiguration(filepath));
    };
    if (this.loadCache) {
      return emplace(this.loadCache, filepath, load);
    }
    return load();
  }

  public search(from = ''): CosmiconfigResult {
    if (this.config.metaConfigFilePath) {
      this.loadingMetaConfig = true;
      const config = this.load(this.config.metaConfigFilePath);
      this.loadingMetaConfig = false;
      if (config && !config.isEmpty) {
        return config;
      }
    }

    const stopDir = path.resolve(this.config.stopDir);
    from = path.resolve(from);
    const search = (): CosmiconfigResult => {
      /* istanbul ignore if -- @preserve */
      if (isDirectorySync(from)) {
        for (const place of this.config.searchPlaces) {
          const filepath = path.join(from, place);
          try {
            const result = this.#readConfiguration(filepath);
            if (
              result !== null &&
              !(result.isEmpty && this.config.ignoreEmptySearchPlaces)
            ) {
              return this.config.transform(result);
            }
          } catch (error) {
            if (
              error.code === 'ENOENT' ||
              error.code === 'EISDIR' ||
              error.code === 'ENOTDIR'
            ) {
              continue;
            }
            throw error;
          }
        }
      }
      const dir = path.dirname(from);
      if (from !== stopDir && from !== dir) {
        from = dir;
        if (this.searchCache) {
          return emplace(this.searchCache, from, search);
        }
        return search();
      }
      return this.config.transform(null);
    };

    if (this.searchCache) {
      return emplace(this.searchCache, from, search);
    }
    return search();
  }

  #readConfiguration(
    filepath: string,
    importStack: Array<string> = [],
  ): CosmiconfigResult {
    const contents = fs.readFileSync(filepath, 'utf8');
    return this.toCosmiconfigResult(
      filepath,
      this.#loadConfigFileWithImports(filepath, contents, importStack),
    );
  }

  #loadConfigFileWithImports(
    filepath: string,
    contents: string,
    importStack: Array<string>,
  ): Config | null | undefined {
    const loadedContent = this.#loadConfiguration(filepath, contents);

    if (!loadedContent || !hasOwn(loadedContent, '$import')) {
      return loadedContent;
    }

    const fileDirectory = path.dirname(filepath);
    const { $import: imports, ...ownContent } = loadedContent;
    const importPaths = Array.isArray(imports) ? imports : [imports];
    const newImportStack = [...importStack, filepath];
    this.validateImports(filepath, importPaths, newImportStack);

    const importedConfigs = importPaths.map((importPath) => {
      const fullPath = path.resolve(fileDirectory, importPath);
      const result = this.#readConfiguration(fullPath, newImportStack);

      return result?.config;
    });
    return mergeAll([...importedConfigs, ownContent], {
      mergeArrays: this.config.mergeImportArrays,
    });
  }

  #loadConfiguration(filepath: string, contents: string): Config {
    if (contents.trim() === '') {
      return;
    }

    if (path.basename(filepath) === 'package.json') {
      return (
        getPropertyByPath(
          loadJson(filepath, contents),
          this.config.packageProp,
        ) ?? null
      );
    }

    const extension = path.extname(filepath);
    try {
      const loader =
        this.config.loaders[extension || 'noExt'] ??
        this.config.loaders['default'];
      if (loader !== undefined) {
        return loader(filepath, contents);
      }
    } catch (error) {
      error.filepath = filepath;
      throw error;
    }
    throw new Error(
      `No loader specified for ${getExtensionDescription(extension)}`,
    );
  }

  /**
   * @deprecated Use {@link ExplorerSync.prototype.load}.
   */
  /* istanbul ignore next */
  public loadSync(filepath: string): CosmiconfigResult {
    return this.load(filepath);
  }

  /**
   * @deprecated Use {@link ExplorerSync.prototype.search}.
   */
  /* istanbul ignore next */
  public searchSync(from = ''): CosmiconfigResult {
    return this.search(from);
  }
}
