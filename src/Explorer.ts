import path from 'path';
import { cacheWrapper } from './cacheWrapper';
import { ExplorerBase } from './ExplorerBase';
import { getDirectory } from './getDirectory';
import { readFile } from './readFile';
import { CosmiconfigResult, ExplorerOptions, LoadedFileContent } from './types';

class Explorer extends ExplorerBase<ExplorerOptions> {
  public constructor(options: ExplorerOptions) {
    super(options);
  }

  public async search(
    searchFrom: string = process.cwd(),
  ): Promise<CosmiconfigResult> {
    return await this.searchFromDirectory(await getDirectory(searchFrom));
  }

  private async searchFromDirectory(dir: string): Promise<CosmiconfigResult> {
    const absoluteDir = path.resolve(process.cwd(), dir);

    const run = async (): Promise<CosmiconfigResult> => {
      const result = await this.searchDirectory(absoluteDir);
      const nextDir = this.nextDirectoryToSearch(absoluteDir, result);

      if (nextDir) {
        return this.searchFromDirectory(nextDir);
      }

      return await this.config.transform(result);
    };

    if (this.searchCache) {
      return cacheWrapper(this.searchCache, absoluteDir, run);
    }

    return run();
  }

  private async searchDirectory(dir: string): Promise<CosmiconfigResult> {
    for await (const place of this.config.searchPlaces) {
      const placeResult = await this.loadSearchPlace(dir, place);

      if (this.shouldSearchStopWithResult(placeResult)) {
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

    return await this.createCosmiconfigResult(filepath, fileContents);
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
    const loader = this.getLoaderEntryForFile(filepath);
    try {
      return await loader(filepath, content);
    } catch (e) {
      e.filepath = filepath;
      throw e;
    }
  }

  private async createCosmiconfigResult(
    filepath: string,
    content: string | null,
  ): Promise<CosmiconfigResult> {
    const fileContent = await this.loadFileContent(filepath, content);

    return this.loadedContentToCosmiconfigResult(filepath, fileContent);
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

      return await this.config.transform(result);
    };

    if (this.loadCache) {
      return cacheWrapper(this.loadCache, absoluteFilePath, runLoad);
    }

    return runLoad();
  }
}

export { Explorer };
