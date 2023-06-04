import path from 'path';
import { cacheWrapper } from './cacheWrapper';
import { ExplorerBase } from './ExplorerBase';
import { getDirectory } from './getDirectory';
import { hasOwn, mergeAll } from './merge';
import { readFile } from './readFile';
import { CosmiconfigResult, ExplorerOptions, LoadedFileContent } from './types';

class Explorer extends ExplorerBase<ExplorerOptions> {
  public constructor(options: ExplorerOptions) {
    super(options);
  }

  public async search(
    searchFrom: string = process.cwd(),
  ): Promise<CosmiconfigResult> {
    if (this.config.metaConfigFilePath) {
      const config = await this._loadFile(this.config.metaConfigFilePath, true);
      if (config && !config.isEmpty) {
        return config;
      }
    }
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

    return await this.createCosmiconfigResult(filepath, fileContents, false);
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

  private async loadFileContentWithImports(
    filepath: string,
    content: string | null,
    importStack: Array<string>,
  ): Promise<LoadedFileContent> {
    const loadedContent = await this.loadFileContent(filepath, content);

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
        const importedContent = await readFile(fullPath, {
          throwNotFound: true,
        });
        const result = await this.createCosmiconfigResult(
          fullPath,
          importedContent,
          false,
          newImportStack,
        );

        return result?.config;
      }),
    );

    return mergeAll([...importedConfigs, ownContent], {
      mergeArrays: this.config.mergeImportArrays,
    });
  }

  private async createCosmiconfigResult(
    filepath: string,
    content: string | null,
    forceProp: boolean,
    importStack: Array<string> = [],
  ): Promise<CosmiconfigResult> {
    const fileContent = await this.loadFileContentWithImports(
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

  public async load(filepath: string): Promise<CosmiconfigResult> {
    return this._loadFile(filepath, false);
  }

  private async _loadFile(
    filepath: string,
    forceProp: boolean,
  ): Promise<CosmiconfigResult> {
    this.validateFilePath(filepath);
    const absoluteFilePath = path.resolve(process.cwd(), filepath);

    const runLoad = async (): Promise<CosmiconfigResult> => {
      const fileContents = await readFile(absoluteFilePath, {
        throwNotFound: true,
      });

      const result = await this.createCosmiconfigResult(
        absoluteFilePath,
        fileContents,
        forceProp,
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
