import { Options, LoaderAsync, LoaderSync } from './index';

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

export type Cache = Map<string, CosmiconfigResult>;
