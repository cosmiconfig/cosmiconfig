// @flow
'use strict';

import path = require('path');
import isDirectory = require('is-directory');

// eslint-disable-next-line no-unused-vars
function getDirectory(filepath: string, _bool?: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    return isDirectory(filepath, (err, filepathIsDirectory) => {
      if (err) {
        return reject(err);
      }
      return resolve(filepathIsDirectory ? filepath : path.dirname(filepath));
    });
  });
}

// eslint-disable-next-line no-unused-vars
getDirectory.sync = function getDirectorySync(filepath: string, _bool?: boolean): string {
  return isDirectory.sync(filepath) ? filepath : path.dirname(filepath);
};

export = getDirectory;
