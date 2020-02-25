import path from 'path';
import { ExplorerBase } from './ExplorerBase';
import { readFileSync } from './readFile';
import { cacheWrapperSync } from './cacheWrapper';
import { getDirectorySync } from './getDirectory';
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
    const startDirectory = getDirectorySync(searchFrom);
    const result = this.searchFromDirectorySync(startDirectory);

    return result;
  }

  private searchFromDirectorySync(dir: string): CosmiconfigResult {
    const absoluteDir = path.resolve(process.cwd(), dir);

    const run = (shouldSkipFiles: Array<string> = []): CosmiconfigResult => {
      const result = this.searchDirectorySync(absoluteDir, shouldSkipFiles);
      const nextDir = this.nextDirectoryToSearch(absoluteDir, result);

      if (nextDir) {
        return this.searchFromDirectorySync(nextDir);
      } else if (result && this.config.breakOnDuplicateConfig) {
        const anotherResult = run(shouldSkipFiles.concat(result.filepath));
        if (result && anotherResult) {
          throw new Error(
            `Duplicate configuration detected in "${result.filepath}" and "${anotherResult.filepath}"`,
          );
        }
      }

      const transformResult = this.config.transform(result);

      return transformResult;
    };

    if (this.searchCache) {
      return cacheWrapperSync(this.searchCache, absoluteDir, run);
    }

    return run();
  }

  private searchDirectorySync(
    dir: string,
    shouldSkipFiles: Array<string>,
  ): CosmiconfigResult {
    for (const place of this.config.searchPlaces) {
      const filepath = path.join(dir, place);
      if (!shouldSkipFiles.find((p) => p === filepath)) {
        const placeResult = this.loadSearchPlaceSync(filepath);

        if (this.shouldSearchStopWithResult(placeResult)) {
          return placeResult;
        }
      }
    }

    // config not found
    return null;
  }

  private loadSearchPlaceSync(filepath: string): CosmiconfigResult {
    const content = readFileSync(filepath);

    const result = this.createCosmiconfigResultSync(filepath, content);

    return result;
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

export { ExplorerSync };
