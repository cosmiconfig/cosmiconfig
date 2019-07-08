import os from 'os';
import { createExplorer } from './createExplorer';
import * as loaders from './loaders';
import {
  AsyncLoader,
  CosmiconfigResult,
  ExplorerOptions,
  LoaderEntry,
  Loaders,
  SyncLoader,
} from './types';

interface RawLoaders {
  [key: string]: LoaderEntry | SyncLoader | AsyncLoader;
}

export interface Options {
  packageProp?: string;
  loaders?: RawLoaders;
  searchPlaces?: Array<string>;
  ignoreEmptySearchPlaces?: boolean;
  stopDir?: string;
  cache?: boolean;
  transform?: (cosmiconfigResult: CosmiconfigResult) => CosmiconfigResult;
}

function cosmiconfig(
  moduleName: string,
  options?: Options,
): ReturnType<typeof createExplorer> {
  options = options || {};
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
      result[ext] = { sync: entry, async: entry };
    } else {
      result[ext] = entry;
    }
    return result;
  }, defaults);
}

function identity<T>(x: T): T {
  return x;
}

export { cosmiconfig };
