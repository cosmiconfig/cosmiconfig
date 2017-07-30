'use strict';

const fs = require('fs');

const sinon = require('sinon');

module.exports = function makeReadFileSyncStub(readFile) {
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
