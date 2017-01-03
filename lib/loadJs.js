'use strict';

var readFile = require('./readFile');
var irequire = require('./require');

module.exports = function (filepath) {
  return readFile(filepath).then(function (content) {
    if (!content) return null;

    return {
      config: irequire(filepath),
      filepath: filepath,
    };
  });
};
