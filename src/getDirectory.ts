import path from 'path';
import isDirectory from 'is-directory';

function getDirectoryAsync(filepath: string): Promise<string> {
  return new Promise((resolve, reject): void => {
    isDirectory(filepath, (error, filepathIsDirectory): void => {
      if (error) {
        reject(error);

        return;
      }

      resolve(filepathIsDirectory ? filepath : path.dirname(filepath));
    });
  });
}

function getDirectorySync(filepath: string): string {
  return isDirectory.sync(filepath) ? filepath : path.dirname(filepath);
}

export { getDirectoryAsync, getDirectorySync };
