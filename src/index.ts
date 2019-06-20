import os from 'os';
import {
  CosmiconfigResult,
  ExplorerOptions,
  Loaders,
  LoaderEntry,
  SyncLoader,
  AsyncLoader,
} from './types';
import { createExplorer } from './createExplorer';
import * as loaders from './loaders';

function identity<T>(x: T): T {
  return x;
}

// TODO: can it be undefined to disable a loader?
interface RawLoaders {
  [key: string]: LoaderEntry | SyncLoader | AsyncLoader;
}

function normalizeLoaders(rawLoaders?: RawLoaders): Loaders {
  const defaultLoaders: Loaders = {
    '.js': { sync: loaders.loadJs, async: loaders.loadJs },
    '.json': { sync: loaders.loadJson, async: loaders.loadJson },
    '.yaml': { sync: loaders.loadYaml, async: loaders.loadYaml },
    '.yml': { sync: loaders.loadYaml, async: loaders.loadYaml },
    noExt: { sync: loaders.loadYaml, async: loaders.loadYaml },
  };

  if (!rawLoaders) {
    return defaultLoaders;
  }

  const result = Object.keys(rawLoaders).reduce(
    (result: Loaders, ext: string): Loaders => {
      const entry = rawLoaders && rawLoaders[ext];

      if (typeof entry === 'function') {
        // TODO: sync loader can be async here
        // TODO: direct remove function support and specify both async and sync?
        const sync: SyncLoader = entry;
        const async: AsyncLoader = entry;

        result[ext] = { sync, async };
      } else {
        result[ext] = entry;
      }

      return result;
    },
    defaultLoaders,
  );

  return result;
}

// TODO: this can be async but no way to type it and have sync functions be happy.
// TODO: split sync/async options like loaders?
export type Transform = (
  CosmiconfigResult: CosmiconfigResult,
) => CosmiconfigResult;
// | Promise<CosmiconfigResult>;

export interface Options {
  packageProp?: string;
  loaders?: RawLoaders;
  searchPlaces?: string[];
  ignoreEmptySearchPlaces?: boolean;
  stopDir?: string;
  cache?: boolean;
  transform?: Transform;
}

function cosmiconfig(
  moduleName: string,
  options: Options = {},
): ReturnType<typeof createExplorer> {
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

  return createExplorer(normalizedOptions);
}

cosmiconfig.loadJs = loaders.loadJs;
cosmiconfig.loadJson = loaders.loadJson;
cosmiconfig.loadYaml = loaders.loadYaml;

export { cosmiconfig };
