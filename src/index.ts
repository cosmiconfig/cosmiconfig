// @flow
'use strict';

import os = require('os');
import createExplorer = require('./createExplorer');
import loaders = require('./loaders');

export = cosmiconfig;

function cosmiconfig(
  moduleName?: string | null,
  options?: {
    packageProp?: string,
    loaders?: Object,
    searchPlaces?: Array<string>,
    ignoreEmptySearchPlaces?: boolean,
    stopDir?: string,
    cache?: boolean,
    transform?: (result: CosmiconfigResult) => CosmiconfigResult,
  }
) {
  moduleName = typeof moduleName === 'string' ? moduleName : '';
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
    }
  );

  return createExplorer(normalizedOptions);
}

// eslint-disable-next-line no-redeclare
namespace cosmiconfig {
  export type CosmiconfigResult = {
    config: any,
    filepath: string,
    isEmpty?: boolean,
  } | null;
}

cosmiconfig.loadJs = loaders.loadJs;
cosmiconfig.loadJson = loaders.loadJson;
cosmiconfig.loadYaml = loaders.loadYaml;

function normalizeLoaders(rawLoaders?: Object): Loaders {
  const defaults = {
    '.js': { sync: loaders.loadJs, async: loaders.loadJs },
    '.json': { sync: loaders.loadJson, async: loaders.loadJson },
    '.yaml': { sync: loaders.loadYaml, async: loaders.loadYaml },
    '.yml': { sync: loaders.loadYaml, async: loaders.loadYaml },
    noExt: { sync: loaders.loadYaml, async: loaders.loadYaml },
  };

  if (!rawLoaders) {
    return defaults;
  }

  return Object.keys(rawLoaders).reduce((result, ext) => {
    const entry = rawLoaders && rawLoaders[ext];
    if (typeof entry === 'function') {
      result[ext] = { sync: entry, async: entry };
    } else {
      result[ext] = entry;
    }
    return result;
  }, defaults);
}

function identity(x) {
  return x;
}
