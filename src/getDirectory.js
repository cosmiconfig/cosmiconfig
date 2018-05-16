// @flow
'use strict';

const path = require('path');
const isDirectory = require('./isDirectory');

function getDirectory(fs: FS, filepath: string): Promise<string> {
  return isDirectory(fs, filepath).then(
    isDirResult => (isDirResult ? filepath : path.dirname(filepath))
  );
}

getDirectory.sync = function getDirectorySync(
  fs: FS,
  filepath: string
): string {
  return isDirectory.sync(fs, filepath) ? filepath : path.dirname(filepath);
};

module.exports = getDirectory;
