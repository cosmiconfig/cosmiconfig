'use strict';

const test = require('ava');
const sinon = require('sinon');
const path = require('path');
const fs = require('graceful-fs');
const _ = require('lodash');
const cosmiconfig = require('..');
const assertSearchSequence = require('./assertSearchSequence');

function absolutePath(str) {
  return path.join(__dirname, str);
}

let cachedLoadConfig;
let statStub;
let readFileStub;

function statStubIsDirectory(result) {
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => result,
  });
}

test.before(() => {
  cachedLoadConfig = cosmiconfig('foo').load;
});

// The tests below rely both on this directory structure and on the
// order in which they run!
test.beforeEach(() => {
  readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/foo.config.js'):
      case absolutePath('a/b/c/d/e/package.json'):
      case absolutePath('a/b/c/d/e/.foorc'):
      case absolutePath('a/b/c/d/e/foo.config.js'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/package.json'):
        callback(null, '{ "false": "hope" }');
        break;
      case absolutePath('a/b/c/d/.foorc'):
        callback(null, '{ "foundInD": true }');
        break;
      case absolutePath('a/b/c/d/foo.config.js'):
      case absolutePath('a/b/c/package.json'):
      case absolutePath('a/b/c/.foorc'):
      case absolutePath('a/b/c/foo.config.js'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/package.json'):
        callback(null, '{ "foundInB": true }');
        break;
      default:
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });
});

test.afterEach(() => {
  if (readFileStub.restore) readFileStub.restore();
  if (statStub.restore) statStub.restore();
});

test.serial('does not use cache at first', (assert) => {
  const searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    assert.deepEqual(result, expectedResult);
  });
});

test.serial('uses cache for already-visited directories', (assert) => {
  // E and D visited above
  const searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assert.is(readFileStub.callCount, 0, 'no new calls');
    assert.deepEqual(result, expectedResult);
  });
});

test.serial('uses cache for file in already-visited directories', (assert) => {
  // E and D visited above
  const searchPath = absolutePath('a/b/c/d/e/foo.js');
  statStubIsDirectory(false);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assert.is(readFileStub.callCount, 0, 'no new calls');
    assert.deepEqual(result, expectedResult);
  });
});

test.serial('uses cache when some directories in search were already visted', (assert) => {
  // E and D visited above, not F
  const searchPath = absolutePath('a/b/c/d/e/f');
  statStubIsDirectory(true);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
    ]);
    assert.deepEqual(result, expectedResult);
  });
});

test.serial('does not use cache for unvisited config file', (assert) => {
  // B not yet visited
  const configFile = absolutePath( 'a/b/package.json');
  statStubIsDirectory(false);

  const expectedResult = {
    filepath: absolutePath('a/b/package.json'),
    config: {
      foundInB: true,
    },
  };

  return cachedLoadConfig(null, configFile).then((result) => {
    assert.is(readFileStub.callCount, 1, 'uses readFile once for reading, no cache');
    assert.deepEqual(result, expectedResult);
  });
});

test.serial('does not use cache with a new cosmiconfig instance', (assert) => {
  const searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  const loadConfig = cosmiconfig('foo').load;

  return loadConfig(searchPath).then((result) => {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    assert.deepEqual(result, expectedResult);
  });
});

test.serial('but cache on old instance still works', (assert) => {
  const searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assert.is(readFileStub.callCount, 0, 'no file reading!');
    assert.deepEqual(result, expectedResult);
  });
});

test.serial('does not cache if you say no', (assert) => {
  const searchPath = absolutePath('a/b/c/d');
  statStubIsDirectory(true);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  const loadConfig = cosmiconfig('foo', {
    cache: false,
  }).load;

  // Same call three times hits the file system every time
  return Promise.resolve()
    .then(() => {
      return loadConfig(searchPath).then((result) => {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ], 0);
        assert.deepEqual(result, expectedResult);
      });
    })
    .then(() => {
      return loadConfig(searchPath).then((result) => {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ], 2);
        assert.deepEqual(result, expectedResult);
      });
    })
    .then(() => {
      return loadConfig(searchPath).then((result) => {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ], 4);
        assert.deepEqual(result, expectedResult);
      });
    });
});
