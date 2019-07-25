import os from 'os';
import { createExplorer } from './createExplorer';
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

// cannot return a promise with sync methods
export type Transform = (
  CosmiconfigResult: CosmiconfigResult,
) => CosmiconfigResult | Promise<CosmiconfigResult>;

export interface Options {
  packageProp?: string;
  loaders?: RawLoaders;
  searchPlaces?: Array<string>;
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
