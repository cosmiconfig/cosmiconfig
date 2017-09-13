// @flow
'use strict';

const path = require('path');
const isDirectory = require('is-directory');

module.exports = function getDirectory(
  filename: string,
  sync?: boolean
): Promise<string> | string {
  if (sync === true) {
    return isDirectory.sync(filename) ? filename : path.dirname(filename);
  }

  return new Promise((resolve, reject) => {
    return isDirectory(filename, (err, filenameIsDirectory) => {
      if (err) {
        return reject(err);
      }
      return resolve(filenameIsDirectory ? filename : path.dirname(filename));
    });
  });
};
