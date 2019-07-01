// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Config = any;

export type CosmiconfigResult = {
  config: Config;
  filepath: string;
  isEmpty?: boolean;
} | null;

type LoaderResult = Config | null;
export type SyncLoader = (filepath: string, content: string) => LoaderResult;
export type AsyncLoader =
  | ((filepath: string, content: string) => Promise<LoaderResult>)
  | SyncLoader;

export type LoaderEntry = {
  sync?: SyncLoader;
  async?: AsyncLoader;
};

export type Loaders = {
  [key: string]: LoaderEntry;
};

// These are the user options with defaults applied.
export type ExplorerOptions = {
  stopDir: string;
  cache: boolean;
  transform: (cosmiconfigResult: CosmiconfigResult) => CosmiconfigResult;
  packageProp: string;
  loaders: Loaders;
  searchPlaces: Array<string>;
  ignoreEmptySearchPlaces: boolean;
};
