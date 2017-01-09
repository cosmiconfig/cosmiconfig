'use strict';

var jph = require('json-parse-helpfulerror');

module.exports = function (json, filepath) {
  try {
    return jph.parse(json);
  } catch (err) {
    err.message = 'JSON Error in ' + filepath + ':\n' + err.message;
    throw err;
  }
};
