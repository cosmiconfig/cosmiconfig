'use strict';
require('please-upgrade-node')(require('./package.json'));

const os = require('os');
const minimist = require('minimist');
const createExplorer = require('./lib/createExplorer');

const homedir = os.homedir();

module.exports = function cosmiconfig(moduleName, options) {
  // Keeping argv parsing here allows to mock `minimist` for different tests.
  // This should not have too much of a negative impact.
  const parsedCliArgs = minimist(process.argv);

  options = Object.assign(
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

  const configPath = parsedCliArgs[options.argv];
  if (options.argv && configPath && typeof configPath === 'string') {
    options.configPath = configPath;
  }

  return createExplorer(options);
};
