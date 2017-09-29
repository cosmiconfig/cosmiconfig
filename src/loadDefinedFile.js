// @flow
'use strict';

const yaml = require('js-yaml');
const requireFromString = require('require-from-string');
const readFile = require('./readFile');
const parseJson = require('./parseJson');

module.exports = function loadDefinedFile(
  filepath: string,
  options: {
    sync?: boolean,
    format?: 'json' | 'yaml' | 'js',
  }
): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
  function parseContent(content: ?string): ?cosmiconfig$Result {
    if (!content) {
      throw new Error(`Config file is empty! Filepath - "${filepath}".`);
    }

    let parsedConfig;

    const format =
      options.format ||
      (/\.(js)$/.test(filepath)
        ? 'js'
        : /\.(json)$/.test(filepath)
          ? 'json'
          : /\.(yml|yaml)$/.test(filepath) ? 'yaml' : undefined);

    switch (format) {
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
