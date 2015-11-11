'use strict';

var path = require('path');
var fs = require('graceful-fs');
var Promise = require('pinkie-promise');
var parseJson = require('parse-json');

module.exports = function(packageDir, packageProp) {
  var packagePath = path.join(packageDir, 'package.json');
  return new Promise(function(resolve) {
    fs.readFile(packagePath, 'utf8', function(fileError, content) {
      if (fileError) return resolve(null);

      var parsedContent = parseJson(content);
      var packagePropValue = parsedContent[packageProp];
      if (!packagePropValue) return resolve(null);

      resolve({
        config: packagePropValue,
        filepath: packagePath,
      });
    });
  });
};
