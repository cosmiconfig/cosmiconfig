import { Options } from './index';

/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: define what a config is ?
// interface ResolvedConfig {
//   [key: string]: unknown;
// }
// type ConfigFn = (...params: any[]) => ResolvedConfig;
// type ConfigFnPromise = (...params: any[]) => Promise<ResolvedConfig>;
// type ConfigPromise = Promise<ResolvedConfig>;

// https://github.com/davidtheclark/cosmiconfig/issues/134
export type Config = any;
// | ResolvedConfig
// | ConfigFn
// | ConfigPromise
// | ConfigFnPromise;
/* eslint-enable */

type LoaderResult = Config | void;
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

export type CosmiconfigResult = {
  config: Config;
  filepath: string;
  isEmpty?: boolean;
} | null;

// These are the user options with defaults applied.
export interface ExplorerOptions extends Required<Options> {
  loaders: Loaders;
}

export type Cache = Map<string, CosmiconfigResult>;
