'use strict';

const path = require('path');
const oshomedir = require('os-homedir');
const minimist = require('minimist');
const createExplorer = require('./lib/createExplorer');

const parsedCliArgs = minimist(process.argv);

module.exports = function (moduleName, options) {
  options = Object.assign({
    packageProp: moduleName,
    rc: `.${moduleName}rc`,
    js: `${moduleName}.config.js`,
    argv: 'config',
    rcStrictJson: false,
    stopDir: oshomedir(),
    cache: true,
  }, options);

  if (options.argv && parsedCliArgs[options.argv]) {
    options.configPath = path.resolve(parsedCliArgs[options.argv]);
  }

  return createExplorer(options);
};
