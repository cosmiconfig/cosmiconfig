'use strict';

const requireFromString = require('require-from-string');
const readFile = require('./readFile');

module.exports = function (filepath) {
  return readFile(filepath).then((content) => {
    if (!content) return null;

    return {
      config: requireFromString(content, filepath),
      filepath: filepath,
    };
  });
};
