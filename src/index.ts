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

type ExplorerLike = Readonly<Explorer>;
type TypedTransform<T> =
  | ((CosmiconfigResult: CosmiconfigResult) => Promise<T>)
  | TypedTransformSync<T>;
interface TypedOptions<T> extends Omit<Options, 'transform'> {
  transform: TypedTransform<T>;
}
interface TypedExplorer<T> extends Omit<ExplorerLike, 'search' | 'load'> {
  readonly search: (searchFrom?: string) => Promise<T>;
  readonly load: (filepath: string) => Promise<T>;
}

function cosmiconfig<T>(
  moduleName: string,
  options: TypedOptions<T>,
): TypedExplorer<T>;
function cosmiconfig(moduleName: string, options?: Options): ExplorerLike;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function cosmiconfig(moduleName: string, options: Options = {}): ExplorerLike {
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

interface ExplorerSyncLike
  extends Omit<ExplorerSync, 'searchSync' | 'loadSync'> {
  readonly search: ExplorerSync['searchSync'];
  readonly load: ExplorerSync['loadSync'];
}

type TypedTransformSync<T> = (CosmiconfigResult: CosmiconfigResult) => T;
interface TypedOptionsSync<T> extends Omit<Options, 'transform'> {
  transform: TypedTransformSync<T>;
}
interface TypedExplorerSync<T>
  extends Omit<ExplorerSyncLike, 'search' | 'load'> {
  search(searchFrom?: string): T;
  load(filepath: string): T;
}

function cosmiconfigSync<T>(
  moduleName: string,
  options?: TypedOptionsSync<T>,
): TypedExplorerSync<T>;
function cosmiconfigSync(
  moduleName: string,
  options?: OptionsSync,
): ExplorerSyncLike;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function cosmiconfigSync(moduleName: string, options: OptionsSync = {}) {
  const normalizedOptions: ExplorerOptionsSync = normalizeOptions(
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
  '.js': loaders.loadJs,
  '.json': loaders.loadJson,
  '.yaml': loaders.loadYaml,
  '.yml': loaders.loadYaml,
  noExt: loaders.loadYaml,
} as const);

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
    loaders: defaultLoaders,
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
