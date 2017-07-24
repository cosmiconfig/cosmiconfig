'use strict';

var path = require('path');
var readFile = require('./readFile');
var parseJson = require('./parseJson');

module.exports = function(packageDir, options) {
  var packagePath = path.join(packageDir, 'package.json');

  function parseContent(content) {
    if (!content) return null;
    var parsedContent = parseJson(content, packagePath);
    var packagePropValue = parsedContent[options.packageProp];
    if (!packagePropValue) return null;

    return {
      config: packagePropValue,
      filepath: packagePath,
    };
  }

  return !options.sync
    ? readFile(packagePath).then(parseContent)
    : parseContent(readFile.sync(packagePath));
};
