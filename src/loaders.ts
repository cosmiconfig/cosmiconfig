/* eslint-disable @typescript-eslint/no-require-imports */

import { pathToFileURL } from 'node:url';
import { LoaderAsync, LoaderSync } from './index';
import { Loaders } from './types';

let importFresh: typeof import('import-fresh');
const loadJsSync: LoaderSync = function loadJsSync(filepath) {
  if (importFresh === undefined) {
    importFresh = require('import-fresh');
  }

  const result = importFresh(filepath);
  return result;
};

const loadJs: LoaderAsync = async function loadJs(filepath) {
  try {
    const { href } = pathToFileURL(filepath);
    return (await import(href)).default;
  } catch (error) {
    return loadJsSync(filepath, null);
  }
};

let parseJson: typeof import('parse-json');
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

let yaml: typeof import('js-yaml');
const loadYaml: LoaderSync = function loadYaml(filepath, content) {
  if (yaml === undefined) {
    yaml = require('js-yaml');
  }

  try {
    const result = yaml.load(content!);
    return result;
  } catch (error) {
    error.message = `YAML Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

const loaders: Loaders = { loadJs, loadJsSync, loadJson, loadYaml };

export { loaders };
