'use strict';
require('please-upgrade-node')(require('./package.json'));

const path = require('path');
const oshomedir = require('os-homedir');
const minimist = require('minimist');
const createExplorer = require('./lib/createExplorer');

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
      stopDir: oshomedir(),
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
