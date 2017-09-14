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
    format?: 'json' | 'yaml' | 'js',
    rcStrictJson?: boolean,
    rcExtensions?: boolean,
    stopDir?: string,
    cache?: boolean,
    sync?: boolean,
    transform?: (?Object) => ?Object,
    configPath?: string,
  }
) {
  options = Object.assign(
    {},
    {
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      rcStrictJson: false,
      stopDir: homedir,
      cache: true,
      sync: false,
    },
    options
  );

  return createExplorer(options);
};
