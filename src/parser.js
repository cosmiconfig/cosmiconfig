// @flow
'use strict';

const requireFromString = require('require-from-string');
const parseJsonCore = require('parse-json');
const yaml = require('js-yaml');

function parseJs(content: string, filepath: string): Object {
  return requireFromString(content, filepath);
}

function parseJson(content: string, filepath: string): Object {
  try {
    return parseJsonCore(content);
  } catch (err) {
    err.message = `JSON Error in ${filepath}:\n${err.message}`;
    throw err;
  }
}

function parseYaml(content: string, filepath: string): Object {
  return yaml.safeLoad(content, { filename: filepath });
}

function parsePackageFile(
  packageProp: string,
  content: string,
  filepath: string
): Object | null {
  const parsedContent = parseJson(content, filepath);
  if (!parsedContent) return null;
  const packagePropValue = parsedContent[packageProp];
  return packagePropValue || null;
}

module.exports = {
  parseJs,
  parseJson,
  parseYaml,
  parsePackageFile,
};
