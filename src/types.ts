import { Loader, LoaderSync, Options, OptionsSync } from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Config = any;

export type CosmiconfigResult = {
  config: Config;
  filepath: string;
  isEmpty?: boolean;
} | null;

export interface InternalOptions {
  applyPackagePropertyPathToConfiguration?: boolean;
  metaConfigFilePath: string | null;
}

// These are the user options with defaults applied, plus internal options possibly inferred from meta config
export interface ExplorerOptions extends Required<Options>, InternalOptions {}

export interface ExplorerOptionsSync
  extends Required<OptionsSync>,
    InternalOptions {}

export type Cache = Map<string, CosmiconfigResult>;
export type AsyncCache = Map<string, Promise<CosmiconfigResult>>;

export interface Loaders {
  [key: string]: Loader;
}

export interface LoadersSync {
  [key: string]: LoaderSync;
}
