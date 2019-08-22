import { Options, OptionsSync, LoaderAsync, LoaderSync } from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Config = any;

export type CosmiconfigResult = {
  config: Config;
  filepath: string;
  isEmpty?: boolean;
} | null;

export interface LoaderEntry {
  sync?: LoaderSync;
  async?: LoaderAsync;
}

export interface Loaders {
  [key: string]: LoaderEntry;
}

// These are the user options with defaults applied.
export interface ExplorerOptions extends Required<Options> {
  loaders: Loaders;
}

// These are the user options with defaults applied.
export interface ExplorerOptionsSync extends Required<OptionsSync> {
  loaders: Loaders;
}

export type Cache = Map<string, CosmiconfigResult>;

// An object value represents a config object.
// null represents that the loader did not find anything relevant.
// undefined represents that the loader found something relevant
// but it was empty.
export type LoadedFileContent = Config | null | undefined;
