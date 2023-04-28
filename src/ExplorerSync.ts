import path from 'path';
import { cacheWrapperSync } from './cacheWrapper';
import { ExplorerBase } from './ExplorerBase';
import { getDirectorySync } from './getDirectory';
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

  private createCosmiconfigResultSync(
    filepath: string,
    content: string | null,
    forceProp: boolean,
  ): CosmiconfigResult {
    const fileContent = this.loadFileContentSync(filepath, content);

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
