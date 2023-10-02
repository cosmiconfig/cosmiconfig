/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export * from './types.js';

import os from 'os';
import { Explorer } from './Explorer.js';
import { ExplorerSync } from './ExplorerSync.js';
import {
  loadJs,
  loadJson,
  loadJsSync,
  loadTs,
  loadTsSync,
  loadYaml,
} from './loaders.js';
import {
  CosmiconfigResult,
  InternalOptions,
  InternalOptionsSync,
  Options,
  OptionsSync,
  PublicExplorer,
  PublicExplorerSync,
  TransformSync,
} from './types.js';
import { removeUndefinedValuesFromObject } from './util';

// this needs to be hardcoded, as this is intended for end users, who can't supply options at this point
export const metaSearchPlaces = [
  'package.json',
  '.config/config.json',
  '.config/config.yaml',
  '.config/config.yml',
  '.config/config.js',
  '.config/config.ts',
  '.config/config.cjs',
  '.config/config.mjs',
];

// do not allow mutation of default loaders. Make sure it is set inside options
export const defaultLoaders = Object.freeze({
  '.mjs': loadJs,
  '.cjs': loadJs,
  '.js': loadJs,
  '.ts': loadTs,
  '.json': loadJson,
  '.yaml': loadYaml,
  '.yml': loadYaml,
  noExt: loadYaml,
} as const);
export const defaultLoadersSync = Object.freeze({
  '.cjs': loadJsSync,
  '.js': loadJsSync,
  '.ts': loadTsSync,
  '.json': loadJson,
  '.yaml': loadYaml,
  '.yml': loadYaml,
  noExt: loadYaml,
} as const);

export function getDefaultSearchPlaces(moduleName: string): Array<string> {
  return [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.yaml`,
    `.${moduleName}rc.yml`,
    `.${moduleName}rc.js`,
    `.${moduleName}rc.ts`,
    `.${moduleName}rc.cjs`,
    `.${moduleName}rc.mjs`,
    `.config/${moduleName}rc`,
    `.config/${moduleName}rc.json`,
    `.config/${moduleName}rc.yaml`,
    `.config/${moduleName}rc.yml`,
    `.config/${moduleName}rc.js`,
    `.config/${moduleName}rc.ts`,
    `.config/${moduleName}rc.cjs`,
    `.config/${moduleName}rc.mjs`,
    `${moduleName}.config.js`,
    `${moduleName}.config.ts`,
    `${moduleName}.config.cjs`,
    `${moduleName}.config.mjs`,
  ];
}

export function getDefaultSearchPlacesSync(moduleName: string): Array<string> {
  return [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.yaml`,
    `.${moduleName}rc.yml`,
    `.${moduleName}rc.js`,
    `.${moduleName}rc.ts`,
    `.${moduleName}rc.cjs`,
    `.config/${moduleName}rc`,
    `.config/${moduleName}rc.json`,
    `.config/${moduleName}rc.yaml`,
    `.config/${moduleName}rc.yml`,
    `.config/${moduleName}rc.js`,
    `.config/${moduleName}rc.ts`,
    `.config/${moduleName}rc.cjs`,
    `${moduleName}.config.js`,
    `${moduleName}.config.ts`,
    `${moduleName}.config.cjs`,
  ];
}

const identity: TransformSync = function identity(x) {
  return x;
};

function getUserDefinedOptionsFromMetaConfig<
  T extends Options | OptionsSync,
>(): CosmiconfigResult {
  const metaExplorer = new ExplorerSync({
    packageProp: 'cosmiconfig',
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
  });
  const metaConfig = metaExplorer.search();

  if (!metaConfig) {
    return null;
  }

  if (metaConfig.config?.loaders) {
    throw new Error('Can not specify loaders in meta config file');
  }

  const overrideOptions: Partial<T> = {
    mergeSearchPlaces: true,
    ...(metaConfig.config ?? {}),
  };

  return {
    config: removeUndefinedValuesFromObject(overrideOptions) as Partial<T>,
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
>(moduleName: string, defaults: IntOpts, options: Readonly<Opts>): IntOpts {
  const userDefinedConfig = getUserDefinedOptionsFromMetaConfig<Opts>();

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

function mergeOptions(
  moduleName: string,
  options: Readonly<Options>,
): InternalOptions {
  const defaults = {
    packageProp: moduleName,
    searchPlaces: getDefaultSearchPlaces(moduleName),
    ignoreEmptySearchPlaces: true,
    stopDir: os.homedir(),
    cache: true,
    transform: identity,
    loaders: defaultLoaders,
    metaConfigFilePath: null,
    mergeImportArrays: true,
    mergeSearchPlaces: true,
  } satisfies InternalOptions;

  return mergeOptionsBase(moduleName, defaults, options);
}

function mergeOptionsSync(
  moduleName: string,
  options: Readonly<OptionsSync>,
): InternalOptionsSync {
  const defaults = {
    packageProp: moduleName,
    searchPlaces: getDefaultSearchPlacesSync(moduleName),
    ignoreEmptySearchPlaces: true,
    stopDir: os.homedir(),
    cache: true,
    transform: identity,
    loaders: defaultLoadersSync,
    metaConfigFilePath: null,
    mergeImportArrays: true,
    mergeSearchPlaces: true,
  } satisfies InternalOptionsSync;

  return mergeOptionsBase(moduleName, defaults, options);
}

export function cosmiconfig(
  moduleName: string,
  options: Readonly<Options> = {},
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
  options: Readonly<OptionsSync> = {},
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
