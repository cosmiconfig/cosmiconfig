'use strict';

var _ = require('lodash');
var path = require('path');

module.exports = function(assert, readFileStub, searchPaths, startCount) {
  startCount = startCount || 0;
  assert.equal(readFileStub.callCount, searchPaths.length + startCount);
  searchPaths.forEach(function(searchPath, i) {
    assert.equal(
      _.get(readFileStub.getCall(i + startCount), 'args[0]'),
      path.join(__dirname, searchPath),
      'checked ' + searchPath
    );
  });
};
