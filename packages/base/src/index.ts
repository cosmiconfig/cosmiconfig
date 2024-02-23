import {
  CosmiconfigResult,
  OptionsSync,
  PublicExplorer,
  PublicExplorerSync,
  TransformSync,
  Options,
} from '@cosmiconfig/types';
import { Explorer } from './Explorer';
import { ExplorerSync } from './ExplorerSync';
import {
  InternalOptions,
  InternalOptionsSync,
  DefaultOptions,
  DefaultOptionsSync,
} from './types';
import { removeUndefinedValuesFromObject } from './util';

const identity: TransformSync = function identity(x) {
  return x;
};

function getUserDefinedOptionsFromMetaConfig(
  defaultOptions: Readonly<DefaultOptions>,
): CosmiconfigResult {
  const metaExplorer = new ExplorerSync({
    moduleName: 'cosmiconfig',
    stopDir: process.cwd(),
    globalConfigSearchPlaces: defaultOptions.globalConfigSearchPlaces,
    searchPlaces: defaultOptions.metaSearchPlaces,
    ignoreEmptySearchPlaces: false,
    applyPackagePropertyPathToConfiguration: true,
    loaders: defaultOptions.loaders,
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
  defaultOptions: Readonly<DefaultOptions> | Readonly<DefaultOptionsSync>,
): IntOpts {
  const userDefinedConfig = getUserDefinedOptionsFromMetaConfig(defaultOptions);

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
  defaultOptions: Readonly<DefaultOptions>,
): InternalOptions {
  validateOptions(options);
  const defaults = {
    moduleName,
    globalConfigSearchPlaces: defaultOptions.globalConfigSearchPlaces,
    searchPlaces: defaultOptions.searchPlaces,
    ignoreEmptySearchPlaces: true,
    cache: true,
    transform: identity,
    loaders: defaultOptions.loaders,
    metaConfigFilePath: null,
    mergeImportArrays: true,
    mergeSearchPlaces: true,
    searchStrategy: options.stopDir ? 'global' : 'none',
  } satisfies InternalOptions;

  return mergeOptionsBase(moduleName, defaults, options, defaultOptions);
}

function mergeOptionsSync(
  moduleName: string,
  options: Readonly<Partial<OptionsSync>>,
  defaultOptions: Readonly<DefaultOptionsSync>,
): InternalOptionsSync {
  validateOptions(options);
  const defaults = {
    moduleName,
    globalConfigSearchPlaces: defaultOptions.globalConfigSearchPlaces,
    searchPlaces: defaultOptions.searchPlaces,
    ignoreEmptySearchPlaces: true,
    cache: true,
    transform: identity,
    loaders: defaultOptions.loaders,
    metaConfigFilePath: null,
    mergeImportArrays: true,
    mergeSearchPlaces: true,
    searchStrategy: options.stopDir ? 'global' : 'none',
  } satisfies InternalOptionsSync;

  return mergeOptionsBase(moduleName, defaults, options, defaultOptions);
}

export function createPublicExplorer(
  moduleName: string,
  options: Readonly<Partial<Options>>,
  defaults: Readonly<DefaultOptions>,
): PublicExplorer {
  const normalizedOptions = mergeOptions(moduleName, options, defaults);
  const explorer = new Explorer(normalizedOptions);
  return {
    search: explorer.search.bind(explorer),
    load: explorer.load.bind(explorer),
    clearLoadCache: explorer.clearLoadCache.bind(explorer),
    clearSearchCache: explorer.clearSearchCache.bind(explorer),
    clearCaches: explorer.clearCaches.bind(explorer),
  };
}

export function createPublicExplorerSync(
  moduleName: string,
  options: Readonly<Partial<OptionsSync>>,
  defaultOptions: Readonly<DefaultOptionsSync>,
): PublicExplorerSync {
  const normalizedOptions = mergeOptionsSync(
    moduleName,
    options,
    defaultOptions,
  );
  const explorerSync = new ExplorerSync(normalizedOptions);
  return {
    search: explorerSync.search.bind(explorerSync),
    load: explorerSync.load.bind(explorerSync),
    clearLoadCache: explorerSync.clearLoadCache.bind(explorerSync),
    clearSearchCache: explorerSync.clearSearchCache.bind(explorerSync),
    clearCaches: explorerSync.clearCaches.bind(explorerSync),
  };
}

export { DefaultOptions, DefaultOptionsSync };
