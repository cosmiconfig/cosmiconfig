'use strict';

var readFile = require('./readFile');
var importJs = require('./require');

module.exports = function (filepath) {
  return readFile(filepath).then(function (content) {
    if (!content) return null;

    return {
      config: importJs(filepath),
      filepath: filepath,
    };
  });
};
