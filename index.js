/* much inspiration from https://github.com/sindresorhus/find-up */
'use strict';

var fs = require('graceful-fs');
var parseJson = require('parse-json');
var path = require('path');
var yaml = require('js-yaml');
var requireFromString = require('require-from-string');
var oshomedir = require('os-homedir');
var Promise = require('pinkie-promise');

var DONE = 'done';

module.exports = function(moduleName, options) {
  options = options || {};
  options.packageProp = options.packageProp || moduleName;
  options.rcName = options.rcName || '.' + moduleName + 'rc';
  options.jsName = options.jsName || moduleName + '.config.js';

  var homedir = oshomedir();
  var splitSearchPath = splitPath(options.cwd);

  return new Promise(function(resolve, reject) {
    find(resolve, reject);
  });

  function find(resolve, reject) {
    var currentSearchPath = joinPath(splitSearchPath);

    loadPackageProp(currentSearchPath, options.packageProp)
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
        throw err;
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

function loadPackageProp(searchPath, packageProp) {
  var searchFilepath = path.join(searchPath, 'package.json');
  return new Promise(function(resolve) {
    fs.readFile(searchFilepath, 'utf8', function(err, content) {
      if (err) {
        resolve(null);
        return;
      }
      var parsedContent = parseJson(content);
      var packagePropValue = parsedContent[packageProp]
      if (!packagePropValue) {
        resolve(null);
        return;
      }
      resolve({
        config: packagePropValue,
        filepath: searchFilepath,
      });
    });
  });
}

function loadRc(searchPath, rcName) {
  var searchFilepath = path.join(searchPath, rcName);
  return new Promise(function(resolve) {
    fs.readFile(searchFilepath, 'utf8', function(err, content) {
      if (err) {
        resolve(null);
        return;
      }
      resolve({
        config: yaml.safeLoad(content),
        filepath: searchFilepath,
      });
    });
  });
}

function loadJs(searchPath, jsName) {
  var searchFilepath = path.join(searchPath, jsName);
  return new Promise(function(resolve) {
    fs.readFile(searchFilepath, 'utf8', function(err, content) {
      if (err) {
        resolve(null);
        return;
      }
      resolve({
        config: requireFromString(content, searchFilepath),
        filepath: searchFilepath,
      });
    });
  });
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
