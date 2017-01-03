'use strict';

var yaml = require('js-yaml');
var irequire = require('./require');
var readFile = require('./readFile');
var parseJson = require('./parseJson');

module.exports = function (filepath, options) {
  return readFile(filepath, { throwNotFound: true }).then(function (content) {
    var parsedConfig = (function () {
      switch (options.format) {
        case 'json':
          return parseJson(content, filepath);
        case 'yaml':
          return yaml.safeLoad(content, {
            filename: filepath,
          });
        case 'js':
          return irequire(filepath);
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
  return tryYaml(content, filepath, function () {
    return tryRequire(filepath, function () {
      return null;
    });
  });
}

function tryYaml(content, filepath, cb) {
  try {
    var result = yaml.safeLoad(content, {
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

function tryRequire(filepath, cb) {
  try {
    return irequire(filepath);
  } catch (e) {
    return cb();
  }
}
