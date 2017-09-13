// @flow
'use strict';

require('please-upgrade-node')(require('../package.json'));

const os = require('os');
const path = require('path');
const minimist = require('minimist');
const createExplorer = require('./createExplorer');

const homedir = os.homedir();

module.exports = function cosmiconfig(
  moduleName: string,
  options: {
    packageProp?: string | false,
    rc?: string | false,
    js?: string | false,
    argv?: string | false,
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
  // Keeping argv parsing here allows to mock `minimist` for different tests.
  // This should not have too much of a negative impact.
  const parsedCliArgs = minimist(process.argv);

  options = Object.assign(
    {},
    {
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      argv: 'config',
      rcStrictJson: false,
      stopDir: homedir,
      cache: true,
      sync: false,
    },
    options
  );

  if (options.argv && parsedCliArgs[options.argv]) {
    options.configPath = path.resolve(parsedCliArgs[options.argv]);
  }

  return createExplorer(options);
};
