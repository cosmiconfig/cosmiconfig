'use strict';

const path = require('path');
const fs = require('graceful-fs');
const loadPackageProp = require('./loadPackageProp');
const loadRc = require('./loadRc');
const loadJs = require('./loadJs');
const loadDefinedFile = require('./loadDefinedFile');

// Substituted for real Maps if caching is turned off
const impotentMap = {
  get() {
    return null;
  },
  set() {},
};

module.exports = function (options) {
  const startPathCache = (options.cache) ? new Map() : impotentMap;
  const fileCache = (options.cache) ? new Map() : impotentMap;
  const directoryCache = (options.cache) ? new Map() : impotentMap;

  return function load(startPath) {
    const cached = startPathCache.get(startPath);
    if (cached) return cached;

    const absoluteStartPath = path.resolve(process.cwd(), startPath);

    const getStartPathResult = isDirectory(absoluteStartPath).then((startPathIsDirectory) => {
      if (startPathIsDirectory) return searchDirectory(absoluteStartPath);
      return loadDefinedFile(fileCache, absoluteStartPath, options);
    });

    startPathCache.set(startPath, getStartPathResult);
    return getStartPathResult;
  };

  function searchDirectory(directory) {
    const cached = directoryCache.get(directory);
    if (cached) return cached;

    const getDirectoryResult = Promise.resolve()
      .then(() => {
        if (!options.packageProp) return;
        return loadPackageProp(fileCache, directory, options.packageProp);
      })
      .then((result) => {
        if (result || !options.rc) return result;
        return loadRc(fileCache, path.join(directory, options.rc), {
          strictJson: options.rcStrictJson,
          extensions: options.rcExtensions,
        });
      })
      .then((result) => {
        if (result || !options.js) return result;
        return loadJs(fileCache, path.join(directory, options.js));
      })
      .then((result) => {
        if (result) return result;
        const nextDirectory = joinPath(splitPath(directory).slice(0, -1));
        if (!nextDirectory || directory === options.stopDir) return null;
        return searchDirectory(nextDirectory);
      });

    directoryCache.set(directory, getDirectoryResult);
    return getDirectoryResult;
  }
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