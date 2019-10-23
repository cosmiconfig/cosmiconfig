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
    const result = parseJson(content);
    return result;
  } catch (error) {
    error.message = `JSON Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

const loadYaml: LoaderSync = function loadYaml(filepath, content) {
  try {
    const result = yaml.parse(content, { prettyErrors: true });
    return result;
  } catch (error) {
    error.message = `YAML Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

const loaders: LoadersSync = { loadJs, loadJson, loadYaml };

export { loaders };
