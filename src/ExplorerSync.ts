import path from 'path';
import { cacheWrapperSync } from './cacheWrapper';
import { ExplorerBase } from './ExplorerBase';
import { getDirectorySync } from './getDirectory';
import { hasOwn, mergeAll } from './merge';
import { readFileSync } from './readFile';
import {
  CosmiconfigResult,
  ExplorerOptionsSync,
  LoadedFileContent,
} from './types';

class ExplorerSync extends ExplorerBase<ExplorerOptionsSync> {
  public constructor(options: ExplorerOptionsSync) {
    super(options);
  }

  public searchSync(searchFrom: string = process.cwd()): CosmiconfigResult {
    if (this.config.metaConfigFilePath) {
      const config = this._loadFileSync(this.config.metaConfigFilePath, true);
      if (config && !config.isEmpty) {
        return config;
      }
    }
    return this.searchFromDirectorySync(getDirectorySync(searchFrom));
  }

  private searchFromDirectorySync(dir: string): CosmiconfigResult {
    const absoluteDir = path.resolve(process.cwd(), dir);

    const run = (): CosmiconfigResult => {
      const result = this.searchDirectorySync(absoluteDir);
      const nextDir = this.nextDirectoryToSearch(absoluteDir, result);

      if (nextDir) {
        return this.searchFromDirectorySync(nextDir);
      }

      return this.config.transform(result);
    };

    if (this.searchCache) {
      return cacheWrapperSync(this.searchCache, absoluteDir, run);
    }

    return run();
  }

  private searchDirectorySync(dir: string): CosmiconfigResult {
    for (const place of this.config.searchPlaces) {
      const placeResult = this.loadSearchPlaceSync(dir, place);

      if (this.shouldSearchStopWithResult(placeResult)) {
        return placeResult;
      }
    }

    // config not found
    return null;
  }

  private loadSearchPlaceSync(dir: string, place: string): CosmiconfigResult {
    const filepath = path.join(dir, place);
    const content = readFileSync(filepath);

    return this.createCosmiconfigResultSync(filepath, content, false);
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
    const loader = this.getLoaderEntryForFile(filepath);
    try {
      return loader(filepath, content);
    } catch (e: any) {
      e.filepath = filepath;
      throw e;
    }
  }

  private loadFileContentWithImportsSync(
    filepath: string,
    content: string | null,
    importStack: Array<string>,
  ): LoadedFileContent {
    const loadedContent = this.loadFileContentSync(filepath, content);

    if (!loadedContent || !hasOwn(loadedContent, '$import')) {
      return loadedContent;
    }

    const fileDirectory = path.dirname(filepath);
    const { $import: imports, ...ownContent } = loadedContent;
    const importPaths = Array.isArray(imports) ? imports : [imports];

    const importedConfigs = importPaths.map((importPath) => {
      const fullPath = path.resolve(fileDirectory, importPath);
      const importedContent = readFileSync(fullPath, {
        throwNotFound: true,
      });
      const result = this.createCosmiconfigResultSync(
        fullPath,
        importedContent,
        false,
        [...importStack, filepath],
      );

      return result?.config;
    });

    return mergeAll([...importedConfigs, ownContent], {
      mergeArrays: this.config.mergeImportArrays,
    });
  }

  private createCosmiconfigResultSync(
    filepath: string,
    content: string | null,
    forceProp: boolean,
    importStack: Array<string> = [],
  ): CosmiconfigResult {
    const fileContent = this.loadFileContentWithImportsSync(
      filepath,
      content,
      importStack,
    );

    return this.loadedContentToCosmiconfigResult(
      filepath,
      fileContent,
      forceProp,
    );
  }

  public loadSync(filepath: string): CosmiconfigResult {
    return this._loadFileSync(filepath, false);
  }

  private _loadFileSync(
    filepath: string,
    forceProp: boolean,
  ): CosmiconfigResult {
    this.validateFilePath(filepath);
    const absoluteFilePath = path.resolve(process.cwd(), filepath);

    const runLoadSync = (): CosmiconfigResult => {
      const content = readFileSync(absoluteFilePath, { throwNotFound: true });
      const cosmiconfigResult = this.createCosmiconfigResultSync(
        absoluteFilePath,
        content,
        forceProp,
      );

      return this.config.transform(cosmiconfigResult);
    };

    if (this.loadCache) {
      return cacheWrapperSync(this.loadCache, absoluteFilePath, runLoadSync);
    }

    return runLoadSync();
  }
}

export { ExplorerSync };
