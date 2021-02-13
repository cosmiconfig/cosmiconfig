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
export type LoaderSync = (
  filepath: string,
  content: string | null,
) => LoaderResult;
export type LoaderAsync = (
  filepath: string,
  content: string | null,
) => Promise<LoaderResult>;
export type Loader = LoaderAsync | LoaderSync;

export type Transform =
  | ((CosmiconfigResult: CosmiconfigResult) => Promise<CosmiconfigResult>)
  | TransformSync;

export type TransformSync = (
  CosmiconfigResult: CosmiconfigResult,
) => CosmiconfigResult;

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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function cosmiconfig(moduleName: string, options: Options = {}) {
  const normalizedOptions: ExplorerOptions = normalizeOptions(
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
  } as const;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function cosmiconfigSync(moduleName: string, options: OptionsSync = {}) {
  const normalizedOptions: ExplorerOptionsSync = normalizeOptionsSync(
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
  } as const;
}

// do not allow mutation of default loaders. Make sure it is set inside options
const defaultLoaders = Object.freeze({
  '.mjs': loaders.loadJs,
  '.cjs': loaders.loadJs,
  '.js': loaders.loadJs,
  '.json': loaders.loadJson,
  '.yaml': loaders.loadYaml,
  '.yml': loaders.loadYaml,
  noExt: loaders.loadYaml,
} as const);
const defaultLoadersSync = Object.freeze({
  '.cjs': loaders.loadJsSync,
  '.js': loaders.loadJsSync,
  '.json': loaders.loadJson,
  '.yaml': loaders.loadYaml,
  '.yml': loaders.loadYaml,
  noExt: loaders.loadYaml,
} as const);

const identity: TransformSync = function identity(x) {
  return x;
};

function normalizeOptions(
  moduleName: string,
  options: Options,
): ExplorerOptions {
  const defaults: ExplorerOptions = {
    packageProp: moduleName,
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `.${moduleName}rc.mjs`,
      `.${moduleName}rc.cjs`,
      `${moduleName}.config.js`,
      `${moduleName}.config.mjs`,
      `${moduleName}.config.cjs`,
    ].filter(Boolean),
    ignoreEmptySearchPlaces: true,
    stopDir: os.homedir(),
    cache: true,
    transform: identity,
    loaders: defaultLoaders,
  };

  const normalizedOptions: ExplorerOptions = {
    ...defaults,
    ...options,
    loaders: {
      ...defaults.loaders,
      ...options.loaders,
    },
  };

  return normalizedOptions;
}

function normalizeOptionsSync(
  moduleName: string,
  options: OptionsSync,
): ExplorerOptionsSync {
  const defaults: ExplorerOptionsSync = {
    packageProp: moduleName,
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `.${moduleName}rc.cjs`,
      `${moduleName}.config.js`,
      `${moduleName}.config.cjs`,
    ],
    ignoreEmptySearchPlaces: true,
    stopDir: os.homedir(),
    cache: true,
    transform: identity,
    loaders: defaultLoadersSync,
  };

  const normalizedOptions: ExplorerOptionsSync = {
    ...defaults,
    ...options,
    loaders: {
      ...defaults.loaders,
      ...options.loaders,
    },
  };

  return normalizedOptions;
}

export { cosmiconfig, cosmiconfigSync, defaultLoaders, defaultLoadersSync };
