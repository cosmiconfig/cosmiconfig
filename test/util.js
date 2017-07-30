'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const sinon = require('sinon');

exports.statStubIsDirectory = function statStubIsDirectory(result) {
  sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => result,
  });

  sinon.stub(fs, 'statSync').callsFake(() => ({
    isDirectory: () => result,
  }));
};

exports.absolutePath = function absolutePath(str) {
  return path.join(__dirname, str);
};

exports.makeReadFileSyncStub = function makeReadFileSyncStub(readFile) {
  return sinon.stub(fs, 'readFileSync').callsFake((search, encoding) => {
    let errSync, contentsSync;

    readFile(search, encoding, (err, contents) => {
      errSync = err;
      contentsSync = contents;
    });

    if (errSync) throw errSync;

    return contentsSync;
  });
};

exports.assertSearchSequence = function assertSearchSequence(
  assert,
  readFileStub,
  searchPaths,
  startCount
) {
  startCount = startCount || 0;
  assert.equal(readFileStub.callCount, searchPaths.length + startCount);
  searchPaths.forEach((searchPath, i) => {
    assert.equal(
      _.get(readFileStub.getCall(i + startCount), 'args[0]'),
      path.join(__dirname, searchPath),
      `checked ${searchPath}`
    );
  });
};

exports.failAssert = function failAssert(assert) {
  assert.fail('should have errored');
  assert.end();
};
