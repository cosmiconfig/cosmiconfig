import os from 'os';
import { createExplorer } from './createExplorer';
import * as loaders from './loaders';
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
  const normalizedOptions: ExplorerOptions = Object.assign(
    {},
    defaults,
    options,
    {
      loaders: normalizeLoaders(options.loaders),
    },
  );

  return createExplorer(normalizedOptions);
}

cosmiconfig.loadJs = loaders.loadJs;
cosmiconfig.loadJson = loaders.loadJson;
cosmiconfig.loadYaml = loaders.loadYaml;

function normalizeLoaders(rawLoaders?: RawLoaders): Loaders {
  const defaults: Loaders = {
    '.js': { sync: loaders.loadJs, async: loaders.loadJs },
    '.json': { sync: loaders.loadJson, async: loaders.loadJson },
    '.yaml': { sync: loaders.loadYaml, async: loaders.loadYaml },
    '.yml': { sync: loaders.loadYaml, async: loaders.loadYaml },
    noExt: { sync: loaders.loadYaml, async: loaders.loadYaml },
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

export { cosmiconfig };
