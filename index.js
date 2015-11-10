/* much inspiration from https://github.com/sindresorhus/find-up */
'use strict';

var path = require('path');
var oshomedir = require('os-homedir');
var loadPackageProp = require('./lib/loadPackageProp');
var loadRc = require('./lib/loadRc');
var loadJs = require('./lib/loadJs');
var loadDefinedPath = require('./lib/loadDefinedPath');
var mergeExtends = require('./lib/mergeExtends');

var DONE = 'done';

module.exports = function(moduleName, options) {
  options = options || {};
  options.packageProp = options.packageProp || moduleName;
  options.rcName = options.rcName || '.' + moduleName + 'rc';
  options.jsName = options.jsName || moduleName + '.config.js';

  var homedir = options.homedir || oshomedir();
  var splitSearchPath = splitPath(options.cwd);

  return new Promise(function(resolve, reject) {

    find();

    function find() {
      if (options.config) {
        loadDefinedPath(options.config, options.format).then(function(result) {
          finishWith(result);
        });
        return;
      }

      var currentSearchPath = joinPath(splitSearchPath);

      return loadPackageProp(currentSearchPath, options.packageProp)
        .then(function(result) {
          if (result) return finishWith(result);
          return loadRc(currentSearchPath, options.rcName);
        })
        .then(function(result) {
          if (result) return finishWith(result);
          return loadJs(currentSearchPath, options.jsName);
        })
        .then(function(result) {
          if (result) return finishWith(result);
          return moveUpOrGiveUp(currentSearchPath, splitSearchPath, homedir);
        })
        .then(function(result) {
          if (result === DONE) resolve(null);
          else find();
        })
        .catch(function(err) {
          if (err === DONE) return;
          reject(err);
        });

      function finishWith(result) {
        if (options.allowExtends) {
          return mergeExtends(result.config, path.dirname(result.filepath))
            .then(function(mergedConfig) {
              resolve({ config: mergedConfig, filepath: result.filepath });
              throw DONE;
            });
        } else {
          resolve(result);
          throw DONE;
        }
      }
    }
  });
};

function splitPath(x) {
  return path.resolve(x || '').split(path.sep);
}

function joinPath(x) {
  return path.join.apply(null, [path.sep].concat(x));
}

function moveUpOrGiveUp(searchPath, splitSearchPath, stopdir) {
  return new Promise(function(resolve) {
    // Notice the mutation of splitSearchPath
    if (searchPath === stopdir || !splitSearchPath.pop()) {
      resolve(DONE);
    } else {
      resolve(null);
    }
  });
}
