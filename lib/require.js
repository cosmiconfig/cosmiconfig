'use strict';

module.exports = function (path) {
  var obj = require(path);
  return obj && obj.__esModule ? obj['default'] : obj;
};
