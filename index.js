'use strict';

var path = require('path');
var oshomedir = require('os-homedir');
var Promise = require('pinkie-promise');
var minimist = require('minimist');
var defaults = require('defaults');
var loadPackageProp = require('./lib/loadPackageProp');
var loadRc = require('./lib/loadRc');
var loadJs = require('./lib/loadJs');
var loadDefinedFile = require('./lib/loadDefinedFile');

var DONE = 'done';
var parsedCliArgs = minimist(process.argv);

module.exports = function(moduleName, options) {
  options = defaults(options, {
    packageProp: moduleName,
    rc: '.' + moduleName + 'rc',
    js: moduleName + '.config.js',
    argv: 'config',
    rcStrictJson: false,
  });

  if (options.argv && parsedCliArgs[options.argv]) {
    options.configPath = path.resolve(parsedCliArgs[options.argv]);
  }

  var stopDir = options.stopDir || oshomedir();
  var splitSearchPath = splitPath(options.cwd);

  return new Promise(function(resolve, reject) {

    find();

    function find() {
      if (options.configPath) {
        loadDefinedFile(options.configPath, options.format).then(function(result) {
          return finishWith(result);
        }).catch(reject);
        return;
      }

      var currentSearchPath = joinPath(splitSearchPath);

      var search = Promise.resolve(null);

      if (options.packageProp) {
        search = search.then(function(result) {
          if (result) return finishWith(result);
          return loadPackageProp(currentSearchPath, options.packageProp);
        });
      }

      if (options.rc) {
        search = search.then(function(result) {
          if (result) return finishWith(result);
          return loadRc(path.join(currentSearchPath, options.rc), {
            strictJson: options.rcStrictJson,
          });
        });
      }

      if (options.js) {
        search = search.then(function(result) {
          if (result) return finishWith(result);
          return loadJs(path.join(currentSearchPath, options.js));
        });
      }

      search.then(function(result) {
        if (result) return finishWith(result);
        return moveUpOrGiveUp(currentSearchPath);
      })
        .then(function(result) {
          if (result === DONE) return resolve(null);
          find();
        })
        .catch(function(err) {
          if (err === DONE) return;
          reject(err);
        });

      function moveUpOrGiveUp(searchPath) {
        return new Promise(function(resolve) {
          // Notice the mutation of splitSearchPath
          if (searchPath === stopDir || !splitSearchPath.pop()) {
            resolve(DONE);
          } else {
            resolve(null);
          }
        });
      }

      function finishWith(result) {
        resolve(result);
        throw DONE;
      }
    }
  });
};

function splitPath(x) {
  return path.resolve(x || '').split(path.sep);
}

function joinPath(parts) {
  return parts.join(path.sep);
}
