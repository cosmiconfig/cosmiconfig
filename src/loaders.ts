/* eslint-disable @typescript-eslint/explicit-function-return-type */

import parseJson from 'parse-json';
import yaml from 'js-yaml';
import importFresh from 'import-fresh';
import { SyncLoader } from './types';

const loadJs: SyncLoader = function loadJs(filepath) {
  const result = importFresh(filepath);
  return result;
};

const loadJson: SyncLoader = function loadJson(filepath, content) {
  try {
    return parseJson(content);
  } catch (err) {
    err.message = `JSON Error in ${filepath}:\n${err.message}`;
    throw err;
  }
};

const loadYaml: SyncLoader = function loadYaml(filepath, content) {
  return yaml.safeLoad(content, { filename: filepath });
};

export { loadJs, loadJson, loadYaml };
