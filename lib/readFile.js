'use strict';

const fs = require('graceful-fs');

module.exports = function (filepath, options) {
  options = options || {};
  options.throwNotFound = options.throwNotFound || false;

  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (err, content) => {
      if (err && err.code === 'ENOENT' && !options.throwNotFound) {
        return resolve(null);
      }

      if (err) return reject(err);

      resolve(content);
    });
  });
};
