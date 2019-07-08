import path from 'path';
import isDirectory from 'is-directory';

async function getDirectory(filepath: string): Promise<string> {
  return new Promise((resolve, reject): void => {
    isDirectory(filepath, (err, filepathIsDirectory): void => {
      if (err) {
        reject(err);
        return;
      }
      resolve(filepathIsDirectory ? filepath : path.dirname(filepath));
    });
  });
}

function getDirectorySync(filepath: string): string {
  return isDirectory.sync(filepath) ? filepath : path.dirname(filepath);
}

export { getDirectory, getDirectorySync };
