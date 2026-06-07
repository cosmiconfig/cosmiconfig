/* eslint-disable @typescript-eslint/no-require-imports */

import { realpath } from 'fs/promises';
import { pathToFileURL } from 'url';
import { Loader, LoaderSync } from './types.js';

let importFresh: typeof import('import-fresh');
export const loadJsSync: LoaderSync = function loadJsSync(filepath) {
  if (importFresh === undefined) {
    importFresh = require('import-fresh');
  }

  return importFresh(filepath);
};

export const loadJs: Loader = async function loadJs(filepath) {
  try {
    const { href } = pathToFileURL(await realpath(filepath));
    return (await import(href)).default;
  } catch (error) {
    try {
      return loadJsSync(filepath, '');
    } catch (requireError) {
      /* istanbul ignore next -- @preserve */
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

let parseJson: typeof import('parse-json');
export const loadJson: LoaderSync = function loadJson(filepath, content) {
  if (parseJson === undefined) {
    parseJson = require('parse-json');
  }

  try {
    return parseJson(content);
  } catch (error) {
    error.message = `JSON Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

let yaml: typeof import('js-yaml');
export const loadYaml: LoaderSync = function loadYaml(filepath, content) {
  if (yaml === undefined) {
    yaml = require('js-yaml');
  }

  try {
    return yaml.load(content);
  } catch (error) {
    error.message = `YAML Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};
