'use strict';

const fs = require('fs');

function readFile(filepath, options) {
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
}

readFile.sync = function readFileSync(filepath, options) {
  options = options || {};
  options.throwNotFound = options.throwNotFound || false;

  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT' && !options.throwNotFound) {
      return null;
    }
    throw err;
  }
};

module.exports = readFile;
