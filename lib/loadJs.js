'use strict';

var Promise = require('pinkie-promise');
var requireFromString = require('require-from-string');

module.exports = function(filepath) {
  var fs = require('graceful-fs');
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

    return {
      config: requireFromString(content, filepath),
      filepath: filepath,
    };
  });
};
