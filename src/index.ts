import os from 'os';
import { createExplorer as createExplorerAsync } from './createExplorer';
import { createExplorerSync } from './createExplorerSync';
import * as defaultLoaders from './loaders';
import {
  Config,
  CosmiconfigResult,
  ExplorerOptions,
  LoaderEntry,
  Loaders,
} from './types';

type LoaderResult = Config | null;
export type LoaderSync = (filepath: string, content: string) => LoaderResult;
export type LoaderAsync =
  | ((filepath: string, content: string) => Promise<LoaderResult>)
  | LoaderSync;

interface RawLoaders {
  [key: string]: LoaderEntry | LoaderSync | LoaderAsync;
}

export type TransformSync = (
  CosmiconfigResult: CosmiconfigResult,
) => CosmiconfigResult;

export type Transform =
  | ((CosmiconfigResult: CosmiconfigResult) => Promise<CosmiconfigResult>)
  | TransformSync;

interface OptionsBase {
  packageProp?: string;
  searchPlaces?: Array<string>;
  ignoreEmptySearchPlaces?: boolean;
  stopDir?: string;
  cache?: boolean;
}

export interface Options extends OptionsBase {
  loaders?: RawLoaders;
  transform?: Transform;
}

export interface OptionsSync extends OptionsBase {
  loaders?: RawLoaders;
  transform?: TransformSync;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function cosmiconfig(moduleName: string, options: Options = {}) {
  const defaults = {
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
  };
  const normalizedOptions: ExplorerOptions = {
    ...defaults,
    ...options,
    loaders: normalizeLoaders(options.loaders),
  };

  // @ts-ignore
  const syncExplorer = createExplorerSync(normalizedOptions);
  const asyncExplorer = createExplorerAsync(normalizedOptions);

  const createExplorer = {
    ...syncExplorer,
    ...asyncExplorer,
    clearLoadCache(): void {
      asyncExplorer.clearLoadCache();
      syncExplorer.clearLoadCache();
    },
    clearSearchCache(): void {
      asyncExplorer.clearSearchCache();
      syncExplorer.clearSearchCache();
    },
    clearCaches(): void {
      asyncExplorer.clearCaches();
      syncExplorer.clearCaches();
    },
  };

  return createExplorer;
}

function normalizeLoaders(rawLoaders?: RawLoaders): Loaders {
  const defaults: Loaders = {
    '.js': { sync: defaultLoaders.loadJs, async: defaultLoaders.loadJs },
    '.json': { sync: defaultLoaders.loadJson, async: defaultLoaders.loadJson },
    '.yaml': { sync: defaultLoaders.loadYaml, async: defaultLoaders.loadYaml },
    '.yml': { sync: defaultLoaders.loadYaml, async: defaultLoaders.loadYaml },
    noExt: { sync: defaultLoaders.loadYaml, async: defaultLoaders.loadYaml },
  };

  if (!rawLoaders) {
    return defaults;
  }

  return Object.keys(rawLoaders).reduce((result: Loaders, ext): Loaders => {
    const entry = rawLoaders && rawLoaders[ext];
    if (typeof entry === 'function') {
      // the sync loader can incorrectly be async here
      const sync: LoaderSync = entry;
      const async: LoaderAsync = entry;

      result[ext] = { sync, async };
    } else {
      result[ext] = entry;
    }
    return result;
  }, defaults);
}

const identity: Transform = function identity(x) {
  return x;
};

export { cosmiconfig, defaultLoaders };
