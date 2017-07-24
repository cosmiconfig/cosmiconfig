'use strict';

var path = require('path');
var isDir = require('is-directory');
var loadPackageProp = require('./loadPackageProp');
var loadRc = require('./loadRc');
var loadJs = require('./loadJs');
var loadDefinedFile = require('./loadDefinedFile');
var funcRunner = require('./funcRunner');

module.exports = function(options) {
  // When `options.sync` is `false` (default),
  // these cache Promises that resolve with results, not the results themselves.
  var fileCache = options.cache ? new Map() : null;
  var directoryCache = options.cache ? new Map() : null;
  var defaultTransform = options.sync ? identitySync : identityPromise;
  var transform = options.transform || defaultTransform;

  function clearFileCache() {
    if (fileCache) fileCache.clear();
  }

  function clearDirectoryCache() {
    if (directoryCache) directoryCache.clear();
  }

  function clearCaches() {
    clearFileCache();
    clearDirectoryCache();
  }

  function load(searchPath, configPath) {
    if (!configPath && options.configPath) {
      configPath = options.configPath;
    }

    if (configPath) {
      var absoluteConfigPath = path.resolve(process.cwd(), configPath);
      if (fileCache && fileCache.has(absoluteConfigPath)) {
        return fileCache.get(absoluteConfigPath);
      }
      var result = !options.sync
        ? loadDefinedFile(absoluteConfigPath, options).then(transform)
        : transform(loadDefinedFile(absoluteConfigPath, options));
      if (fileCache) fileCache.set(absoluteConfigPath, result);
      return result;
    }

    if (!searchPath) return !options.sync ? Promise.resolve(null) : null;

    var absoluteSearchPath = path.resolve(process.cwd(), searchPath);

    return !options.sync
      ? isDirectory(absoluteSearchPath).then(function(searchPathIsDirectory) {
          var directory = searchPathIsDirectory
            ? absoluteSearchPath
            : path.dirname(absoluteSearchPath);
          return searchDirectory(directory);
        })
      : searchDirectory(
          isDir.sync(absoluteSearchPath)
            ? absoluteSearchPath
            : path.dirname(absoluteSearchPath)
        );
  }

  function searchDirectory(directory) {
    if (directoryCache && directoryCache.has(directory)) {
      return directoryCache.get(directory);
    }

    var result = funcRunner(!options.sync ? Promise.resolve() : undefined, [
      function() {
        if (!options.packageProp) return;
        return loadPackageProp(directory, options);
      },
      function(result) {
        if (result || !options.rc) return result;
        return loadRc(path.join(directory, options.rc), options);
      },
      function(result) {
        if (result || !options.js) return result;
        return loadJs(path.join(directory, options.js), options);
      },
      function(result) {
        if (result) return result;

        var splitPath = directory.split(path.sep);
        var nextDirectory =
          splitPath.length > 1 ? splitPath.slice(0, -1).join(path.sep) : null;

        if (!nextDirectory || directory === options.stopDir) return null;

        return searchDirectory(nextDirectory);
      },
      transform,
    ]);

    if (directoryCache) directoryCache.set(directory, result);
    return result;
  }

  return {
    load: load,
    clearFileCache: clearFileCache,
    clearDirectoryCache: clearDirectoryCache,
    clearCaches: clearCaches,
  };
};

function isDirectory(filepath) {
  return new Promise(function(resolve, reject) {
    return isDir(filepath, function(err, dir) {
      if (err) return reject(err);
      return resolve(dir);
    });
  });
}

function identityPromise(x) {
  return Promise.resolve(x);
}

function identitySync(x) {
  return x;
}
