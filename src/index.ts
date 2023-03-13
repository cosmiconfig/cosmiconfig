/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import os from 'os';
import { Explorer } from './Explorer';
import { ExplorerSync } from './ExplorerSync';
import { loaders } from './loaders';
import {
  Config,
  CosmiconfigResult,
  ExplorerOptions,
  ExplorerOptionsSync,
  Loaders,
  LoadersSync,
} from './types';

type LoaderResult = Config | null;
export type LoaderSync = (filepath: string, content: string) => LoaderResult;
export type Loader =
  | ((filepath: string, content: string) => Promise<LoaderResult>)
  | LoaderSync;

export type TransformSync = (
  CosmiconfigResult: CosmiconfigResult,
) => CosmiconfigResult;
export type Transform =
  | ((CosmiconfigResult: CosmiconfigResult) => Promise<CosmiconfigResult>)
  | TransformSync;

interface OptionsBase {
  packageProp?: string | Array<string>;
  searchPlaces?: Array<string>;
  ignoreEmptySearchPlaces?: boolean;
  stopDir?: string;
  cache?: boolean;
}

export interface Options extends OptionsBase {
  loaders?: Loaders;
  transform?: Transform;
}

export interface OptionsSync extends OptionsBase {
  loaders?: LoadersSync;
  transform?: TransformSync;
}

export interface PublicExplorerBase {
  clearLoadCache: () => void;
  clearSearchCache: () => void;
  clearCaches: () => void;
}

export interface PublicExplorer extends PublicExplorerBase {
  search: (searchFrom?: string) => Promise<CosmiconfigResult>;
  load: (filepath: string) => Promise<CosmiconfigResult>;
}

export interface PublicExplorerSync extends PublicExplorerBase {
  search: (searchFrom?: string) => CosmiconfigResult;
  load: (filepath: string) => CosmiconfigResult;
}

// this needs to be hardcoded, as this is intended for end users, who can't supply options at this point
export const metaSearchPlaces = [
  'package.json',
  '.config.json',
  '.config.yaml',
  '.config.yml',
  '.config.js',
  '.config.cjs',
];

// do not allow mutation of default loaders. Make sure it is set inside options
const defaultLoaders = Object.freeze({
  '.cjs': loaders.loadJs,
  '.js': loaders.loadJs,
  '.json': loaders.loadJson,
  '.yaml': loaders.loadYaml,
  '.yml': loaders.loadYaml,
  noExt: loaders.loadYaml,
} as const);

const identity: TransformSync = function identity(x) {
  return x;
};

function replaceMetaPlaceholders(
  paths: Array<string>,
  moduleName: string,
): Array<string> {
  return paths.map((path) => path.replace('{name}', moduleName));
}

function getExplorerOptions(
  moduleName: string,
  options: OptionsSync,
): ExplorerOptionsSync;
function getExplorerOptions(
  moduleName: string,
  options: Options,
): ExplorerOptions;
function getExplorerOptions(
  moduleName: string,
  options: Options | OptionsSync,
): ExplorerOptions | ExplorerOptionsSync {
  const metaExplorer = new ExplorerSync({
    packageProp: 'cosmiconfig',
    stopDir: process.cwd(),
    searchPlaces: metaSearchPlaces,
    ignoreEmptySearchPlaces: false,
    usePackagePropInConfigFiles: true,
    loaders: defaultLoaders,
    transform: identity,
    cache: true,
    metaConfigFilePath: null,
  });
  const metaConfig = metaExplorer.searchSync();

  if (!metaConfig) {
    return normalizeOptions(moduleName, options);
  }

  const config = metaConfig.config ?? {};

  if (config.loaders) {
    throw new Error('Can not specify loaders in meta config file');
  }

  if (config.searchPlaces) {
    config.searchPlaces = replaceMetaPlaceholders(
      config.searchPlaces,
      moduleName,
    );
  }

  config.metaConfigFilePath = metaConfig.filepath;

  return normalizeOptions(moduleName, config, false);
}

function cosmiconfig(
  moduleName: string,
  options: Options = {},
): PublicExplorer {
  const normalizedOptions: ExplorerOptions = getExplorerOptions(
    moduleName,
    options,
  );

  const explorer = new Explorer(normalizedOptions);

  return {
    search: explorer.search.bind(explorer),
    load: explorer.load.bind(explorer),
    clearLoadCache: explorer.clearLoadCache.bind(explorer),
    clearSearchCache: explorer.clearSearchCache.bind(explorer),
    clearCaches: explorer.clearCaches.bind(explorer),
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function cosmiconfigSync(
  moduleName: string,
  options: OptionsSync = {},
): PublicExplorerSync {
  const normalizedOptions: ExplorerOptionsSync = getExplorerOptions(
    moduleName,
    options,
  );

  const explorerSync = new ExplorerSync(normalizedOptions);

  return {
    search: explorerSync.searchSync.bind(explorerSync),
    load: explorerSync.loadSync.bind(explorerSync),
    clearLoadCache: explorerSync.clearLoadCache.bind(explorerSync),
    clearSearchCache: explorerSync.clearSearchCache.bind(explorerSync),
    clearCaches: explorerSync.clearCaches.bind(explorerSync),
  };
}

function normalizeOptions(
  moduleName: string,
  options: OptionsSync,
  mergeLoaders?: boolean,
): ExplorerOptionsSync;
function normalizeOptions(
  moduleName: string,
  options: Options,
  mergeLoaders?: boolean,
): ExplorerOptions;
function normalizeOptions(
  moduleName: string,
  options: Options | OptionsSync,
  mergeLoaders = true,
): ExplorerOptions | ExplorerOptionsSync {
  const defaults: ExplorerOptions | ExplorerOptionsSync = {
    packageProp: moduleName,
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `.${moduleName}rc.cjs`,
      `.config/${moduleName}rc`,
      `.config/${moduleName}rc.json`,
      `.config/${moduleName}rc.yaml`,
      `.config/${moduleName}rc.yml`,
      `.config/${moduleName}rc.js`,
      `.config/${moduleName}rc.cjs`,
      `${moduleName}.config.js`,
      `${moduleName}.config.cjs`,
    ],
    ignoreEmptySearchPlaces: true,
    stopDir: os.homedir(),
    cache: true,
    transform: identity,
    loaders: defaultLoaders,
    metaConfigFilePath: null,
  };

  let loaders = {
    ...defaults.loaders,
  };

  if (options.loaders) {
    // to be used for the upcoming loaders-in-config
    /* istanbul ignore next */
    if (mergeLoaders) {
      Object.assign(loaders, options.loaders);
    } else {
      loaders = {
        ...options.loaders,
      };
    }
  }

  return {
    ...defaults,
    ...options,
    loaders,
  };
}

export { cosmiconfig, cosmiconfigSync, defaultLoaders };
