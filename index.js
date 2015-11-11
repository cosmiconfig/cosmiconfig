// Much inspiration from https://github.com/sindresorhus/find-up

'use strict';

var path = require('path');
var oshomedir = require('os-homedir');
var Promise = require('pinkie-promise');
var loadPackageProp = require('./lib/loadPackageProp');
var loadRc = require('./lib/loadRc');
var loadJs = require('./lib/loadJs');
var loadDefinedFile = require('./lib/loadDefinedFile');
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
        loadDefinedFile(options.config, options.format).then(function(result) {
          return finishWith(result);
        }).catch(reject);
        return;
      }

      var currentSearchPath = joinPath(splitSearchPath);

      loadPackageProp(currentSearchPath, options.packageProp)
        .then(function(result) {
          if (result) return finishWith(result);
          return loadRc(path.join(currentSearchPath, options.rcName));
        })
        .then(function(result) {
          if (result) return finishWith(result);
          return loadJs(path.join(currentSearchPath, options.jsName));
        })
        .then(function(result) {
          if (result) return finishWith(result);
          return moveUpOrGiveUp(currentSearchPath, splitSearchPath, homedir);
        })
        .then(function(result) {
          if (result === DONE) return resolve(null);
          find();
        })
        .catch(function(err) {
          if (err === DONE) return;
          reject(err);
        });

      function finishWith(result) {
        // The `throw`ing in here is to break the Promise chain above
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
