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
    sync?: boolean,
    transform?: (?Object) => ?Object,
    configPath?: string,
  }
) {
  const x: CreateExplorerOptions = Object.assign(
    {},
    {
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      rcStrictJson: false,
      rcExtensions: false,
      stopDir: homedir,
      cache: true,
      sync: false,
    },
    options
  );

  return createExplorer(x);
};
