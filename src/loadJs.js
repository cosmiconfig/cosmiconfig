// @flow
'use strict';

const requireFromString = require('require-from-string');
const readFile = require('./readFile');
const createParseFile = require('./createParseFile');

module.exports = function loadJs(
  filepath: string,
  options: { ignoreEmpty: boolean, sync?: boolean }
): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
  const parseJsFile = createParseFile(
    filepath,
    requireFromString,
    options.ignoreEmpty
  );

  return !options.sync
    ? readFile(filepath).then(parseJsFile)
    : parseJsFile(readFile.sync(filepath));
};
