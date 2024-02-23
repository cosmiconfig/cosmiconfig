/* eslint-disable @typescript-eslint/no-require-imports */
import { pathToFileURL } from 'url';
import { Loader, LoaderSync } from './types';

export const loadJsSync: LoaderSync = function loadJsSync(filepath) {
  return require(filepath);
};

export const loadJs: Loader = async function loadJs(filepath) {
  try {
    const { href } = pathToFileURL(filepath);
    return (await import(href)).default;
  } catch (error) {
    try {
      return loadJsSync(filepath, '');
    } catch (requireError) {
      if (
        requireError.code === 'ERR_REQUIRE_ESM' ||
        (requireError instanceof SyntaxError &&
          requireError
            .toString()
            .includes('Cannot use import statement outside a module'))
      ) {
        throw error;
      }

      throw requireError;
    }
  }
};

export const loadJson: LoaderSync = function loadJson(filepath, content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    error.message = `JSON Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};
