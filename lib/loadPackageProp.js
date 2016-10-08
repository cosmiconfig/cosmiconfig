'use strict';

const path = require('path');
const parseJson = require('parse-json');
const readFile = require('./readFile');

module.exports = function (packageDir, options) {
  const packagePath = path.join(packageDir, 'package.json');

  return readFile(packagePath).then((content) => {
    if (!content) return null;
    const parsedContent = parseJson(content, packagePath);
    const packagePropValue = parsedContent[options.packageProp];
    if (!packagePropValue) return null;

    return {
      config: packagePropValue,
      filepath: packagePath,
    };
  });
};
