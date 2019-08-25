import path from 'path';
import { ExplorerBase, getExtensionDescription } from './createExplorerBase';
import { readFileSync } from './readFile';
import { cacheWrapperSync } from './cacheWrapper';
import { getDirectorySync } from './getDirectory';
import {
  CosmiconfigResult,
  ExplorerOptionsSync,
  LoadedFileContent,
} from './types';
import { LoaderSync } from './index';

class ExplorerSync extends ExplorerBase<ExplorerOptionsSync> {
  public constructor(options: ExplorerOptionsSync) {
    super(options);
  }

  public searchSync(searchFrom: string = process.cwd()): CosmiconfigResult {
    const startDirectory = getDirectorySync(searchFrom);
    const result = this.searchFromDirectorySync(startDirectory);

    return result;
  }

  private searchFromDirectorySync(dir: string): CosmiconfigResult {
    const absoluteDir = path.resolve(process.cwd(), dir);

    const run = (): CosmiconfigResult => {
      const result = this.searchDirectorySync(absoluteDir);
      const nextDir = this.nextDirectoryToSearch(absoluteDir, result);

      if (nextDir) {
        return this.searchFromDirectorySync(nextDir);
      }

      const transformResult = this.config.transform(result);

      return transformResult;
    };

    if (this.searchCache) {
      return cacheWrapperSync(this.searchCache, absoluteDir, run);
    }

    return run();
  }

  private searchDirectorySync(dir: string): CosmiconfigResult {
    for (const place of this.config.searchPlaces) {
      const placeResult = this.loadSearchPlaceSync(dir, place);

      if (this.shouldSearchStopWithResult(placeResult) === true) {
        return placeResult;
      }
    }

    // config not found
    return null;
  }

  private loadSearchPlaceSync(dir: string, place: string): CosmiconfigResult {
    const filepath = path.join(dir, place);
    const content = readFileSync(filepath);

    const result = this.createCosmiconfigResultSync(filepath, content);

    return result;
  }

  private getSyncLoaderForFile(filepath: string): LoaderSync {
    const loader = this.getLoaderEntryForFile(filepath);

    if (!loader) {
      throw new Error(
        `No sync loader specified for ${getExtensionDescription(filepath)}`,
      );
    }
    return loader;
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
    const loader = this.getSyncLoaderForFile(filepath);
    const loaderResult = loader(filepath, content);

    return loaderResult;
  }

  private createCosmiconfigResultSync(
    filepath: string,
    content: string | null,
  ): CosmiconfigResult {
    const fileContent = this.loadFileContentSync(filepath, content);
    const result = this.loadedContentToCosmiconfigResult(filepath, fileContent);

    return result;
  }

  public loadSync(filepath: string): CosmiconfigResult {
    this.validateFilePath(filepath);
    const absoluteFilePath = path.resolve(process.cwd(), filepath);

    const runLoadSync = (): CosmiconfigResult => {
      const content = readFileSync(absoluteFilePath, { throwNotFound: true });
      const cosmiconfigResult = this.createCosmiconfigResultSync(
        absoluteFilePath,
        content,
      );

      const transformResult = this.config.transform(cosmiconfigResult);

      return transformResult;
    };

    if (this.loadCache) {
      return cacheWrapperSync(this.loadCache, absoluteFilePath, runLoadSync);
    }

    return runLoadSync();
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createExplorerSync(options: ExplorerOptionsSync) {
  const explorer = new ExplorerSync(options);

  return {
    search: explorer.searchSync.bind(explorer),
    load: explorer.loadSync.bind(explorer),
    clearLoadCache: explorer.clearLoadCache.bind(explorer),
    clearSearchCache: explorer.clearSearchCache.bind(explorer),
    clearCaches: explorer.clearCaches.bind(explorer),
  } as const;
}

export { createExplorerSync };
