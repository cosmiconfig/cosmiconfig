'use strict';

var fs = require('fs');

var sinon = require('sinon');

module.exports = function makeReadFileSyncStub(readFile) {
  return sinon
    .stub(fs, 'readFileSync')
    .callsFake(function readFileSync(search, encoding) {
      var errSync, contentsSync;

      readFile(search, encoding, function(err, contents) {
        errSync = err;
        contentsSync = contents;
      });

      if (errSync) throw errSync;

      return contentsSync;
    });
};
