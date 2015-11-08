'use strict';

var fs = require('graceful-fs');
var yaml = require('js-yaml');
var parseJson = require('parse-json');
var requireFromString = require('require-from-string');

module.exports = function(configPath, configFormat) {
  return new Promise(function(resolve) {
    fs.readFile(configPath, 'utf8', function(err, content) {
      if (err) throw err;

      var parsedConfig = (function() {
        switch (configFormat) {
          case 'yaml':
            return yaml.safeLoad(content);
          case 'json':
            return parseJson(content);
          case 'js':
            return requireFromString(content);
          default:
            return tryAllParsing(content);
        }
      })();

      if (!parsedConfig) {
        throw new Error(
          'Failed to parse "' + configPath + '" as JSON, JS, ' +
          'or YAML. Please specify a configFormat to see syntax errors.'
        );
      }

      resolve({
        config: parsedConfig,
        filepath: configPath,
      });
    });
  });
}

function tryAllParsing(content) {
  return tryParsing(content, parseJson, function() {
    return tryParsing(content, requireFromString, function() {
      return tryParsing(content, yaml.safeLoad, function() {
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
