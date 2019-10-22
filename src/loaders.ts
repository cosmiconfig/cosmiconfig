import parseJson from 'parse-json';
import yaml from 'yaml';
import importFresh from 'import-fresh';
import { LoaderSync } from './index';
import { LoadersSync } from './types';

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
  return yaml.parse(content, { prettyErrors: true });
};

const loaders: LoadersSync = { loadJs, loadJson, loadYaml };

export { loaders };
