'use strict';

const _ = require('lodash');
const path = require('path');

module.exports = function (assert, readFileStub, searchPaths, startCount) {
  startCount = startCount || 0;
  assert.is(readFileStub.callCount, searchPaths.length + startCount);
  searchPaths.forEach((searchPath, i) => {
    assert.is(
      _.get(readFileStub.getCall(i + startCount), 'args[0]'),
      path.join(__dirname, searchPath),
      `checked ${searchPath}`
    );
  });
};
