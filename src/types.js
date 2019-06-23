// @flow

export type CosmiconfigResult = {
  config: any,
  filepath: string,
  isEmpty?: boolean,
} | null;

export type SyncLoader = (filepath: string, content: string) => Object | null;
export type AsyncLoader = (
  filepath: string,
  content: string,
) => Object | null | Promise<Object | null>;

export type LoaderEntry = {
  sync?: SyncLoader,
  async?: AsyncLoader,
};

export type Loaders = {
  [string]: LoaderEntry,
};

// These are the user options with defaults applied.
export type ExplorerOptions = {
  stopDir: string,
  cache: boolean,
  transform: CosmiconfigResult => CosmiconfigResult,
  packageProp: string,
  loaders: Loaders,
  searchPlaces: Array<string>,
  ignoreEmptySearchPlaces: boolean,
};
