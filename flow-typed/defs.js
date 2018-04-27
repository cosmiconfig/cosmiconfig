type CosmiconfigResult = {
  config: any,
  filepath: string,
  isEmpty?: boolean,
} | null;

type LoaderResult = {
  config: Object | null,
  filepath: string,
};

// These are the user options with defaults applied.
type ExplorerOptions = {
  stopDir: string,
  cache: boolean,
  transform: CosmiconfigResult => CosmiconfigResult,
  packageProp: string,
  loaders: Loaders,
  searchPlaces: Array<string>,
  ignoreEmptySearchPlaces: boolean,
};

type ExplorerContext = ExplorerOptions & {
  loadCache: ?Map<string, Promise<CosmiconfigResult>>,
  loadSyncCache: ?Map<string, CosmiconfigResult>,
  searchCache: ?Map<string, Promise<CosmiconfigResult>>,
  searchSyncCache: ?Map<string, CosmiconfigResult>,
};

type Loader = (string, string) => Object | null;

type Loaders = {
  [string]: Loader,
};
