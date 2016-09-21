'use strict';

const fs = require('graceful-fs');
const requireFromString = require('require-from-string');

module.exports = function (filepath) {
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

    return {
      config: requireFromString(content, filepath),
      filepath: filepath,
    };
  });
};
