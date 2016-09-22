'use strict';

const path = require('path');
const fs = require('graceful-fs');
const parseJson = require('parse-json');

module.exports = function (fileCache, packageDir, packageProp) {
  const packagePath = path.join(packageDir, 'package.json');

  const cached = fileCache.get(packagePath);
  if (cached) return cached;

  function cacheResult(result) {
    fileCache.set(packagePath, result);
    return result;
  }

  return new Promise((resolve, reject) => {
    fs.readFile(packagePath, 'utf8', (fileError, content) => {
      if (fileError) {
        if (fileError.code === 'ENOENT') return resolve(null);
        return reject(fileError);
      }
      resolve(content);
    });
  }).then((content) => {
    if (!content) return null;
    const parsedContent = parseJson(content, packagePath);
    const packagePropValue = parsedContent[packageProp];
    if (!packagePropValue) return null;

    return cacheResult({
      config: packagePropValue,
      filepath: packagePath,
    });
  });
};
