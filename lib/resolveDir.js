'use strict';

const path = require('path');
const isDir = require('is-directory');

/**
 * Resolves difectory for given search path. Depending on the `sync` parameter,
 * either a string or a `Promise` which resolves to a string is returned. If
 * the given path is a directory, the same path is returned. If not, the parent
 * directory is returned.
 *
 * @param {string} searchPath The path to detect and return the directory for.
 * @param {boolean} sync If the value should be resolved synchronously or in a
 * promise
 * @returns {Promise<string> | string} The directory for the given path.
 */
module.exports = function resolveDir(searchPath, sync) {
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
};
