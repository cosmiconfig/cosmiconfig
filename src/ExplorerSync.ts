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

  public searchSync(searchFrom: string | string [] = process.cwd()): CosmiconfigResult {
    if(typeof searchFrom === 'string'){
      searchFrom = [searchFrom];
    }
    
    for(const dir of searchFrom){
      const startDirectory = getDirectorySync(searchFrom);
      const result = this.searchFromDirectorySync(startDirectory);
      
      if(result) return result;
    }

    return null;
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
