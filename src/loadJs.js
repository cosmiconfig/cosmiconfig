// @flow
'use strict';

const requireFromString = require('require-from-string');
const readFile = require('./readFile');

function parseJsFile(content: ?string, filepath: string): ?CosmiconfigResult {
  return requireFromString(content, filepath);
}

function loadJs(filepath: string): Promise<?CosmiconfigResult> {
  return readFile(filepath)
    .then(content => parseJsFile(content, filepath))
    .then(config => {
      return { config, filepath }
    });
}

loadJs.sync = function loadJsSync(filepath: string): ?CosmiconfigResult {
  const config = parseJsFile(readFile.sync(filepath), filepath);
  return { config, filepath };
};

module.exports = loadJs;
