import {
  defaultLoaders,
  defaultLoadersSync,
  getDefaultSearchPlaces,
  getDefaultSearchPlacesSync,
  metaSearchPlaces,
  globalConfigSearchPlaces,
  globalConfigSearchPlacesSync,
} from './defaults';
import { Explorer } from './Explorer.js';
import { ExplorerSync } from './ExplorerSync.js';
import {
  CommonOptions,
  Config,
  CosmiconfigResult,
  InternalOptions,
  InternalOptionsSync,
  Loader,
  LoaderResult,
  Loaders,
  LoadersSync,
  LoaderSync,
  Options,
  OptionsSync,
  PublicExplorer,
  PublicExplorerBase,
  PublicExplorerSync,
  SearchStrategy,
  Transform,
  TransformSync,
} from './types.js';
import { removeUndefinedValuesFromObject } from './util';

const identity: TransformSync = function identity(x) {
  return x;
};

function getUserDefinedOptionsFromMetaConfig(): CosmiconfigResult {
  const metaExplorer = new ExplorerSync({
    moduleName: 'cosmiconfig',
    stopDir: process.cwd(),
    searchPlaces: metaSearchPlaces,
    ignoreEmptySearchPlaces: false,
    applyPackagePropertyPathToConfiguration: true,
    loaders: defaultLoaders,
    transform: identity,
    cache: true,
    metaConfigFilePath: null,
    mergeImportArrays: true,
    mergeSearchPlaces: true,
    searchStrategy: 'none',
  });
  const metaConfig = metaExplorer.search();

  if (!metaConfig) {
    return null;
  }

  if (metaConfig.config?.loaders) {
    throw new Error('Can not specify loaders in meta config file');
  }

  if (metaConfig.config?.searchStrategy) {
    throw new Error('Can not specify searchStrategy in meta config file');
  }

  const overrideOptions: Partial<Options | OptionsSync> = {
    mergeSearchPlaces: true,
    ...(metaConfig.config ?? {}),
  };

  return {
    config: removeUndefinedValuesFromObject(overrideOptions) as Partial<
      Options | OptionsSync
    >,
    filepath: metaConfig.filepath,
  };
}

function getResolvedSearchPlaces<T extends Options | OptionsSync>(
  moduleName: string,
  toolDefinedSearchPlaces: Array<string>,
  userConfiguredOptions: T,
): Array<string> {
  const userConfiguredSearchPlaces = userConfiguredOptions.searchPlaces?.map(
    (path: string) => path.replace('{name}', moduleName),
  );
  if (userConfiguredOptions.mergeSearchPlaces) {
    return [...(userConfiguredSearchPlaces ?? []), ...toolDefinedSearchPlaces];
  }

  return (
    userConfiguredSearchPlaces ??
    /* istanbul ignore next */ toolDefinedSearchPlaces
  );
}

function mergeOptionsBase<
  IntOpts extends InternalOptions | InternalOptionsSync,
  Opts extends Options | OptionsSync,
>(
  moduleName: string,
  defaults: IntOpts,
  options: Readonly<Partial<Opts>>,
): IntOpts {
  const userDefinedConfig = getUserDefinedOptionsFromMetaConfig();

  if (!userDefinedConfig) {
    return {
      ...defaults,
      ...removeUndefinedValuesFromObject(options),
      loaders: {
        ...defaults.loaders,
        ...options.loaders,
      },
    };
  }

  const userConfiguredOptions = userDefinedConfig.config as Readonly<Opts>;

  const toolDefinedSearchPlaces = options.searchPlaces ?? defaults.searchPlaces;

  return {
    ...defaults,
    ...removeUndefinedValuesFromObject(options),
    metaConfigFilePath: userDefinedConfig.filepath,
    ...userConfiguredOptions,
    searchPlaces: getResolvedSearchPlaces(
      moduleName,
      toolDefinedSearchPlaces,
      userConfiguredOptions,
    ),
    loaders: {
      ...defaults.loaders,
      ...options.loaders,
    },
  };
}

function validateOptions(
  options: Readonly<Partial<Options | OptionsSync>>,
): void {
  if (
    options.searchStrategy != null &&
    options.searchStrategy !== 'global' &&
    options.stopDir
  ) {
    throw new Error(
      'Can not supply `stopDir` option with `searchStrategy` other than "global"',
    );
  }
}

function mergeOptions(
  moduleName: string,
  options: Readonly<Partial<Options>>,
): InternalOptions {
  validateOptions(options);
  const defaults = {
    moduleName,
    searchPlaces: getDefaultSearchPlaces(moduleName),
    ignoreEmptySearchPlaces: true,
    cache: true,
    transform: identity,
    loaders: defaultLoaders,
    metaConfigFilePath: null,
    mergeImportArrays: true,
    mergeSearchPlaces: true,
    searchStrategy: options.stopDir ? 'global' : 'none',
  } satisfies InternalOptions;

  return mergeOptionsBase(moduleName, defaults, options);
}

function mergeOptionsSync(
  moduleName: string,
  options: Readonly<Partial<OptionsSync>>,
): InternalOptionsSync {
  validateOptions(options);
  const defaults = {
    moduleName,
    searchPlaces: getDefaultSearchPlacesSync(moduleName),
    ignoreEmptySearchPlaces: true,
    cache: true,
    transform: identity,
    loaders: defaultLoadersSync,
    metaConfigFilePath: null,
    mergeImportArrays: true,
    mergeSearchPlaces: true,
    searchStrategy: options.stopDir ? 'global' : 'none',
  } satisfies InternalOptionsSync;

  return mergeOptionsBase(moduleName, defaults, options);
}

export function cosmiconfig(
  moduleName: string,
  options: Readonly<Partial<Options>> = {},
): PublicExplorer {
  const normalizedOptions = mergeOptions(moduleName, options);
  const explorer = new Explorer(normalizedOptions);
  return {
    search: explorer.search.bind(explorer),
    load: explorer.load.bind(explorer),
    clearLoadCache: explorer.clearLoadCache.bind(explorer),
    clearSearchCache: explorer.clearSearchCache.bind(explorer),
    clearCaches: explorer.clearCaches.bind(explorer),
  };
}

export function cosmiconfigSync(
  moduleName: string,
  options: Readonly<Partial<OptionsSync>> = {},
): PublicExplorerSync {
  const normalizedOptions = mergeOptionsSync(moduleName, options);
  const explorerSync = new ExplorerSync(normalizedOptions);
  return {
    search: explorerSync.search.bind(explorerSync),
    load: explorerSync.load.bind(explorerSync),
    clearLoadCache: explorerSync.clearLoadCache.bind(explorerSync),
    clearSearchCache: explorerSync.clearSearchCache.bind(explorerSync),
    clearCaches: explorerSync.clearCaches.bind(explorerSync),
  };
}

export {
  Config,
  CosmiconfigResult,
  LoaderResult,
  Loader,
  Loaders,
  LoaderSync,
  LoadersSync,
  Transform,
  TransformSync,
  SearchStrategy,
  CommonOptions,
  Options,
  OptionsSync,
  PublicExplorerBase,
  PublicExplorer,
  PublicExplorerSync,
  getDefaultSearchPlaces,
  getDefaultSearchPlacesSync,
  globalConfigSearchPlaces,
  globalConfigSearchPlacesSync,
};
