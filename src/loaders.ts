// @flow
'use strict';

import parseJson = require('parse-json');
import yaml = require('js-yaml');
import importFresh = require('import-fresh');

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

export = {
  loadJs,
  loadJson,
  loadYaml,
};
