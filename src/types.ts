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

export interface LoaderEntry {
  sync?: SyncLoader;
  async?: AsyncLoader;
}

export interface Loaders {
  [key: string]: LoaderEntry;
}

// These are the user options with defaults applied.
export interface ExplorerOptions {
  stopDir: string;
  cache: boolean;
  transform: (cosmiconfigResult: CosmiconfigResult) => CosmiconfigResult;
  packageProp: string;
  loaders: Loaders;
  searchPlaces: Array<string>;
  ignoreEmptySearchPlaces: boolean;
}
