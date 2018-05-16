// @flow
'use strict';

function isDirectory(fs: FS, filepath: string): Promise<boolean> {
  if (typeof filepath !== 'string') {
    return Promise.reject(new TypeError('expected filepath to be a string'));
  }

  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stat) => {
      if (err) {
        // istanbul ignore else
        if (err.code === 'ENOENT') {
          return resolve(false);
        }

        // istanbul ignore next
        return reject(err);
      }

      resolve(stat.isDirectory());
    });
  });
}

isDirectory.sync = function isDirectorySync(fs: FS, filepath: string): boolean {
  if (typeof filepath !== 'string') {
    throw new Error('expected filepath to be a string');
  }

  try {
    const stat = fs.statSync(filepath);
    return stat.isDirectory();
  } catch (err) {
    // istanbul ignore else
    if (err.code === 'ENOENT') {
      return false;
    }

    // istanbul ignore next
    throw err;
  }
};

module.exports = isDirectory;
