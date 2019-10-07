import os from 'os';
import { createExplorer } from './Explorer';
import { createExplorerSync } from './ExplorerSync';
import { loaders as defaultLoaders } from './loaders';
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
  packageProp?: string;
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

  const asyncExplorer = createExplorer(normalizedOptions);

  return asyncExplorer;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function cosmiconfigSync(moduleName: string, options: OptionsSync = {}) {
  const normalizedOptions: ExplorerOptionsSync = normalizeOptions(
    moduleName,
    options,
  );

  const syncExplorer = createExplorerSync(normalizedOptions);

  return syncExplorer;
}

function normalizeOptions(
  moduleName: string,
  options: OptionsSync,
): ExplorerOptionsSync;
function normalizeOptions(
  moduleName: string,
  options: Options,
): ExplorerOptions;
function normalizeOptions(
  moduleName: string,
  options: Options | OptionsSync,
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
      `${moduleName}.config.js`,
    ],
    ignoreEmptySearchPlaces: true,
    stopDir: os.homedir(),
    cache: true,
    transform: identity,
    loaders: {
      '.js': defaultLoaders.loadJs,
      '.json': defaultLoaders.loadJson,
      '.yaml': defaultLoaders.loadYaml,
      '.yml': defaultLoaders.loadYaml,
      noExt: defaultLoaders.loadYaml,
    },
  };

  const normalizedOptions: ExplorerOptions | ExplorerOptionsSync = {
    ...defaults,
    ...options,
    loaders: {
      ...defaults.loaders,
      ...options.loaders,
    },
  };

  return normalizedOptions;
}

const identity: TransformSync = function identity(x) {
  return x;
};

export { cosmiconfig, cosmiconfigSync, defaultLoaders };
