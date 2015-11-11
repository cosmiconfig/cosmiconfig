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

      var parsedConfig;
      try {
        parsedConfig = (function() {
          switch (expectedFormat) {
            case 'json':
              return parseJson(content);
            case 'yaml':
              return yaml.safeLoad(content);
            case 'js':
              return requireFromString(content);
            default:
              return tryAllParsing(content);
          }
        })();
      } catch (parseError) {
        return reject(parseError);
      }

      // require-from-string will return unparseable JS as a string
      if (!parsedConfig || typeof parsedConfig === 'string') {
        return reject(new Error(
          'Failed to parse "' + filepath + '" as JSON, JS, or YAML.'
        ));
      }

      resolve({
        config: parsedConfig,
        filepath: filepath,
      });
    });
  });
};

function tryAllParsing(content) {
  return tryParsing(content, parseJson, function() {
    return tryParsing(content, yaml.safeLoad, function() {
      return tryParsing(content, requireFromString, function() {
        return null;
      });
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
