'use strict';

var path = require('path');
var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var requireFromString = require('require-from-string');

module.exports = function(searchPath, jsName) {
  var searchFilepath = path.join(searchPath, jsName);
  return new Promise(function(resolve) {
    fs.readFile(searchFilepath, 'utf8', function(err, content) {
      if (err) {
        resolve(null);
        return;
      }
      resolve({
        config: requireFromString(content, searchFilepath),
        filepath: searchFilepath,
      });
    });
  });
}
