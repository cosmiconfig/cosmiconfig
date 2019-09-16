import parseJson from 'parse-json';
import importFresh from 'import-fresh';
import { LoaderSync } from './index';

let yaml: typeof import('js-yaml') | null = null;

const loadJs: LoaderSync = function loadJs(filepath) {
  const result = importFresh(filepath);
  return result;
};

const loadJson: LoaderSync = function loadJson(filepath, content) {
  try {
    return parseJson(content);
  } catch (err) {
    err.message = `JSON Error in ${filepath}:\n${err.message}`;
    throw err;
  }
};

const loadYaml: LoaderSync = function loadYaml(filepath, content) {
  if (!yaml) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    yaml = require('js-yaml') as typeof import('js-yaml');
  }

  return yaml.safeLoad(content, { filename: filepath });
};

export { loadJs, loadJson, loadYaml };
