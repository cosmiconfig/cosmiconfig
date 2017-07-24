'use strict';

var test = require('tape');
var sinon = require('sinon');
var fs = require('fs');
var cosmiconfig = require('..');
var assertSearchSequence = require('./assertSearchSequence');
var makeReadFileSyncStub = require('./makeReadFileSyncStub');
var util = require('./util');

var absolutePath = util.absolutePath;

var statStub;
var statSyncStub;
var readFileStub;
var readFileSyncStub;

function setup() {
  statStub = sinon.stub(fs, 'stat').yieldsAsync(null, {
    isDirectory: function() {
      return true;
    },
  });

  statSyncStub = sinon.stub(fs, 'statSync').callsFake(function() {
    return {
      isDirectory: function() {
        return true;
      },
    };
  });
}

function teardown(assert, err) {
  if (readFileStub.restore) readFileStub.restore();
  if (readFileSyncStub.restore) readFileSyncStub.restore();
  if (statStub.restore) statStub.restore();
  if (statSyncStub.restore) statSyncStub.restore();
  assert.end(err);
}

test('find rc file in third searched dir, with a package.json lacking prop', function(
  assert
) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find package.json prop in second searched dir', function(assert) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find JS file in first searched dir', function(assert) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find package.json in second directory searched, with alternate names', function(
  assert
) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    rc: '.wowza',
    js: 'wowzaConfig.js',
    packageProp: 'heeha',
    stopDir: absolutePath('.'),
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    rc: '.wowza',
    js: 'wowzaConfig.js',
    packageProp: 'heeha',
    stopDir: absolutePath('.'),
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find rc file in third searched dir, skipping packageProp, with rcStrictJson', function(
  assert
) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    packageProp: false,
    rcStrictJson: true,
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    packageProp: false,
    rcStrictJson: true,
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('find package.json prop in second searched dir, skipping js and rc', function(
  assert
) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    js: false,
    rc: false,
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    js: false,
    rc: false,
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

// RC file with specified extension

test('with rcExtensions, find .foorc.json in second searched dir', function(
  assert
) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('with rcExtensions, find .foorc.yaml in first searched dir', function(
  assert
) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('with rcExtensions, find .foorc.yml in first searched dir', function(
  assert
) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('with rcExtensions, find .foorc.js in first searched dir', function(
  assert
) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
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
        callback(new Error('irrelevant path ' + searchPath));
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

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub);

    loadConfig(startDir)
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

test('options.configPath is respected', function(assert) {
  var configPath = absolutePath('fixtures/foo.json');
  var explorer = cosmiconfig('foo', { configPath: configPath });
  explorer
    .load('./path/does/not/exist')
    .then(function(result) {
      assert.deepEqual(result.config, {
        foo: true,
      });
      assert.equal(result.filepath, configPath);
      assert.end();
    })
    .catch(function(err) {
      assert.end(err);
    });
});

test('options.configPath is respected', function(assert) {
  var configPath = absolutePath('fixtures/foo.json');
  var explorer = cosmiconfig('foo', { configPath: configPath });
  explorer
    .load('./path/does/not/exist')
    .then(function(result) {
      assert.deepEqual(result.config, {
        foo: true,
      });
      assert.equal(result.filepath, configPath);
      assert.end();
    })
    .catch(function(err) {
      assert.end(err);
    });
});
