import { Config, CosmiconfigResult } from '@cosmiconfig/types';
import fs from 'fs';
import path from 'path';
import { ExplorerBase, getExtensionDescription } from './ExplorerBase';
import { hasOwn, mergeAll } from './merge';
import { DirToSearch, InternalOptionsSync } from './types';
import { emplace, getPropertyByPath, isDirectorySync } from './util';

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

    from = path.resolve(from);
    const dirs = this.#getDirs(from);
    const firstDirIter = dirs.next();
    /* istanbul ignore if -- @preserve */
    if (firstDirIter.done) {
      // this should never happen
      throw new Error(
        `Could not find any folders to iterate through (start from ${from})`,
      );
    }
    let currentDir = firstDirIter.value;
    const search = (): CosmiconfigResult => {
      /* istanbul ignore if -- @preserve */
      if (isDirectorySync(currentDir.path)) {
        for (const filepath of this.getSearchPlacesForDir(
          currentDir,
          this.config.globalConfigSearchPlaces,
        )) {
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
              error.code === 'ENOTDIR' ||
              error.code === 'EACCES'
            ) {
              continue;
            }
            throw error;
          }
        }
      }
      const nextDirIter = dirs.next();
      if (!nextDirIter.done) {
        currentDir = nextDirIter.value;
        if (this.searchCache) {
          return emplace(this.searchCache, currentDir.path, search);
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
      const loadedContents = loader(filepath, contents);

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

  #fileExists(path: string): boolean {
    try {
      fs.statSync(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  *#getDirs(startDir: string): Iterator<DirToSearch> {
    switch (this.config.searchStrategy) {
      case 'none': {
        // there is no next dir
        yield { path: startDir, isGlobalConfig: false };
        return;
      }
      case 'project': {
        let currentDir = startDir;
        while (true) {
          yield { path: currentDir, isGlobalConfig: false };
          for (const ext of ['json', 'yaml']) {
            const packageFile = path.join(currentDir, `package.${ext}`);
            if (this.#fileExists(packageFile)) {
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
