'use strict';

const test = require('tape');
const sinon = require('sinon');
const fs = require('fs');
const cosmiconfig = require('..');
const assertSearchSequence = require('./assertSearchSequence');
const makeReadFileSyncStub = require('./makeReadFileSyncStub');
const util = require('./util');

const absolutePath = util.absolutePath;

let statStub;
let statSyncStub;
let readFileStub;
let readFileSyncStub;

function statStubIsDirectory(result) {
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => result,
  });

  statSyncStub = sinon.stub(fs, 'statSync').callsFake(() => ({
    isDirectory: () => result,
  }));
}

const cachedLoadConfig = cosmiconfig('foo').load;
const cachedLoadConfigSync = cosmiconfig('foo', { sync: true }).load;

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
        callback(new Error(`irrelevant path ${searchPath}`));
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

test('does not use cache at first', assert => {
  setup();
  const searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  const expectedResult = {
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
    const result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(result => {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('uses cache for already-visited directories', assert => {
  setup();
  // E and D visited above
  const searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub) {
    assert.equal(stub.callCount, 0, 'no new calls');
    assert.deepEqual(result, expectedResult);
  }

  try {
    const result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(result => {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('uses cache for file in already-visited directories', assert => {
  setup();
  // E and D visited above
  const searchPath = absolutePath('a/b/c/d/e/foo.js');
  statStubIsDirectory(false);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub) {
    assert.equal(stub.callCount, 0, 'no new calls');
    assert.deepEqual(result, expectedResult);
  }

  try {
    const result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(result => {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('uses cache when some directories in search were already visted', assert => {
  setup();
  // E and D visited above, not F
  const searchPath = absolutePath('a/b/c/d/e/f');
  statStubIsDirectory(true);

  const expectedResult = {
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
    const result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(result => {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('does not use cache for unvisited config file', assert => {
  setup();
  // B not yet visited
  const configFile = absolutePath('a/b/package.json');
  statStubIsDirectory(false);

  const expectedResult = {
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
    const result = cachedLoadConfigSync(null, configFile);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(null, configFile)
      .then(result => {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('does not use cache with a new cosmiconfig instance', assert => {
  setup();
  const searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  const expectedResult = {
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

  const loadConfig = cosmiconfig('foo').load;
  const loadConfigSync = cosmiconfig('foo', { sync: true }).load;

  try {
    const result = loadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    loadConfig(searchPath)
      .then(result => {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('but cache on old instance still works', assert => {
  setup();
  const searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);

  const expectedResult = {
    filepath: absolutePath('a/b/c/d/.foorc'),
    config: { foundInD: true },
  };

  function doAsserts(result, stub) {
    assert.equal(stub.callCount, 0, 'no file reading!');
    assert.deepEqual(result, expectedResult);
  }

  try {
    const result = cachedLoadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub);

    cachedLoadConfig(searchPath)
      .then(result => {
        doAsserts(result, readFileStub);
        teardown(assert);
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('does not cache if you say no', assert => {
  setup();
  const searchPath = absolutePath('a/b/c/d');
  statStubIsDirectory(true);

  const expectedResult = {
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

  const loadConfig = cosmiconfig('foo', { cache: false }).load;
  const loadConfigSync = cosmiconfig('foo', { cache: false, sync: true }).load;

  try {
    let result = loadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub, 0);
    result = loadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub, 2);
    result = loadConfigSync(searchPath);
    doAsserts(result, readFileSyncStub, 4);

    // Same call three times hits the file system every time
    Promise.resolve()
      .then(() => {
        return loadConfig(searchPath).then(result => {
          doAsserts(result, readFileStub, 0);
        });
      })
      .then(() => {
        return loadConfig(searchPath).then(result => {
          doAsserts(result, readFileStub, 2);
        });
      })
      .then(() => {
        return loadConfig(searchPath).then(result => {
          doAsserts(result, readFileStub, 4);
          teardown(assert);
        });
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('clearFileCache', assert => {
  setup();
  const searchPath = absolutePath('a/b/c/d/.foorc');
  statStubIsDirectory(false);
  const expectedResult = {
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

  const explorer = cosmiconfig('foo');
  const explorerSync = cosmiconfig('foo', { sync: true });

  try {
    let result = explorerSync.load(null, searchPath);
    doAssert(result, readFileSyncStub);
    result = explorerSync.load(null, searchPath);
    doAssert(result, readFileSyncStub);
    explorerSync.clearFileCache();
    result = explorerSync.load(null, searchPath);
    doAssertFinal(result, readFileSyncStub);

    Promise.resolve()
      .then(() => {
        return explorer.load(null, searchPath).then(result => {
          doAssert(result, readFileStub);
        });
      })
      .then(() => {
        return explorer.load(null, searchPath).then(result => {
          doAssert(result, readFileStub);
        });
      })
      .then(() => {
        explorer.clearFileCache();
      })
      .then(() => {
        return explorer.load(null, searchPath).then(result => {
          doAssertFinal(result, readFileStub);
          teardown(assert);
        });
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('clearDirectoryCache', assert => {
  setup();
  const searchPath = absolutePath('a/b/c/d/e');
  statStubIsDirectory(true);
  const expectedResult = {
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

  const explorer = cosmiconfig('foo');
  const explorerSync = cosmiconfig('foo', { sync: true });

  try {
    let result = explorerSync.load(searchPath);
    doAssert(result, readFileSyncStub);
    result = explorerSync.load(searchPath);
    doAssert(result, readFileSyncStub);
    explorerSync.clearDirectoryCache();
    result = explorerSync.load(searchPath);
    doAssertFinal(result, readFileSyncStub);

    Promise.resolve()
      .then(() => {
        return explorer.load(searchPath).then(result => {
          doAssert(result, readFileStub);
        });
      })
      .then(() => {
        return explorer.load(searchPath).then(result => {
          doAssert(result, readFileStub);
        });
      })
      .then(() => {
        explorer.clearDirectoryCache();
      })
      .then(() => {
        return explorer.load(searchPath).then(result => {
          doAssertFinal(result, readFileStub);
          teardown(assert);
        });
      })
      .catch(err => {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});
