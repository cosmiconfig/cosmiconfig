'use strict';

var path = require('path');
var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var parseJson = require('parse-json');

module.exports = function(searchPath, packageProp) {
  var searchFilepath = path.join(searchPath, 'package.json');
  return new Promise(function(resolve) {
    fs.readFile(searchFilepath, 'utf8', function(err, content) {
      if (err) {
        resolve(null);
        return;
      }
      var parsedContent = parseJson(content);
      var packagePropValue = parsedContent[packageProp];
      if (!packagePropValue) {
        resolve(null);
        return;
      }
      resolve({
        config: packagePropValue,
        filepath: searchFilepath,
      });
    });
  });
};
