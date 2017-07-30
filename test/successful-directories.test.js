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

function setup() {
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: () => true,
  });

  statSyncStub = sinon.stub(fs, 'statSync').callsFake(() => ({
    isDirectory: () => true,
  }));
}

function teardown(assert, err) {
  if (readFileStub.restore) readFileStub.restore();
  if (readFileSyncStub.restore) readFileSyncStub.restore();
  if (statStub.restore) statStub.restore();
  if (statSyncStub.restore) statSyncStub.restore();
  assert.end(err);
}

test('find rc file in third searched dir, with a package.json lacking prop', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
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
        callback(null, '{ "found": true }');
        break;
      default:
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
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
  }

  const loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find package.json prop in second searched dir', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
      'a/b/c/d/e/package.json',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/package.json'),
    });
  }

  const loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find JS file in first searched dir', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/f/foo.config.js'),
    });
  }

  const loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find package.json in second directory searched, with alternate names', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.wowza',
      'a/b/c/d/e/f/wowzaConfig.js',
      'a/b/c/d/e/package.json',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/package.json'),
    });
  }

  const loadConfig = cosmiconfig('foo', {
    rc: '.wowza',
    js: 'wowzaConfig.js',
    packageProp: 'heeha',
    stopDir: absolutePath('.'),
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    rc: '.wowza',
    js: 'wowzaConfig.js',
    packageProp: 'heeha',
    stopDir: absolutePath('.'),
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find rc file in third searched dir, skipping packageProp, with rcStrictJson', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
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
  }

  const loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    packageProp: false,
    rcStrictJson: true,
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    packageProp: false,
    rcStrictJson: true,
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find package.json prop in second searched dir, skipping js and rc', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/package.json',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/package.json'),
    });
  }

  const loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    js: false,
    rc: false,
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    js: false,
    rc: false,
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

// RC file with specified extension

test('with rcExtensions, find .foorc.json in second searched dir', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
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
  }

  const loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('with rcExtensions, find .foorc.yaml in first searched dir', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/.foorc.json',
      'a/b/c/d/e/f/.foorc.yaml',
    ]);
    assert.deepEqual(result, {
      config: { found: true },
      filepath: absolutePath('a/b/c/d/e/f/.foorc.yaml'),
    });
  }

  const loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('with rcExtensions, find .foorc.yml in first searched dir', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
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
  }

  const loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('with rcExtensions, find .foorc.js in first searched dir', assert => {
  setup();
  const startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assertSearchSequence(assert, stub, [
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
  }

  const loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;
  const loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
    sync: true,
  }).load;

  try {
    const result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('options.configPath is respected', assert => {
  const configPath = absolutePath('fixtures/foo.json');
  const explorer = cosmiconfig('foo', { configPath });
  explorer
    .load('./path/does/not/exist')
    .then(result => {
      assert.deepEqual(result.config, {
        foo: true,
      });
      assert.equal(result.filepath, configPath);
      assert.end();
    })
    .catch(err => {
      assert.end(err);
    });
});

test('options.configPath is respected', assert => {
  const configPath = absolutePath('fixtures/foo.json');
  const explorer = cosmiconfig('foo', { configPath });
  explorer
    .load('./path/does/not/exist')
    .then(result => {
      assert.deepEqual(result.config, {
        foo: true,
      });
      assert.equal(result.filepath, configPath);
      assert.end();
    })
    .catch(err => {
      assert.end(err);
    });
});
