import path from 'path';
import { ExplorerBase } from './ExplorerBase';
import { readFile } from './readFile';
import { cacheWrapper } from './cacheWrapper';
import { getDirectory } from './getDirectory';
import { CosmiconfigResult, ExplorerOptions, LoadedFileContent } from './types';

class Explorer extends ExplorerBase<ExplorerOptions> {
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

    const run = async (
      shouldSkipFiles: Array<string> = [],
    ): Promise<CosmiconfigResult> => {
      const result = await this.searchDirectory(absoluteDir, shouldSkipFiles);
      const nextDir = this.nextDirectoryToSearch(absoluteDir, result);

      if (nextDir) {
        return this.searchFromDirectory(nextDir);
      } else if (result && this.config.breakOnDuplicateConfig) {
        const anotherResult = await run(
          shouldSkipFiles.concat(result.filepath),
        );
        if (result && anotherResult) {
          throw new Error(
            `Duplicate configuration detected in "${result.filepath}" and "${anotherResult.filepath}"`,
          );
        }
      }

      const transformResult = await this.config.transform(result);

      return transformResult;
    };

    if (this.searchCache) {
      return cacheWrapper(this.searchCache, absoluteDir, run);
    }

    return run();
  }

  private async searchDirectory(
    dir: string,
    shouldSkipFiles: Array<string>,
  ): Promise<CosmiconfigResult> {
    for await (const place of this.config.searchPlaces) {
      const filepath = path.join(dir, place);
      if (!shouldSkipFiles.find((p) => p === filepath)) {
        const placeResult = await this.loadSearchPlace(filepath);

        if (this.shouldSearchStopWithResult(placeResult)) {
          return placeResult;
        }
      }
    }

    // config not found
    return null;
  }

  private async loadSearchPlace(filepath: string): Promise<CosmiconfigResult> {
    const fileContents = await readFile(filepath);

    const result = await this.createCosmiconfigResult(filepath, fileContents);

    return result;
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

export { Explorer };
