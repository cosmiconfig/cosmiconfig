'use strict';

var test = require('tape');
var sinon = require('sinon');
var path = require('path');
var fs = require('fs');
var cosmiconfig = require('..');
var assertSearchSequence = require('./assertSearchSequence');

function absolutePath(str) {
  return path.join(__dirname, str);
}

var cachedLoadConfig;
var statStub;
var readFileStub;

function statStubIsDirectory(result) {
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: function () {
      return result;
    },
  });
}

cachedLoadConfig = cosmiconfig('foo').load;

// The tests below rely both on this directory structure and on the
// order in which they run!
function setup() {
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
        callback(new Error('irrelevant path ' + searchPath));
    }
  });
}

function teardown(assert, err) {
  if (readFileStub.restore) readFileStub.restore();
  if (statStub.restore) statStub.restore();
  assert.end(err);
}

test('does not use cache at first', function (assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  cachedLoadConfig(searchPath).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    assert.deepEqual(result, expectedResult);
    teardown(assert);
  }).catch(function (err) {
    teardown(assert, err);
  });
});

test('uses cache for already-visited directories', function (assert) {
  setup();
  // E and D visited above
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  cachedLoadConfig(searchPath).then(function (result) {
    assert.equal(readFileStub.callCount, 0, 'no new calls');
    assert.deepEqual(result, expectedResult);
    teardown(assert);
  }).catch(function (err) {
    teardown(assert, err);
  });
});

test('uses cache for file in already-visited directories', function (assert) {
  setup();
  // E and D visited above
  var searchPath = absolutePath('a/b/c/d/e/foo.js');
  statStubIsDirectory(false);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  cachedLoadConfig(searchPath).then(function (result) {
    assert.equal(readFileStub.callCount, 0, 'no new calls');
    assert.deepEqual(result, expectedResult);
    teardown(assert);
  }).catch(function (err) {
    teardown(assert, err);
  });
});

test('uses cache when some directories in search were already visted', function (assert) {
  setup();
  // E and D visited above, not F
  var searchPath = absolutePath('a/b/c/d/e/f');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  cachedLoadConfig(searchPath).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
    ]);
    assert.deepEqual(result, expectedResult);
    teardown(assert);
  }).catch(function (err) {
    teardown(assert, err);
  });
});

test('does not use cache for unvisited config file', function (assert) {
  setup();
  // B not yet visited
  var configFile = absolutePath( 'a/b/package.json');
  statStubIsDirectory(false);

  var expectedResult = {
    filepath: absolutePath('a/b/package.json'),
    config: {
      foundInB: true,
    },
  };

  cachedLoadConfig(null, configFile).then(function (result) {
    assert.equal(readFileStub.callCount, 1, 'uses readFile once for reading, no cache');
    assert.deepEqual(result, expectedResult);
    teardown(assert);
  }).catch(function (err) {
    teardown(assert, err);
  });
});

test('does not use cache with a new cosmiconfig instance', function (assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  var loadConfig = cosmiconfig('foo').load;

  loadConfig(searchPath).then(function (result) {
    assertSearchSequence(assert, readFileStub, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    assert.deepEqual(result, expectedResult);
    teardown(assert);
  }).catch(function (err) {
    teardown(assert, err);
  });
});

test('but cache on old instance still works', function (assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  cachedLoadConfig(searchPath).then(function (result) {
    assert.equal(readFileStub.callCount, 0, 'no file reading!');
    assert.deepEqual(result, expectedResult);
    teardown(assert);
  }).catch(function (err) {
    teardown(assert, err);
  });
});

test('does not cache if you say no', function (assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  var loadConfig = cosmiconfig('foo', {
    cache: false,
  }).load;

  // Same call three times hits the file system every time
  Promise.resolve()
    .then(function () {
      return loadConfig(searchPath).then(function (result) {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ], 0);
        assert.deepEqual(result, expectedResult);
      });
    })
    .then(function () {
      return loadConfig(searchPath).then(function (result) {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ], 2);
        assert.deepEqual(result, expectedResult);
      });
    })
    .then(function () {
      return loadConfig(searchPath).then(function (result) {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ], 4);
        assert.deepEqual(result, expectedResult);
        teardown(assert);
      });
    }).catch(function (err) {
      teardown(assert, err);
    });
});

test('clearFileCache', function (assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/.foorc');
  statStubIsDirectory(false);
  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };
  var explorer = cosmiconfig('foo');

  Promise.resolve()
    .then(function () {
      return explorer.load(null, searchPath).then(function (result) {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/.foorc',
        ], 0);
        assert.deepEqual(result, expectedResult);
      });
    })
    .then(function () {
      return explorer.load(null, searchPath).then(function (result) {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/.foorc',
        ], 0);
        assert.deepEqual(result, expectedResult);
      });
    })
    .then(function () {
      explorer.clearFileCache();
    })
    .then(function () {
      return explorer.load(null, searchPath).then(function (result) {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/.foorc',
          'a/b/c/d/.foorc',
        ], 0);
        assert.deepEqual(result, expectedResult);
        teardown(assert);
      });
    }).catch(function (err) {
      teardown(assert, err);
    });
});

test('clearDirectoryCache', function (assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);
  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };
  var explorer = cosmiconfig('foo');

  Promise.resolve()
    .then(function () {
      return explorer.load(searchPath).then(function (result) {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/e/package.json',
          'a/b/c/d/e/.foorc',
          'a/b/c/d/e/foo.config.js',
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ], 0);
        assert.deepEqual(result, expectedResult);
      });
    })
    .then(function () {
      return explorer.load(searchPath).then(function (result) {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/e/package.json',
          'a/b/c/d/e/.foorc',
          'a/b/c/d/e/foo.config.js',
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ], 0);
        assert.deepEqual(result, expectedResult);
      });
    })
    .then(function () {
      explorer.clearDirectoryCache();
    })
    .then(function () {
      return explorer.load(searchPath).then(function (result) {
        assertSearchSequence(assert, readFileStub, [
          'a/b/c/d/e/package.json',
          'a/b/c/d/e/.foorc',
          'a/b/c/d/e/foo.config.js',
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
          'a/b/c/d/e/package.json',
          'a/b/c/d/e/.foorc',
          'a/b/c/d/e/foo.config.js',
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ], 0);
        assert.deepEqual(result, expectedResult);
        teardown(assert);
      });
    }).catch(function (err) {
      teardown(assert, err);
    });
});
