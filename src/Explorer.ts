import fs from 'fs/promises';
import path from 'path';
import { isDirectory } from 'path-type';
import { ExplorerBase, getExtensionDescription } from './ExplorerBase.js';
import { loadJson } from './loaders.js';
import { hasOwn, mergeAll } from './merge';
import { Config, CosmiconfigResult, InternalOptions } from './types.js';
import { emplace, getPropertyByPath } from './util.js';

/**
 * @internal
 */
export class Explorer extends ExplorerBase<InternalOptions> {
  public async load(filepath: string): Promise<CosmiconfigResult> {
    filepath = path.resolve(filepath);

    const load = async (): Promise<CosmiconfigResult> => {
      return await this.config.transform(
        await this.#readConfiguration(filepath),
      );
    };
    if (this.loadCache) {
      return await emplace(this.loadCache, filepath, load);
    }
    return await load();
  }

  public async search(from = ''): Promise<CosmiconfigResult> {
    if (this.config.metaConfigFilePath) {
      this.loadingMetaConfig = true;
      const config = await this.load(this.config.metaConfigFilePath);
      this.loadingMetaConfig = false;
      if (config && !config.isEmpty) {
        return config;
      }
    }

    const stopDir = path.resolve(this.config.stopDir);
    from = path.resolve(from);
    const search = async (): Promise<CosmiconfigResult> => {
      /* istanbul ignore if -- @preserve */
      if (await isDirectory(from)) {
        for (const place of this.config.searchPlaces) {
          const filepath = path.join(from, place);
          try {
            const result = await this.#readConfiguration(filepath);
            if (
              result !== null &&
              !(result.isEmpty && this.config.ignoreEmptySearchPlaces)
            ) {
              return await this.config.transform(result);
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
          return await emplace(this.searchCache, from, search);
        }
        return await search();
      }
      return await this.config.transform(null);
    };

    if (this.searchCache) {
      return await emplace(this.searchCache, from, search);
    }
    return await search();
  }

  async #readConfiguration(
    filepath: string,
    importStack: Array<string> = [],
  ): Promise<CosmiconfigResult> {
    const contents = await fs.readFile(filepath, { encoding: 'utf-8' });
    return this.toCosmiconfigResult(
      filepath,
      await this.#loadConfigFileWithImports(filepath, contents, importStack),
    );
  }

  async #loadConfigFileWithImports(
    filepath: string,
    contents: string,
    importStack: Array<string>,
  ): Promise<Config | null | undefined> {
    const loadedContent = await this.#loadConfiguration(filepath, contents);

    if (!loadedContent || !hasOwn(loadedContent, '$import')) {
      return loadedContent;
    }

    const fileDirectory = path.dirname(filepath);
    const { $import: imports, ...ownContent } = loadedContent;
    const importPaths = Array.isArray(imports) ? imports : [imports];
    const newImportStack = [...importStack, filepath];
    this.validateImports(filepath, importPaths, newImportStack);

    const importedConfigs = await Promise.all(
      importPaths.map(async (importPath) => {
        const fullPath = path.resolve(fileDirectory, importPath);
        const result = await this.#readConfiguration(fullPath, newImportStack);

        return result?.config;
      }),
    );

    return mergeAll([...importedConfigs, ownContent], {
      mergeArrays: this.config.mergeImportArrays,
    });
  }

  async #loadConfiguration(
    filepath: string,
    contents: string,
  ): Promise<Config> {
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
        // eslint-disable-next-line @typescript-eslint/return-await
        return await loader(filepath, contents);
      }
    } catch (error) {
      error.filepath = filepath;
      throw error;
    }
    throw new Error(
      `No loader specified for ${getExtensionDescription(extension)}`,
    );
  }
}
