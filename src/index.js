// @flow
'use strict';

const os = require('os');
const createExplorer = require('./createExplorer');

const homedir = os.homedir();

module.exports = function cosmiconfig(
  moduleName: string,
  options: {
    packageProp?: string | false,
    rc?: string | false,
    js?: string | false,
    rcStrictJson?: boolean,
    rcExtensions?: boolean,
    stopDir?: string,
    cache?: boolean,
    transform?: CosmiconfigResult => CosmiconfigResult,
    configPath?: string,
  }
) {
  const x: ExplorerOptions = Object.assign(
    {},
    {
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      rcStrictJson: false,
      rcExtensions: false,
      stopDir: homedir,
      cache: true,
    },
    options
  );

  return createExplorer(x);
};
