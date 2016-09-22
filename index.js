'use strict';

const path = require('path');
const oshomedir = require('os-homedir');
const minimist = require('minimist');
const createCachedLoad = require('./lib/createCachedLoad');

const parsedCliArgs = minimist(process.argv);

module.exports = function (moduleName, options) {
  options = Object.assign({
    packageProp: moduleName,
    rc: `.${moduleName}rc`,
    js: `${moduleName}.config.js`,
    argv: 'config',
    rcStrictJson: false,
    stopDir: oshomedir(),
  }, options);

  if (options.argv && parsedCliArgs[options.argv]) {
    options.configPath = path.resolve(parsedCliArgs[options.argv]);
  }

  const load = createCachedLoad(options);
  return {
    load,
  };
};
