import path from 'path';
import { ExplorerBase, getExtensionDescription } from './createExplorerBase';
import { readFile } from './readFile';
import { cacheWrapper } from './cacheWrapper';
import { getDirectory } from './getDirectory';
import { CosmiconfigResult, ExplorerOptions, LoadedFileContent } from './types';
import { LoaderAsync } from './index';

class ExplorerAsync extends ExplorerBase<ExplorerOptions> {
  public constructor(options: ExplorerOptions) {
    super(options);
  }

  public async search(
    searchFrom: string = process.cwd(),
  ): Promise<CosmiconfigResult> {
    const startDirectory = await getDirectory(searchFrom);
    const result = await this.searchFromDirectory(startDirectory);

    return result;
  }

  private async searchFromDirectory(dir: string): Promise<CosmiconfigResult> {
    const absoluteDir = path.resolve(process.cwd(), dir);

    const run = async (): Promise<CosmiconfigResult> => {
      const result = await this.searchDirectory(absoluteDir);
      const nextDir = this.nextDirectoryToSearch(absoluteDir, result);

      if (nextDir) {
        return this.searchFromDirectory(nextDir);
      }

      const transformResult = await this.config.transform(result);

      return transformResult;
    };

    if (this.searchCache) {
      return cacheWrapper(this.searchCache, absoluteDir, run);
    }

    return run();
  }

  private async searchDirectory(dir: string): Promise<CosmiconfigResult> {
    for await (const place of this.config.searchPlaces) {
      const placeResult = await this.loadSearchPlace(dir, place);

      if (this.shouldSearchStopWithResult(placeResult) === true) {
        return placeResult;
      }
    }

    // config not found
    return null;
  }

  private async loadSearchPlace(
    dir: string,
    place: string,
  ): Promise<CosmiconfigResult> {
    const filepath = path.join(dir, place);
    const fileContents = await readFile(filepath);

    const result = await this.createCosmiconfigResult(filepath, fileContents);

    return result;
  }

  private getAsyncLoaderForFile(filepath: string): LoaderAsync {
    const entry = this.getLoaderEntryForFile(filepath);
    const loader = entry.async || entry.sync;
    if (!loader) {
      throw new Error(
        `No async loader specified for ${getExtensionDescription(filepath)}`,
      );
    }
    return loader;
  }

  private async loadFileContent(
    filepath: string,
    content: string | null,
  ): Promise<LoadedFileContent> {
    if (content === null) {
      return null;
    }
    if (content.trim() === '') {
      return undefined;
    }
    const loader = this.getAsyncLoaderForFile(filepath);
    const loaderResult = await loader(filepath, content);
    return loaderResult;
  }

  private async createCosmiconfigResult(
    filepath: string,
    content: string | null,
  ): Promise<CosmiconfigResult> {
    const fileContent = await this.loadFileContent(filepath, content);
    const result = this.loadedContentToCosmiconfigResult(filepath, fileContent);

    return result;
  }

  public async load(filepath: string): Promise<CosmiconfigResult> {
    this.validateFilePath(filepath);
    const absoluteFilePath = path.resolve(process.cwd(), filepath);

    const runLoad = async (): Promise<CosmiconfigResult> => {
      const fileContents = await readFile(absoluteFilePath, {
        throwNotFound: true,
      });

      const result = await this.createCosmiconfigResult(
        absoluteFilePath,
        fileContents,
      );

      const transformResult = await this.config.transform(result);

      return transformResult;
    };

    if (this.loadCache) {
      return cacheWrapper(this.loadCache, absoluteFilePath, runLoad);
    }

    return runLoad();
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createExplorer(options: ExplorerOptions) {
  const explorer = new ExplorerAsync(options);

  return {
    search: explorer.search.bind(explorer),
    load: explorer.load.bind(explorer),
    clearLoadCache: explorer.clearLoadCache.bind(explorer),
    clearSearchCache: explorer.clearSearchCache.bind(explorer),
    clearCaches: explorer.clearCaches.bind(explorer),
  } as const;
}

export { createExplorer };
