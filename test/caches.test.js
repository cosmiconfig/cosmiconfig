'use strict';

const test = require('ava');
const sinon = require('sinon');
const path = require('path');
const fs = require('graceful-fs');
const _ = require('lodash');
const cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

let cachedLoadConfig;
let statStub;
let readFileStub;

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
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => true,
  });

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assert.is(readFileStub.callCount, 5);

    assert.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/package.json'),
      'first dir: checked a/b/c/d/e/package.json');
    assert.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/.foorc'),
      'first dir: checked a/b/c/d/e/.foorc');
    assert.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/foo.config.js'),
      'first dir: checked a/b/c/d/e/foo.config.js');
    assert.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/package.json'),
      'first dir: checked a/b/c/d/package.json');
    assert.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/b/c/d/.foorc'),
      'first dir: checked a/b/c/d/.foorc');

    assert.deepEqual(result, expectedResult);
  });
});

test.serial('uses cache for already-passed directory', (assert) => {
  const searchPath = absolutePath('a/b/c/d/e');
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => true,
  });

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

test.serial('uses cache for directories already visted', (assert) => {
  const searchPath = absolutePath('a/b/c/d/e/f');
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => true,
  });

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assert.is(readFileStub.callCount, 3, 'uses cache for 2 directories');

    assert.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked a/b/c/d/e/f/package.json');
    assert.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked a/b/c/d/e/f/.foorc');
    assert.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked a/b/c/d/e/f/foo.config.js');

    assert.deepEqual(result, expectedResult);
  });
});

test.serial('does not use cache for unvisited file', (assert) => {
  const searchPath = absolutePath('a/b/package.json');
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => false,
  });

  const expectedResult = {
    filepath: absolutePath('a/b/package.json'),
    config: {
      foundInB: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assert.is(readFileStub.callCount, 1, 'uses readFile once for reading, no cache');
    assert.deepEqual(result, expectedResult);
  });
});

test.serial('uses cache to load visited file in unvisited directory', (assert) => {
  const searchPath = absolutePath('a/b/c');
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => true,
  });

  const expectedResult = {
    filepath: absolutePath('a/b/package.json'),
    config: {
      foundInB: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assert.is(readFileStub.callCount, 3, 'does not call re-read the file already-visited file');

    assert.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/package.json'),
      'first dir: checked a/b/c/package.json');
    assert.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/.foorc'),
      'first dir: checked a/b/c/.foorc');
    assert.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/foo.config.js'),
      'first dir: checked a/b/c/foo.config.js');

    assert.deepEqual(result, expectedResult);
  });
});

test.serial('uses cache for already-read-and-parsed file', (assert) => {
  const searchPath = absolutePath('a/b/c/d/.foorc');
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => false,
  });

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  return cachedLoadConfig(searchPath).then((result) => {
    assert.is(readFileStub.callCount, 0, 'no calls necessary');
    assert.deepEqual(result, expectedResult);
  });
});

test.serial('does not use cache with a new cosmiconfig instance', (assert) => {
  const searchPath = absolutePath('a/b/c/d/e');
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => true,
  });

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: {
      foundInD: true,
    },
  };

  const loadConfig = cosmiconfig('foo').load;

  return loadConfig(searchPath).then((result) => {
    assert.is(readFileStub.callCount, 5);

    assert.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/package.json'),
      'first dir: checked a/b/c/d/e/package.json');
    assert.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/.foorc'),
      'first dir: checked a/b/c/d/e/.foorc');
    assert.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/foo.config.js'),
      'first dir: checked a/b/c/d/e/foo.config.js');
    assert.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/package.json'),
      'first dir: checked a/b/c/d/package.json');
    assert.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/b/c/d/.foorc'),
      'first dir: checked a/b/c/d/.foorc');

    assert.deepEqual(result, expectedResult);
  });
});

test.serial('but cache on old instance still works', (assert) => {
  const searchPath = absolutePath('a/b/c/d/e');
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => true,
  });

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
