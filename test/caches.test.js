'use strict';

var test = require('tape');
var sinon = require('sinon');
var fs = require('fs');
var cosmiconfig = require('..');
var assertSearchSequence = require('./assertSearchSequence');
var makeReadFileSyncStub = require('./makeReadFileSyncStub');
var util = require('./util');

var absolutePath = util.absolutePath;

var cachedLoadConfig;
var cachedLoadConfigSync;
var statStub;
var statSyncStub;
var readFileStub;
var readFileSyncStub;

function statStubIsDirectory(result) {
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: function() {
      return result;
    },
  });

  statSyncStub = sinon.stub(fs, 'statSync').callsFake(function() {
    return {
      isDirectory: function() {
        return result;
      },
    };
  });
}

cachedLoadConfig = cosmiconfig('foo').load;
cachedLoadConfigSync = cosmiconfig('foo', { sync: true }).load;

// The tests below rely both on this directory structure and on the
// order in which they run!
function setup() {
  function readFile(searchPath, encoding, callback) {
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
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);

  readFileSyncStub = makeReadFileSyncStub(readFile);
}

function teardown(assert, err) {
  if (readFileStub.restore) readFileStub.restore();
  if (readFileSyncStub.restore) readFileSyncStub.restore();
  if (statStub.restore) statStub.restore();
  if (statSyncStub.restore) statSyncStub.restore();
  assert.end(err);
}

test('does not use cache at first', function(assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    assert.deepEqual(result, expectedResult);
  }

  try {
    var result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(function(result) {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('uses cache for already-visited directories', function(assert) {
  setup();
  // E and D visited above
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub) {
    assert.equal(stub.callCount, 0, 'no new calls');
    assert.deepEqual(result, expectedResult);
  }

  try {
    var result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(function(result) {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('uses cache for file in already-visited directories', function(assert) {
  setup();
  // E and D visited above
  var searchPath = absolutePath('a/b/c/d/e/foo.js');
  statStubIsDirectory(false);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub) {
    assert.equal(stub.callCount, 0, 'no new calls');
    assert.deepEqual(result, expectedResult);
  }

  try {
    var result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(function(result) {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('uses cache when some directories in search were already visted', function(
  assert
) {
  setup();
  // E and D visited above, not F
  var searchPath = absolutePath('a/b/c/d/e/f');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
    ]);
    assert.deepEqual(result, expectedResult);
  }

  try {
    var result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(function(result) {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('does not use cache for unvisited config file', function(assert) {
  setup();
  // B not yet visited
  var configFile = absolutePath('a/b/package.json');
  statStubIsDirectory(false);

  var expectedResult = {
    filepath: absolutePath('a/b/package.json'),
    config: {
      foundInB: true,
    },
  };

  function doAsserts(result, stub) {
    assert.equal(stub.callCount, 1, 'uses readFile once for reading, no cache');
    assert.deepEqual(result, expectedResult);
  }

  try {
    var result = cachedLoadConfigSync(null, configFile);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(null, configFile)
      .then(function(result) {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('does not use cache with a new cosmiconfig instance', function(assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    assert.deepEqual(result, expectedResult);
  }

  var loadConfig = cosmiconfig('foo').load;
  var loadConfigSync = cosmiconfig('foo', { sync: true }).load;

  try {
    var result = loadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    loadConfig(searchPath)
      .then(function(result) {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('but cache on old instance still works', function(assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub) {
    assert.equal(stub.callCount, 0, 'no file reading!');
    assert.deepEqual(result, expectedResult);
  }

  try {
    var result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(function(result) {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('does not cache if you say no', function(assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d');
  statStubIsDirectory(true);

  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub, cnt) {
    assertSearchSequence(
      assert,
      stub,
      ['a/b/c/d/package.json', 'a/b/c/d/.foorc'],
      cnt
    );
    assert.deepEqual(result, expectedResult);
  }

  var loadConfig = cosmiconfig('foo', { cache: false }).load;
  var loadConfigSync = cosmiconfig('foo', { cache: false, sync: true }).load;

  try {
    var result = loadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub, 0);
    result = loadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub, 2);
    result = loadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub, 4);

    // Same call three times hits the file system every time
    Promise.resolve()
      .then(function() {
        return loadConfig(searchPath).then(function(result) {
          doAsserts(result, readFileStub, 0);
        });
      })
      .then(function() {
        return loadConfig(searchPath).then(function(result) {
          doAsserts(result, readFileStub, 2);
        });
      })
      .then(function() {
        return loadConfig(searchPath).then(function(result) {
          doAsserts(result, readFileStub, 4);
          teardown(assert);
        });
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('clearFileCache', function(assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/.foorc');
  statStubIsDirectory(false);
  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAssert(result, stub) {
    assertSearchSequence(assert, stub, ['a/b/c/d/.foorc'], 0);
    assert.deepEqual(result, expectedResult);
  }

  function doAssertFinal(result, stub) {
    assertSearchSequence(assert, stub, ['a/b/c/d/.foorc', 'a/b/c/d/.foorc'], 0);
    assert.deepEqual(result, expectedResult);
  }

  var explorer = cosmiconfig('foo');
  var explorerSync = cosmiconfig('foo', { sync: true });

  try {
    var result = explorerSync.load(null, searchPath);
    doAssert(result, readFileSyncStub);
    result = explorerSync.load(null, searchPath);
    doAssert(result, readFileSyncStub);
    explorerSync.clearFileCache();
    result = explorerSync.load(null, searchPath);
    doAssertFinal(result, readFileSyncStub);

    Promise.resolve()
      .then(function() {
        return explorer.load(null, searchPath).then(function(result) {
          doAssert(result, readFileStub);
        });
      })
      .then(function() {
        return explorer.load(null, searchPath).then(function(result) {
          doAssert(result, readFileStub);
        });
      })
      .then(function() {
        explorer.clearFileCache();
      })
      .then(function() {
        return explorer.load(null, searchPath).then(function(result) {
          doAssertFinal(result, readFileStub);
          teardown(assert);
        });
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('clearDirectoryCache', function(assert) {
  setup();
  var searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);
  var expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAssert(result, stub) {
    assertSearchSequence(
      assert,
      stub,
      [
        'a/b/c/d/e/package.json',
        'a/b/c/d/e/.foorc',
        'a/b/c/d/e/foo.config.js',
        'a/b/c/d/package.json',
        'a/b/c/d/.foorc',
      ],
      0
    );
    assert.deepEqual(result, expectedResult);
  }

  function doAssertFinal(result, stub) {
    assertSearchSequence(
      assert,
      stub,
      [
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
      ],
      0
    );
    assert.deepEqual(result, expectedResult);
  }

  var explorer = cosmiconfig('foo');
  var explorerSync = cosmiconfig('foo', { sync: true });

  try {
    var result = explorerSync.load(searchPath);
    doAssert(result, readFileSyncStub);
    result = explorerSync.load(searchPath);
    doAssert(result, readFileSyncStub);
    explorerSync.clearDirectoryCache();
    result = explorerSync.load(searchPath);
    doAssertFinal(result, readFileSyncStub);

    Promise.resolve()
      .then(function() {
        return explorer.load(searchPath).then(function(result) {
          doAssert(result, readFileStub);
        });
      })
      .then(function() {
        return explorer.load(searchPath).then(function(result) {
          doAssert(result, readFileStub);
        });
      })
      .then(function() {
        explorer.clearDirectoryCache();
      })
      .then(function() {
        return explorer.load(searchPath).then(function(result) {
          doAssertFinal(result, readFileStub);
          teardown(assert);
        });
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});
