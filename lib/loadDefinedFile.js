'use strict';

var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var yaml = require('js-yaml');
var parseJson = require('parse-json');
var requireFromString = require('require-from-string');

module.exports = function(filepath, expectedFormat) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filepath, 'utf8', function(fileError, content) {
      if (fileError) return reject(fileError);
      resolve(content);
    });
  }).then(function(content) {
    var parsedConfig = (function() {
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

    // require-from-string will return unparseable JS as a string
    if (!parsedConfig || typeof parsedConfig === 'string') {
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

function tryAllParsing(content) {
  return tryParsing(content, yaml.safeLoad, function() {
    return tryParsing(content, requireFromString, function() {
      return null;
    });
  });
}

function tryParsing(content, parser, cb) {
  try {
    return parser(content);
  } catch (e) {
    return cb();
  }
}
