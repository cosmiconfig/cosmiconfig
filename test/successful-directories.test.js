'use strict';

var test = require('ava');
var sinon = require('sinon');
var path = require('path');
var fs = require('fs');
var cosmiconfig = require('..');
var assertSearchSequence = require('./assertSearchSequence');

function absolutePath(str) {
  return path.join(__dirname, str);
}

var statStub;
var readFileStub;

test.beforeEach(function () {
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: function () {
      return true;
    },
  });
});

test.afterEach(function () {
  if (readFileStub.restore) readFileStub.restore();
  if (statStub.restore) statStub.restore();
});

test.serial('find rc file in third searched dir, with a package.json lacking prop', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
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
        callback(null, '{ "found": true }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/.foorc'),
    });
  });
});

test.serial('find package.json prop in second searched dir', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/foo.config.js'):
      case absolutePath('a/b/c/d/e/.foorc'):
      case absolutePath('a/b/c/d/e/foo.config.js'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/package.json'):
        callback(null, '{ "author": "Todd", "foo": { "found": true } }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/package.json',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/package.json'),
    });
  });
});

test.serial('find JS file in first searched dir', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/package.json'):
      case absolutePath('a/b/c/d/e/.foorc'):
      case absolutePath('a/b/c/d/e/foo.config.js'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/f/foo.config.js'):
        callback(null, 'module.exports = { found: true };');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/f/foo.config.js'),
    });
  });
});

test.serial('find package.json in second directory searched, with alternate names', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.wowza'):
      case absolutePath('a/b/c/d/e/f/wowzaConfig.js'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/package.json'):
        callback(null, '{ "heeha": { "found": true } }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    rc: '.wowza',
    js: 'wowzaConfig.js',
    packageProp: 'heeha',
    stopDir: absolutePath('.'),
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.wowza',
      'a/b/c/d/e/f/wowzaConfig.js',
      'a/b/c/d/e/package.json',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/package.json'),
    });
  });
});

test.serial('find rc file in third searched dir, skipping packageProp, with rcStrictJson', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/foo.config.js'):
      case absolutePath('a/b/c/d/e/package.json'):
      case absolutePath('a/b/c/d/e/.foorc'):
      case absolutePath('a/b/c/d/e/foo.config.js'):
      case absolutePath('a/b/c/d/package.json'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/.foorc'):
        callback(null, '{ "found": true }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    packageProp: false,
    rcStrictJson: true,
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/.foorc',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/.foorc'),
    });
  });
});

test.serial('find package.json prop in second searched dir, skipping js and rc', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/foo.config.js'):
      case absolutePath('a/b/c/d/e/.foorc'):
      case absolutePath('a/b/c/d/e/foo.config.js'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/package.json'):
        callback(null, '{ "author": "Todd", "foo": { "found": true } }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    js: false,
    rc: false,
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/package.json',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/package.json'),
    });
  });
});

// RC file with specified extension

test.serial('with rcExtensions, find .foorc.json in second searched dir', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/.foorc.json'):
      case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
      case absolutePath('a/b/c/d/e/f/.foorc.yml'):
      case absolutePath('a/b/c/d/e/f/.foorc.js'):
      case absolutePath('a/b/c/d/e/f/foo.config.js'):
      case absolutePath('a/b/c/d/e/package.json'):
      case absolutePath('a/b/c/d/e/.foorc'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/.foorc.json'):
        callback(null, '{ "found": true }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
      'a/b/c/d/e/f/.foorc.yml',
      'a/b/c/d/e/f/.foorc.js',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/.foorc.json',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/.foorc.json'),
    });
  });
});

test.serial('with rcExtensions, find .foorc.yaml in first searched dir', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/.foorc.json'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
        callback(null, 'found: true');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/f/.foorc.yaml'),
    });
  });
});

test.serial('with rcExtensions, find .foorc.yml in first searched dir', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/.foorc.json'):
      case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/f/.foorc.yml'):
        callback(null, 'found: true');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
      'a/b/c/d/e/f/.foorc.yml',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/f/.foorc.yml'),
    });
  });
});

test.serial('with rcExtensions, find .foorc.js in first searched dir', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/.foorc.json'):
      case absolutePath('a/b/c/d/e/f/.foorc.yaml'):
      case absolutePath('a/b/c/d/e/f/.foorc.yml'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/f/.foorc.js'):
        callback(null, 'module.exports = { found: true };');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;

  return loadConfig(startDir).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
      'a/b/c/d/e/f/.foorc.yml',
      'a/b/c/d/e/f/.foorc.js',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/f/.foorc.js'),
    });
  });
});
