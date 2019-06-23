// @flow

import parseJson from 'parse-json';
import yaml from 'js-yaml';
import importFresh from 'import-fresh';

function loadJs(filepath: string): Object {
  const result = importFresh(filepath);
  return result;
}

function loadJson(filepath: string, content: string): Object {
  try {
    return parseJson(content);
  } catch (err) {
    err.message = `JSON Error in ${filepath}:\n${err.message}`;
    throw err;
  }
}

function loadYaml(filepath: string, content: string): Object {
  return yaml.safeLoad(content, { filename: filepath });
}

export { loadJs, loadJson, loadYaml };
