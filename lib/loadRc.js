'use strict';

var path = require('path');
var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var yaml = require('js-yaml');

module.exports = function(searchPath, rcName) {
  var searchFilepath = path.join(searchPath, rcName);
  return new Promise(function(resolve) {
    fs.readFile(searchFilepath, 'utf8', function(err, content) {
      if (err) {
        resolve(null);
        return;
      }
      resolve({
        config: yaml.safeLoad(content),
        filepath: searchFilepath,
      });
    });
  });
}
