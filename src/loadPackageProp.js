// @flow
'use strict';

const path = require('path');
const readFile = require('./readFile');
const parseJson = require('./parseJson');

module.exports = function loadPackageProp(
  packageDir: string,
  options: {
    packageProp: string,
    sync?: boolean,
  }
): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
  const packagePath = path.join(packageDir, 'package.json');

  function parseContent(content: ?string): ?cosmiconfig$Result {
    if (!content) return null;
    const parsedContent = parseJson(content, packagePath);
    const packagePropValue = parsedContent[options.packageProp];
    if (!packagePropValue) return null;

    return {
      config: packagePropValue,
      filepath: packagePath,
    };
  }

  return !options.sync
    ? readFile(packagePath).then(parseContent)
    : parseContent(readFile.sync(packagePath));
};
