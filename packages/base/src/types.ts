import {
  CosmiconfigResult,
  LoadersSync,
  Options,
  OptionsSync,
} from '@cosmiconfig/types';

/**
 * public
 */
export interface MetaConfigOptions {
  globalConfigSearchPlaces: Array<string>;
  metaSearchPlaces: Array<string>;
  loaders: LoadersSync;
}

/**
 * @public
 */
export type DefaultOptions = Pick<
  Options,
  'globalConfigSearchPlaces' | 'searchPlaces' | 'loaders'
> & { metaSearchPlaces: Array<string> };

/**
 * @public
 */
export type DefaultOptionsSync = Pick<
  OptionsSync,
  'globalConfigSearchPlaces' | 'searchPlaces' | 'loaders'
> & { metaSearchPlaces: Array<string> };

/**
 * @internal
 */
export interface InternalOptions extends Options {
  applyPackagePropertyPathToConfiguration?: boolean;
  metaConfigFilePath: string | null;
  moduleName: string;
}

/**
 * @internal
 */
export interface InternalOptionsSync extends OptionsSync {
  applyPackagePropertyPathToConfiguration?: boolean;
  metaConfigFilePath: string | null;
  moduleName: string;
}

/**
 * @internal
 */
export type Cache = Map<string, CosmiconfigResult>;

/**
 * @internal
 */
export type AsyncCache = Map<string, Promise<CosmiconfigResult>>;

/**
 * @internal
 */
export interface DirToSearch {
  path: string;
  isGlobalConfig: boolean;
}
