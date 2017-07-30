'use strict';

const path = require('path');
const isDir = require('is-directory');
const loadPackageProp = require('./loadPackageProp');
const loadRc = require('./loadRc');
const loadJs = require('./loadJs');
const loadDefinedFile = require('./loadDefinedFile');
const funcRunner = require('./funcRunner');

module.exports = function createExplorer(options) {
  // When `options.sync` is `false` (default),
  // these cache Promises that resolve with results, not the results themselves.
  const fileCache = options.cache ? new Map() : null;
  const directoryCache = options.cache ? new Map() : null;
  const defaultTransform = options.sync ? identitySync : identityPromise;
  const transform = options.transform || defaultTransform;

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
      const absoluteConfigPath = path.resolve(process.cwd(), configPath);
      if (fileCache && fileCache.has(absoluteConfigPath)) {
        return fileCache.get(absoluteConfigPath);
      }
      const result = !options.sync
        ? loadDefinedFile(absoluteConfigPath, options).then(transform)
        : transform(loadDefinedFile(absoluteConfigPath, options));
      if (fileCache) fileCache.set(absoluteConfigPath, result);
      return result;
    }

    if (!searchPath) return !options.sync ? Promise.resolve(null) : null;

    const absoluteSearchPath = path.resolve(process.cwd(), searchPath);

    return !options.sync
      ? isDirectory(absoluteSearchPath).then(searchPathIsDirectory => {
          const directory = searchPathIsDirectory
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

    const result = funcRunner(!options.sync ? Promise.resolve() : undefined, [
      () => {
        if (!options.packageProp) return;
        return loadPackageProp(directory, options);
      },
      result => {
        if (result || !options.rc) return result;
        return loadRc(path.join(directory, options.rc), options);
      },
      result => {
        if (result || !options.js) return result;
        return loadJs(path.join(directory, options.js), options);
      },
      result => {
        if (result) return result;

        const splitPath = directory.split(path.sep);
        const nextDirectory =
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
    load,
    clearFileCache,
    clearDirectoryCache,
    clearCaches,
  };
};

function isDirectory(filepath) {
  return new Promise((resolve, reject) => {
    return isDir(filepath, (err, dir) => {
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
