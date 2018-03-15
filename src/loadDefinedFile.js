// @flow
'use strict';

const yaml = require('js-yaml');
const requireFromString = require('require-from-string');
const readFile = require('./readFile');
const parseJson = require('./parseJson');
const path = require('path');

module.exports = function loadDefinedFile(
  filepath: string,
  options: {
    sync?: boolean,
    format?: 'json' | 'yaml' | 'js',
  }
): Promise<?CosmiconfigResult> | ?CosmiconfigResult {
  function parseContent(content: ?string): ?CosmiconfigResult {
    if (!content) {
      return { config: undefined, filepath, isEmpty: true };
    }

    let parsedConfig;

    switch (options.format || inferFormat(filepath)) {
      case 'json':
        parsedConfig = parseJson(content, filepath);
        break;
      case 'yaml':
        parsedConfig = yaml.safeLoad(content, {
          filename: filepath,
        });
        break;
      case 'js':
        parsedConfig = requireFromString(content, filepath);
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

  return !options.sync
    ? readFile(filepath, { throwNotFound: true }).then(parseContent)
    : parseContent(readFile.sync(filepath, { throwNotFound: true }));
};

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
    const result = yaml.safeLoad(content, {
      filename: filepath,
    });
    if (typeof result === 'string') {
      return cb();
    }
    return result;
  } catch (e) {
    return cb();
  }
}

function tryRequire(content: string, filepath: string, cb: () => ?Object) {
  try {
    return requireFromString(content, filepath);
  } catch (e) {
    return cb();
  }
}
