'use strict';

const path = require('path');
const fs = require('graceful-fs');

const parseJson = require('parse-json');

module.exports = function (packageDir, packageProp) {
  const packagePath = path.join(packageDir, 'package.json');
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

    return {
      config: packagePropValue,
      filepath: packagePath,
    };
  });
};
