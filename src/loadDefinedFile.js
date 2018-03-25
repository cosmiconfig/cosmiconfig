// @flow
'use strict';

const path = require('path');
const readFile = require('./readFile');
const parser = require('./parser');

function parseFileContent(
  content: ?string,
  filepath: string
): CosmiconfigResult {
  if (!content) {
    return { config: undefined, filepath, isEmpty: true };
  }

  let parsedConfig;

  switch (inferFormat(filepath)) {
    case 'json':
      parsedConfig = parser.parseJson(content, filepath);
      break;
    case 'yaml':
      parsedConfig = parser.parseYaml(content, filepath);
      break;
    case 'js':
      parsedConfig = parser.parseJs(content, filepath);
      break;
    default:
      parsedConfig = tryAllParsing(content, filepath);
  }

  if (!parsedConfig) {
    throw new Error(`Failed to parse "${filepath}" as JSON, JS, or YAML.`);
  }

  return {
    config: parsedConfig,
    filepath,
  };
}

function inferFormat(filepath: string): ?string {
  switch (path.extname(filepath)) {
    case '.js':
      return 'js';
    case '.json':
      return 'json';
    // istanbul ignore next
    case '.yml':
    case '.yaml':
      return 'yaml';
    default:
      return undefined;
  }
}

function tryAllParsing(content: string, filepath: string): ?Object {
  return tryYaml(content, filepath, () => {
    return tryRequire(content, filepath, () => {
      return null;
    });
  });
}

function tryYaml(content: string, filepath: string, cb: () => ?Object) {
  try {
    const result = parser.parseYaml(content, filepath);
    if (typeof result === 'string') {
      return cb();
    }
    return result;
  } catch (err) {
    return cb();
  }
}

function tryRequire(content: string, filepath: string, cb: () => ?Object) {
  try {
    return parser.parseJs(content, filepath);
  } catch (err) {
    return cb();
  }
}

function loadDefinedFile(filepath: string): Promise<CosmiconfigResult> {
  return readFile(filepath, { throwNotFound: true }).then(content => {
    return parseFileContent(content, filepath);
  });
}

loadDefinedFile.sync = function loadDefinedFileSync(
  filepath: string
): CosmiconfigResult {
  return parseFileContent(
    readFile.sync(filepath, { throwNotFound: true }),
    filepath
  );
};

module.exports = loadDefinedFile;
