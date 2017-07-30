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
  const transform = options.transform || identity;

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
    const searchPathDir = resolveDir(absoluteSearchPath, options.sync);

    return !options.sync
      ? searchPathDir.then(searchDirectory)
      : searchDirectory(searchPathDir);
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

function resolveDir(searchPath, sync) {
  const dirForPath = pathIsDir =>
    pathIsDir ? searchPath : path.dirname(searchPath);

  if (sync === true) {
    return dirForPath(isDir.sync(searchPath));
  }

  return new Promise((resolve, reject) => {
    return isDir(searchPath, (err, pathIsDir) => {
      if (err) return reject(err);
      return resolve(dirForPath(pathIsDir));
    });
  });
}

function identity(x) {
  return x;
}
