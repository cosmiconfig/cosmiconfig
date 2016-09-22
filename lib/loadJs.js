'use strict';

const fs = require('graceful-fs');
const requireFromString = require('require-from-string');

module.exports = function (fileCache, filepath) {
  const cached = fileCache.get(filepath);
  if (cached) return cached;

  function cacheResult(result) {
    fileCache.set(filepath, result);
    return result;
  }

  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (fileError, content) => {
      if (fileError) {
        if (fileError.code === 'ENOENT') return resolve(null);
        return reject(fileError);
      }
      resolve(content);
    });
  }).then((content) => {
    if (!content) return null;

    return cacheResult({
      config: requireFromString(content, filepath),
      filepath: filepath,
    });
  });
};
