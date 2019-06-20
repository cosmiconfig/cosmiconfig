import path from 'path';
import { isDirectory, isDirectorySync } from 'path-type';

async function getDirectoryAsync(filepath: string): Promise<string> {
  const filePathIsDirectory = await isDirectory(filepath);

  if (filePathIsDirectory === true) {
    return filepath;
  }

  const directory = path.dirname(filepath);

  return directory;
}

function getDirectorySync(filepath: string): string {
  const filePathIsDirectory = isDirectorySync(filepath);

  if (filePathIsDirectory === true) {
    return filepath;
  }

  const directory = path.dirname(filepath);

  return directory;
}

export { getDirectoryAsync, getDirectorySync };
