/* eslint-disable @typescript-eslint/no-require-imports */

import { LoaderSync } from '@cosmiconfig/base';

let yaml: typeof import('js-yaml');
export const loadYaml: LoaderSync = (filepath, content) => {
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
