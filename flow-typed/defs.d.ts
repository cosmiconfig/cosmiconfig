type CosmiconfigResult = import('../src').CosmiconfigResult;

type LoaderResult = {
  config: Object | null,
  filepath: string,
};

// These are the user options with defaults applied.
type ExplorerOptions = {
  stopDir: string,
  cache: boolean,
  transform: (result: CosmiconfigResult) => CosmiconfigResult,
  packageProp: string,
  loaders: Loaders,
  searchPlaces: Array<string>,
  ignoreEmptySearchPlaces: boolean,
};

type ExplorerContext = ExplorerOptions & {
  loadCache?: Map<string, Promise<CosmiconfigResult>>,
  loadSyncCache?: Map<string, CosmiconfigResult>,
  searchCache?: Map<string, Promise<CosmiconfigResult>>,
  searchSyncCache?: Map<string, CosmiconfigResult>,
};

type SyncLoader = (filepath: string, content: string) => Object | null;
type AsyncLoader = (
  filepath: string,
  content: string
) => Object | null | Promise<Object | null>;
type LoaderEntry = {
  sync?: SyncLoader,
  async?: AsyncLoader,
};
type Loaders = {
  [s: string]: LoaderEntry,
};
