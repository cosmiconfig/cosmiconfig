'use strict';

const path = require('path');

exports.absolutePath = function absolutePath(str) {
  return path.join(__dirname, str);
};

exports.failAssert = function failAssert(assert) {
  assert.fail('should have errored');
  assert.end();
};
