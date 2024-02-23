import {
  Options,
  OptionsSync,
  PublicExplorer,
  PublicExplorerSync,
  createPublicExplorer,
  createPublicExplorerSync,
} from '@cosmiconfig/core';
import {
  defaultLoaders,
  defaultLoadersSync,
  getDefaultSearchPlaces,
  getDefaultSearchPlacesSync,
  globalConfigSearchPlaces,
  globalConfigSearchPlacesSync,
  metaSearchPlaces,
} from './defaults';

export {
  defaultLoaders,
  defaultLoadersSync,
  getDefaultSearchPlaces,
  getDefaultSearchPlacesSync,
  globalConfigSearchPlaces,
  globalConfigSearchPlacesSync,
};

export type {
  CommonOptions,
  Config,
  CosmiconfigResult,
  Loader,
  LoaderResult,
  LoaderSync,
  Loaders,
  LoadersSync,
  Options,
  OptionsSync,
  PublicExplorer,
  PublicExplorerBase,
  PublicExplorerSync,
  SearchStrategy,
  Transform,
  TransformSync,
} from '@cosmiconfig/core';

export function cosmiconfig(
  moduleName: string,
  options: Readonly<Partial<Options>> = {},
): PublicExplorer {
  return createPublicExplorer(moduleName, options, {
    globalConfigSearchPlaces,
    metaSearchPlaces,
    loaders: defaultLoaders,
    searchPlaces: getDefaultSearchPlaces(moduleName),
  });
}

export function cosmiconfigSync(
  moduleName: string,
  options: Readonly<Partial<OptionsSync>> = {},
): PublicExplorerSync {
  return createPublicExplorerSync(moduleName, options, {
    globalConfigSearchPlaces: globalConfigSearchPlacesSync,
    metaSearchPlaces,
    loaders: defaultLoadersSync,
    searchPlaces: getDefaultSearchPlacesSync(moduleName),
  });
}
