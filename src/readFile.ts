import fs from 'fs';

async function fsReadFileAsync(
  pathname: string,
  encoding: BufferEncoding,
): Promise<string> {
  return new Promise((resolve, reject): void => {
    fs.readFile(pathname, encoding, (error, contents): void => {
      if (error) {
        reject(error);
        return;
      }

      resolve(contents);
    });
  });
}

interface Options {
  throwNotFound?: boolean;
}

async function readFile(
  filepath: string,
  options: Options = {},
): Promise<string | null> {
  const throwNotFound = options.throwNotFound === true;

  try {
    const content = await fsReadFileAsync(filepath, 'utf8');

    return content;
  } catch (error: any) {
    if (
      throwNotFound === false &&
      (error.code === 'ENOENT' || error.code === 'EISDIR')
    ) {
      return null;
    }

    throw error;
  }
}

function readFileSync(filepath: string, options: Options = {}): string | null {
  const throwNotFound = options.throwNotFound === true;

  try {
    const content = fs.readFileSync(filepath, 'utf8');

    return content;
  } catch (error: any) {
    if (
      throwNotFound === false &&
      (error.code === 'ENOENT' || error.code === 'EISDIR')
    ) {
      return null;
    }

    throw error;
  }
}

export { readFile, readFileSync };
