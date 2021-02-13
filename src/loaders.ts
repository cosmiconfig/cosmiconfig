/* eslint-disable @typescript-eslint/no-require-imports */

import parseJsonType from 'parse-json';
import yamlType from 'yaml';
import importFreshType from 'import-fresh';
import { LoaderSync, LoaderAsync } from './index';
import { Loaders } from './types';
import { canUseDynamicImport } from './canUseDynamicImport';

let importFresh: typeof importFreshType;
const loadJsSync: LoaderSync = function loadJsSync(filepath) {
  if (importFresh === undefined) {
    importFresh = require('import-fresh');
  }

  const result = importFresh(filepath);
  return result;
};

const loadJs: LoaderAsync = async function loadJs(filepath) {
  // This logic is validated by tests running in Node versions that don't
  // support dynamic imports, like Node 10.
  /* istanbul ignore else */
  if (canUseDynamicImport()) {
    const imported = await import(filepath);
    return imported.default;
  } else {
    return loadJsSync(filepath, null);
  }
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
    error.message = `JSON Error in ${filepath}:\n${error.message}`;
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
    error.message = `YAML Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

const loaders: Loaders = { loadJs, loadJsSync, loadJson, loadYaml };

export { loaders };
