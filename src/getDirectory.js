// @flow

import path from 'path';
import isDirectory from 'is-directory';

function getDirectory(filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    return isDirectory(filepath, (err, filepathIsDirectory) => {
      if (err) {
        return reject(err);
      }
      return resolve(filepathIsDirectory ? filepath : path.dirname(filepath));
    });
  });
}

getDirectory.sync = function getDirectorySync(filepath: string): string {
  return isDirectory.sync(filepath) ? filepath : path.dirname(filepath);
};

export { getDirectory };
