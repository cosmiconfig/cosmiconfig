'use strict';

var requireFromString = require('require-from-string');
var readFile = require('./readFile');

module.exports = function(filepath, options) {
  function parseJsFile(content) {
    if (!content) return null;

    return {
      config: requireFromString(content, filepath),
      filepath: filepath,
    };
  }

  return !options.sync
    ? readFile(filepath).then(parseJsFile)
    : parseJsFile(readFile.sync(filepath));
};
