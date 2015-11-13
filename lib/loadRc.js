'use strict';

var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var yaml = require('js-yaml');
var parseJson = require('parse-json');

module.exports = function(filepath) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filepath, 'utf8', function(fileError, content) {
      if (fileError) {
        if (fileError.code === 'ENOENT') return resolve(null);
        return reject(fileError);
      }

      var parsedConfig = (content[0] === '{')
        ? parseJson(content)
        : yaml.safeLoad(content);

      resolve({
        config: parsedConfig,
        filepath: filepath,
      });
    });
  });
};
