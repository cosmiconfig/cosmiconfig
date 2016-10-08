'use strict';

const path = require('path');
const fs = require('graceful-fs');
const loadPackageProp = require('./loadPackageProp');
const loadRc = require('./loadRc');
const loadJs = require('./loadJs');
const loadDefinedFile = require('./loadDefinedFile');

module.exports = function (options) {
  // These cache Promises that resolve with results, not the results themselves
  const fileCache = (options.cache) ? new Map() : null;
  const directoryCache = (options.cache) ? new Map() : null;
  const transform = options.transform || identityPromise;

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
    if (configPath) {
      const absoluteConfigPath = path.resolve(process.cwd(), configPath);
      if (fileCache && fileCache.has(absoluteConfigPath)) {
        return fileCache.get(absoluteConfigPath);
      }
      const result = loadDefinedFile(absoluteConfigPath, options)
        .then(transform);
      if (fileCache) fileCache.set(absoluteConfigPath, result);
      return result;
    }

    if (!searchPath) return Promise.resolve(null);

    const absoluteSearchPath = path.resolve(process.cwd(), searchPath);

    return isDirectory(absoluteSearchPath)
      .then((searchPathIsDirectory) => {
        const directory = (searchPathIsDirectory)
          ? absoluteSearchPath
          : path.dirname(absoluteSearchPath);
        if (directoryCache && directoryCache.has(directory)) {
          return directoryCache.get(directory);
        }
        return searchDirectory(directory);
      });
  }

  function searchDirectory(directory) {
    if (directoryCache && directoryCache.has(directory)) {
      return directoryCache.get(directory);
    }

    const result = Promise.resolve()
      .then(() => {
        if (!options.packageProp) return;
        return loadPackageProp(directory, options);
      })
      .then((result) => {
        if (result || !options.rc) return result;
        return loadRc(path.join(directory, options.rc), options);
      })
      .then((result) => {
        if (result || !options.js) return result;
        return loadJs(path.join(directory, options.js));
      })
      .then((result) => {
        if (result) return result;

        const nextDirectory = joinPath(splitPath(directory).slice(0, -1));
        if (!nextDirectory || directory === options.stopDir) return null;

        return searchDirectory(nextDirectory);
      })
      .then(transform);

    if (directoryCache) directoryCache.set(directory, result);
    return result;
  }

  return {
    load,
    clearFileCache,
    clearDirectoryCache,
    clearCaches,
  };
};

function isDirectory(filepath) {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stats) => {
      if (err) return reject(err);
      return resolve(stats.isDirectory());
    });
  });
}

function splitPath(x) {
  return path.resolve(x || '').split(path.sep);
}

function joinPath(parts) {
  if (!parts) return parts;
  return parts.join(path.sep);
}

function identityPromise(x) {
  return Promise.resolve(x);
}
