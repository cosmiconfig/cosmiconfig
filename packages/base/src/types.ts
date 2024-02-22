import { Options, OptionsSync, CosmiconfigResult } from '@cosmiconfig/types';

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
