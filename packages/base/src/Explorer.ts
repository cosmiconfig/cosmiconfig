import fs from 'fs/promises';
import path from 'path';
import { ExplorerBase, getExtensionDescription } from './ExplorerBase';
import { globalConfigSearchPlaces } from './defaults';
import { hasOwn, mergeAll } from './merge';
import {
  Config,
  CosmiconfigResult,
  DirToSearch,
  InternalOptions,
} from './types';
import { emplace, getPropertyByPath, isDirectory } from './util';

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

    from = path.resolve(from);
    const dirs = this.#getDirs(from);
    const firstDirIter = await dirs.next();
    /* istanbul ignore if -- @preserve */
    if (firstDirIter.done) {
      // this should never happen
      throw new Error(
        `Could not find any folders to iterate through (start from ${from})`,
      );
    }
    let currentDir = firstDirIter.value;
    const search = async (): Promise<CosmiconfigResult> => {
      /* istanbul ignore if -- @preserve */
      if (await isDirectory(currentDir.path)) {
        for (const filepath of this.getSearchPlacesForDir(
          currentDir,
          globalConfigSearchPlaces,
        )) {
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
              error.code === 'ENOTDIR' ||
              error.code === 'EACCES'
            ) {
              continue;
            }
            throw error;
          }
        }
      }
      const nextDirIter = await dirs.next();
      if (!nextDirIter.done) {
        currentDir = nextDirIter.value;
        if (this.searchCache) {
          return await emplace(this.searchCache, currentDir.path, search);
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

    const extension = path.extname(filepath);
    const loader =
      this.config.loaders[extension || 'noExt'] ??
      this.config.loaders['default'];

    if (!loader) {
      throw new Error(
        `No loader specified for ${getExtensionDescription(extension)}`,
      );
    }

    try {
      const loadedContents = await loader(filepath, contents);

      if (path.basename(filepath, extension) !== 'package') {
        return loadedContents;
      }

      return (
        getPropertyByPath(
          loadedContents,
          this.config.packageProp ?? this.config.moduleName,
        ) ?? null
      );
    } catch (error) {
      error.filepath = filepath;
      throw error;
    }
  }

  async #fileExists(path: string): Promise<boolean> {
    try {
      await fs.stat(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  async *#getDirs(startDir: string): AsyncIterableIterator<DirToSearch> {
    switch (this.config.searchStrategy) {
      case 'none': {
        // only check in the passed directory (defaults to working directory)
        yield { path: startDir, isGlobalConfig: false };
        return;
      }
      case 'project': {
        let currentDir = startDir;
        while (true) {
          yield { path: currentDir, isGlobalConfig: false };
          for (const ext of ['json', 'yaml']) {
            const packageFile = path.join(currentDir, `package.${ext}`);
            if (await this.#fileExists(packageFile)) {
              break;
            }
          }
          const parentDir = path.dirname(currentDir);
          /* istanbul ignore if -- @preserve */
          if (parentDir === currentDir) {
            // we're probably at the root of the directory structure
            break;
          }
          currentDir = parentDir;
        }
        return;
      }
      case 'global': {
        yield* this.getGlobalDirs(startDir);
      }
    }
  }
}
