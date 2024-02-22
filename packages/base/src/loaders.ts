/* eslint-disable @typescript-eslint/no-require-imports */

import { Loader, LoaderSync } from '@cosmiconfig/types';
import { pathToFileURL } from 'url';

let importFresh: typeof import('import-fresh');
export const loadJsSync: LoaderSync = function loadJsSync(filepath) {
  if (importFresh === undefined) {
    importFresh = require('import-fresh');
  }

  return importFresh(filepath);
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
