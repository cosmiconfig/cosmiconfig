/* eslint-disable @typescript-eslint/no-require-imports */

import parseJsonType from 'parse-json';
import yamlType from 'yaml';
import importFreshType from 'import-fresh';
import { LoaderSync } from './index';
import { LoadersSync } from './types';

let importFresh: typeof importFreshType;
const loadJs: LoaderSync = function loadJs(filepath) {
  if (importFresh === undefined) {
    importFresh = require('import-fresh');
  }

  const result = importFresh(filepath);
  return result;
};

let parseJson: typeof parseJsonType;
const loadJson: LoaderSync = function loadJson(filepath, content) {
  if (parseJson === undefined) {
    parseJson = require('parse-json');
  }

  try {
    const result = parseJson(content);
    return result;
  } catch (error) {
    (error as Error).message = `JSON Error in ${filepath}:\n${
      (error as Error).message
    }`;
    throw error;
  }
};

let yaml: typeof yamlType;
const loadYaml: LoaderSync = function loadYaml(filepath, content) {
  if (yaml === undefined) {
    yaml = require('yaml');
  }

  try {
    const result = yaml.parse(content, { prettyErrors: true });
    return result;
  } catch (error) {
    (error as Error).message = `YAML Error in ${filepath}:\n${
      (error as Error).message
    }`;
    throw error;
  }
};

const loaders: LoadersSync = { loadJs, loadJson, loadYaml };

export { loaders };
