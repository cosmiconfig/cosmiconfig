// @flow
'use strict';

const requireFromString = require('require-from-string');
const readFile = require('./readFile');

module.exports = function loadJs(
  filepath: string,
  options: { sync?: boolean }
): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
  function parseJsFile(content: ?string): ?cosmiconfig$Result {
    if (!content) return null;

    return {
      config: requireFromString(content, filepath),
      filepath,
    };
  }

  return !options.sync
    ? readFile(filepath).then(parseJsFile)
    : parseJsFile(readFile.sync(filepath));
};
