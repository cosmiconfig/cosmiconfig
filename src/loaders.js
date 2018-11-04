// @flow
'use strict';

const parseJson = require('parse-json');
const yaml = require('js-yaml');

const wrapper = require('./importFreshWrapper');

function loadJs(filepath: string): Object {
  const result = wrapper.importFresh(filepath);
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

module.exports = {
  loadJs,
  loadJson,
  loadYaml,
};
