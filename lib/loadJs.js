'use strict';

var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var requireFromString = require('require-from-string');

module.exports = function(filepath) {
  return new Promise(function(resolve) {
    fs.readFile(filepath, 'utf8', function(fileError, content) {
      if (fileError) return resolve(null);

      resolve({
        config: requireFromString(content, filepath),
        filepath: filepath,
      });
    });
  });
};
