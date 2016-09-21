'use strict';

const fs = require('graceful-fs');

const yaml = require('js-yaml');
const parseJson = require('parse-json');
const requireFromString = require('require-from-string');

module.exports = function (filepath, expectedFormat) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (fileError, content) => {
      if (fileError) return reject(fileError);
      resolve(content);
    });
  }).then((content) => {
    const parsedConfig = (function () {
      switch (expectedFormat) {
        case 'json':
          return parseJson(content, filepath);
        case 'yaml':
          return yaml.safeLoad(content, {
            filename: filepath,
          });
        case 'js':
          return requireFromString(content, filepath);
        default:
          return tryAllParsing(content, filepath);
      }
    })();

    if (!parsedConfig) {
      throw new Error(
        'Failed to parse "' + filepath + '" as JSON, JS, or YAML.'
      );
    }

    return {
      config: parsedConfig,
      filepath: filepath,
    };
  });
};

function tryAllParsing(content, filepath) {
  return tryYaml(content, filepath, () => {
    return tryRequire(content, filepath, () => {
      return null;
    });
  });
}

function tryYaml(content, filepath, cb) {
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

function tryRequire(content, filepath, cb) {
  try {
    return requireFromString(content, filepath);
  } catch (e) {
    return cb();
  }
}
