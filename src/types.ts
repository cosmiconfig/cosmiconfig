import { Loader, LoaderSync, Options, OptionsSync } from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Config = any;

export type CosmiconfigResult = {
  config: Config;
  filepath: string;
  isEmpty?: boolean;
} | null;

export interface InternalOptions {
  usePackagePropInConfigFiles?: boolean;
}

// These are the user options with defaults applied, plus internal options possibly inferred from meta config
export interface ExplorerOptions extends Required<Options>, InternalOptions {}
export interface ExplorerOptionsSync
  extends Required<OptionsSync>,
    InternalOptions {}

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
