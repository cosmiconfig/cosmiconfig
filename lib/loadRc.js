'use strict';

var path = require('path');
var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var yaml = require('js-yaml');
var parseJson = require('parse-json');

module.exports = function(searchPath, rcName) {
  var searchFilepath = path.join(searchPath, rcName);
  return new Promise(function(resolve) {
    fs.readFile(searchFilepath, 'utf8', function(err, content) {
      if (err) {
        resolve(null);
        return;
      }
      var parsedConfig = (content[0] === '{')
        ? parseJson(content)
        : yaml.safeLoad(content);
      resolve({
        config: parsedConfig,
        filepath: searchFilepath,
      });
    });
  });
}
