import fs from 'fs';
import { promisify } from 'util';

const fsReadFileAsync = promisify(fs.readFile);

interface Options {
  throwNotFound?: boolean;
}

async function readFileAsync(
  filepath: string,
  options: Options = {},
): Promise<string | null> {
  const throwNotFound = options.throwNotFound === true;

  try {
    const content = await fsReadFileAsync(filepath, 'utf8');

    return content;
  } catch (error) {
    if (throwNotFound === false && error.code === 'ENOENT') {
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
  } catch (error) {
    if (throwNotFound === false && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export { readFileAsync, readFileSync };
