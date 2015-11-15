'use strict';

var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var yaml = require('js-yaml');
var parseJson = require('parse-json');

module.exports = function(filepath, options) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filepath, 'utf8', function(fileError, content) {
      if (fileError) {
        if (fileError.code === 'ENOENT') return resolve(null);
        return reject(fileError);
      }
      resolve(content);
    });
  }).then(function(content) {
    if (!content) return null;

    var parsedConfig = (options.strictJson)
      ? parseJson(content)
      : yaml.safeLoad(content);

    return {
      config: parsedConfig,
      filepath: filepath,
    };
  });
};
