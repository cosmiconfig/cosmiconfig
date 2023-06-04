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
export type Loader =
  | ((filepath: string, content: string) => Promise<LoaderResult>)
  | LoaderSync;
export type LoaderSync = (filepath: string, content: string) => LoaderResult;

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
  mergeImportArrays?: boolean;
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
  '.config.mjs',
];

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

function replaceMetaPlaceholders(
  paths: Array<string>,
  moduleName: string,
): Array<string> {
  return paths.map((path) => path.replace('{name}', moduleName));
}

function getExplorerOptions<T extends Options | OptionsSync>(
  moduleName: string,
  options: T,
): T {
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
    mergeImportArrays: false,
  });
  const metaConfig = metaExplorer.searchSync();

  if (!metaConfig) {
    return options;
  }

  if (metaConfig.config?.loaders) {
    throw new Error('Can not specify loaders in meta config file');
  }

  const overrideOptions = metaConfig.config ?? {};

  if (overrideOptions.searchPlaces) {
    overrideOptions.searchPlaces = replaceMetaPlaceholders(
      overrideOptions.searchPlaces,
      moduleName,
    );
  }

  overrideOptions.metaConfigFilePath = metaConfig.filepath;

  return { ...options, ...overrideOptions };
}

function cosmiconfig(
  moduleName: string,
  options: Options = {},
): PublicExplorer {
  const explorerOptions = getExplorerOptions(moduleName, options);

  const normalizedOptions: ExplorerOptions = normalizeOptions(
    moduleName,
    explorerOptions,
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
  const explorerOptions = getExplorerOptions(moduleName, options);

  const normalizedOptions: ExplorerOptionsSync = normalizeOptionsSync(
    moduleName,
    explorerOptions,
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
      `.${moduleName}rc.cjs`,
      `.${moduleName}rc.mjs`,
      `.config/${moduleName}rc`,
      `.config/${moduleName}rc.json`,
      `.config/${moduleName}rc.yaml`,
      `.config/${moduleName}rc.yml`,
      `.config/${moduleName}rc.js`,
      `.config/${moduleName}rc.cjs`,
      `.config/${moduleName}rc.mjs`,
      `${moduleName}.config.js`,
      `${moduleName}.config.cjs`,
      `${moduleName}.config.mjs`,
    ].filter(Boolean),
    ignoreEmptySearchPlaces: true,
    mergeImportArrays: true,
    stopDir: os.homedir(),
    cache: true,
    transform: identity,
    loaders: defaultLoaders,
    metaConfigFilePath: null,
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
    loaders: defaultLoadersSync,
    metaConfigFilePath: null,
    mergeImportArrays: true,
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
