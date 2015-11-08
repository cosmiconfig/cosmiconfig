/* much inspiration from https://github.com/sindresorhus/find-up */
'use strict';

var path = require('path');
var oshomedir = require('os-homedir');
var Promise = require('pinkie-promise');
var loadPackageProp = require('./lib/loadPackageProp');
var loadRc = require('./lib/loadRc');
var loadJs = require('./lib/loadJs');
var loadDefinedPath = require('./lib/loadDefinedPath');

var DONE = 'done';

module.exports = function(moduleName, options) {
  options = options || {};
  options.packageProp = options.packageProp || moduleName;
  options.rcName = options.rcName || '.' + moduleName + 'rc';
  options.jsName = options.jsName || moduleName + '.config.js';

  var homedir = options.homedir || oshomedir();
  var splitSearchPath = splitPath(options.cwd);

  return new Promise(function(resolve, reject) {
    if (options.config) {
      return resolve(loadDefinedPath(options.config, options.format));
    }
    return find(resolve, reject);
  });

  function find(resolve, reject) {
    var currentSearchPath = joinPath(splitSearchPath);

    return loadPackageProp(currentSearchPath, options.packageProp)
      .then(function(result) {
        if (result) finishWith(result);
        else return loadRc(currentSearchPath, options.rcName);
      })
      .then(function(result) {
        if (result) finishWith(result);
        else return loadJs(currentSearchPath, options.jsName);
      })
      .then(function(result) {
        if (result) finishWith(result);
        else return moveUpOrGiveUp(currentSearchPath, splitSearchPath, homedir);
      })
      .then(function(result) {
        if (result === DONE) resolve(null);
        else find(resolve, reject);
      })
      .catch(function(err) {
        if (err === DONE) return;
        reject(err);
      });

    function finishWith(result) {
      resolve(result);
      throw DONE;
    }
  }
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
