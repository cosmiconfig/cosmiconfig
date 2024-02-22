import { LoaderSync } from '@cosmiconfig/types';

export const loadJson: LoaderSync = function loadJson(filepath, content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    error.message = `JSON Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};
