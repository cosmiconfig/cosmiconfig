'use strict';

const path = require('path');
const oshomedir = require('os-homedir');
const minimist = require('minimist');
const loadPackageProp = require('./lib/loadPackageProp');
const loadRc = require('./lib/loadRc');
const loadJs = require('./lib/loadJs');
const loadDefinedFile = require('./lib/loadDefinedFile');

const parsedCliArgs = minimist(process.argv);

module.exports = function (moduleName, options) {
  options = Object.assign({
    packageProp: moduleName,
    rc: '.' + moduleName + 'rc',
    js: moduleName + '.config.js',
    argv: 'config',
    rcStrictJson: false,
    stopDir: oshomedir(),
  }, options);

  if (options.argv && parsedCliArgs[options.argv]) {
    options.configPath = path.resolve(parsedCliArgs[options.argv]);
  }

  const splitSearchPath = splitPath(options.cwd);

  if (options.configPath) {
    return loadDefinedFile(options.configPath, options.format);
  }

  function find() {
    const currentSearchPath = joinPath(splitSearchPath);

    return Promise.resolve().then(() => {
      if (!options.packageProp) return;
      return loadPackageProp(currentSearchPath, options.packageProp);
    }).then((result) => {
      if (result || !options.rc) return result;
      return loadRc(path.join(currentSearchPath, options.rc), {
        strictJson: options.rcStrictJson,
        extensions: options.rcExtensions,
      });
    }).then((result) => {
      if (result || !options.js) return result;
      return loadJs(path.join(currentSearchPath, options.js));
    }).then((result) => {
      if (result) return result;
      // Notice the mutation of splitSearchPath
      if (currentSearchPath === options.stopDir || !splitSearchPath.pop()) {
        return null;
      }
      return find();
    });
  }

  return find();
};

function splitPath(x) {
  return path.resolve(x || '').split(path.sep);
}

function joinPath(parts) {
  return parts.join(path.sep);
}
