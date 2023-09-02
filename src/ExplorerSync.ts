import fs from 'node:fs';
import path from 'node:path';
import { isDirectorySync } from 'path-type';
import { ExplorerBase, getExtensionDescription } from './ExplorerBase';
import { loadJson } from './loaders';
import { Config, CosmiconfigResult, ExplorerOptionsSync } from './types';
import { emplace, getPropertyByPath } from './util';

class ExplorerSync extends ExplorerBase<ExplorerOptionsSync> {
  public constructor(options: ExplorerOptionsSync) {
    super(options);
  }

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

  #loadingMetaConfig = false;
  public search(from = ''): CosmiconfigResult {
    if (this.config.metaConfigFilePath) {
      this.#loadingMetaConfig = true;
      const config = this.load(this.config.metaConfigFilePath);
      this.#loadingMetaConfig = false;
      if (config && !config.isEmpty) {
        return config;
      }
    }

    const stopDir = path.resolve(this.config.stopDir);
    from = path.resolve(from);
    const search = (): CosmiconfigResult => {
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
            if (error.code === 'ENOENT' || error.code === 'EISDIR') {
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
      return null;
    };

    if (this.searchCache) {
      return emplace(this.searchCache, from, search);
    }
    return search();
  }

  #readConfiguration(filepath: string): CosmiconfigResult {
    const contents = fs.readFileSync(filepath, 'utf8');
    let config = this.#loadConfiguration(filepath, contents);
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
      config = getPropertyByPath(config, this.config.packageProp);
    }
    if (config === undefined) {
      return { filepath, config: undefined, isEmpty: true };
    }
    return { config, filepath };
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

export { ExplorerSync };
