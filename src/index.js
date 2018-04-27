// @flow
'use strict';

const os = require('os');
const createExplorer = require('./createExplorer');
const loaders = require('./loaders');

module.exports = cosmiconfig;

function cosmiconfig(
  moduleName: string,
  options: {
    packageProp?: string,
    loaders?: Loaders,
    searchPlaces?: Array<string>,
    ignoreEmptySearchPlaces?: boolean,
    stopDir?: string,
    cache?: boolean,
    transform?: CosmiconfigResult => CosmiconfigResult,
  }
) {
  options = options || {};
  const defaults = {
    packageProp: moduleName,
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
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

cosmiconfig.loadJs = loaders.loadJs;
cosmiconfig.loadJson = loaders.loadJson;
cosmiconfig.loadYaml = loaders.loadYaml;

function normalizeLoaders(rawLoaders: ?Loaders): Loaders {
  return Object.assign(
    {
      '.js': loaders.loadJs,
      '.json': loaders.loadJson,
      '.yaml': loaders.loadYaml,
      '.yml': loaders.loadYaml,
      noExt: loaders.loadYaml,
    },
    rawLoaders
  );
}

function identity(x) {
  return x;
}
