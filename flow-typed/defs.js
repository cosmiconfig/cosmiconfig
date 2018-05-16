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
  fs: FS,
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
  [string]: LoaderEntry,
};

// interfaces for `fs` defined using https://github.com/facebook/flow/blob/master/lib/node.js

interface ErrnoError extends Error {
  code?: string;
}

interface Stats {
  isDirectory(): boolean;
}

interface FS {
  stat(path: string, callback?: (err: ?ErrnoError, stats: Stats) => any): void;
  statSync(path: string): Stats;
  readFile(
    path: string,
    encoding: string,
    callback: (err: ?ErrnoError, data: string) => void
  ): void;
  readFileSync(path: string, encoding: string): string;
}
