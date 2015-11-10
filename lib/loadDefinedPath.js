'use strict';

var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var yaml = require('js-yaml');
var parseJson = require('parse-json');
var requireFromString = require('require-from-string');

module.exports = function(configPath, configFormat) {
  return new Promise(function(resolve) {
    fs.readFile(configPath, 'utf8', function(err, content) {
      if (err) throw err;

      var parsedConfig = (function() {
        switch (configFormat) {
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

      if (!parsedConfig) {
        throw new Error(
          'Failed to parse "' + configPath + '" as JSON, JS, or YAML.'
        );
      }

      resolve({
        config: parsedConfig,
        filepath: configPath,
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
