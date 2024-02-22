/* eslint-disable @typescript-eslint/no-require-imports */

import { LoaderSync } from '@cosmiconfig/types';

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
