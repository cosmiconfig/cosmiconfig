import { Loader, LoaderSync, Options, OptionsSync } from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Config = any;

export type CosmiconfigResult = {
  config: Config;
  filepath: string;
  isEmpty?: boolean;
} | null;

// These are the user options with defaults applied.
/* eslint-disable @typescript-eslint/no-empty-interface */
export interface ExplorerOptions extends Required<Options> {}
export interface ExplorerOptionsSync extends Required<OptionsSync> {}
/* eslint-enable @typescript-eslint/no-empty-interface */

export type Cache = Map<string, CosmiconfigResult>;

// An object value represents a config object.
// null represents that the loader did not find anything relevant.
// undefined represents that the loader found something relevant
// but it was empty.
export type LoadedFileContent = Config | null | undefined;

export interface Loaders {
  [key: string]: Loader;
}

export interface LoadersSync {
  [key: string]: LoaderSync;
}
