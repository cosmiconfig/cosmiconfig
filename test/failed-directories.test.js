'use strict';

var test = require('tape');
var sinon = require('sinon');
var fs = require('fs');
var _ = require('lodash');
var cosmiconfig = require('..');
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

test('do not find file, and give up', function(assert) {
  setup();
  var startDir = absolutePath('a/b');
  function readFile(searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
      case absolutePath('a/b/.foorc'):
      case absolutePath('a/b/foo.config.js'):
      case absolutePath('a/package.json'):
      case absolutePath('a/.foorc'):
      case absolutePath('a/foo.config.js'):
      case absolutePath('package.json'):
      case absolutePath('.foorc'):
      case absolutePath('foo.config.js'):
        callback({ code: 'ENOENT' });
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, readFileStub, statStub) {
    // intentional shadowing
    assert.equal(statStub.callCount, 1);
    assert.equal(_.get(statStub.getCall(0), 'args[0]'), absolutePath('a/b'));

    assert.equal(readFileStub.callCount, 9);
    assert.equal(
      _.get(readFileStub.getCall(0), 'args[0]'),
      absolutePath('a/b/package.json'),
      'first dir: a/b/package.json'
    );
    assert.equal(
      _.get(readFileStub.getCall(1), 'args[0]'),
      absolutePath('a/b/.foorc'),
      'first dir: a/b/.foorc'
    );
    assert.equal(
      _.get(readFileStub.getCall(2), 'args[0]'),
      absolutePath('a/b/foo.config.js'),
      'first dir: a/b/foo.config.js'
    );
    assert.equal(
      _.get(readFileStub.getCall(3), 'args[0]'),
      absolutePath('a/package.json'),
      'second dir: a/package.json'
    );
    assert.equal(
      _.get(readFileStub.getCall(4), 'args[0]'),
      absolutePath('a/.foorc'),
      'second dir: a/.foorc'
    );
    assert.equal(
      _.get(readFileStub.getCall(5), 'args[0]'),
      absolutePath('a/foo.config.js'),
      'second dir: a/foo.config.js'
    );
    assert.equal(
      _.get(readFileStub.getCall(6), 'args[0]'),
      absolutePath('./package.json'),
      'third and last dir: /package.json'
    );
    assert.equal(
      _.get(readFileStub.getCall(7), 'args[0]'),
      absolutePath('./.foorc'),
      'third and last dir: /.foorc'
    );
    assert.equal(
      _.get(readFileStub.getCall(8), 'args[0]'),
      absolutePath('./foo.config.js'),
      'third and last dir: /foo.config.js'
    );
    assert.equal(result, null);
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
    doAsserts(result, readFileSyncStub, statSyncStub);
    loadConfig(startDir)
      .then(function(result) {
        doAsserts(result, readFileStub, statStub);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('stop at stopDir, and give up', function(assert) {
  setup();
  var startDir = absolutePath('a/b');
  function readFile(searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
      case absolutePath('a/b/.foorc'):
      case absolutePath('a/b/foo.config.js'):
      case absolutePath('a/package.json'):
      case absolutePath('a/.foorc'):
      case absolutePath('a/foo.config.js'):
      case absolutePath('/package.json'):
      case absolutePath('/.foorc'):
      case absolutePath('/foo.config.js'):
        callback({ code: 'ENOENT' });
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(result, stub) {
    assert.equal(stub.callCount, 6);
    assert.equal(
      _.get(stub.getCall(0), 'args[0]'),
      absolutePath('a/b/package.json'),
      'first dir: a/b/package.json'
    );
    assert.equal(
      _.get(stub.getCall(1), 'args[0]'),
      absolutePath('a/b/.foorc'),
      'first dir: a/b/.foorc'
    );
    assert.equal(
      _.get(stub.getCall(2), 'args[0]'),
      absolutePath('a/b/foo.config.js'),
      'first dir: a/b/foo.config.js'
    );
    assert.equal(
      _.get(stub.getCall(3), 'args[0]'),
      absolutePath('a/package.json'),
      'second and stopDir: a/package.json'
    );
    assert.equal(
      _.get(stub.getCall(4), 'args[0]'),
      absolutePath('a/.foorc'),
      'second and stopDir: a/.foorc'
    );
    assert.equal(
      _.get(stub.getCall(5), 'args[0]'),
      absolutePath('a/foo.config.js'),
      'second and stopDir: a/foo.config.js'
    );
    assert.equal(result, null);
  }

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
    sync: true,
  }).load;

  try {
    var result = loadConfigSync(startDir);
    doAsserts(result, readFileSyncStub, statSyncStub);
    loadConfig(startDir)
      .then(function(result) {
        doAsserts(result, readFileStub, statStub);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});

test('find invalid YAML in rc file', function(assert) {
  setup();
  var startDir = absolutePath('a/b');
  function readFile(searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/.foorc'):
        callback(null, 'found: true: broken');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(error) {
    assert.ok(error, 'threw error');
    assert.equal(error.name, 'YAMLException', 'threw correct error type');
  }

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
    sync: true,
  }).load;

  try {
    loadConfigSync(startDir);
  } catch (err) {
    doAsserts(err);
  }

  loadConfig(startDir)
    .catch(function(error) {
      doAsserts(error);
      teardown(assert);
    })
    .catch(function(err) {
      teardown(assert, err);
    });
});

test('find invalid JSON in rc file with rcStrictJson', function(assert) {
  setup();
  var startDir = absolutePath('a/b');
  function readFile(searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/.foorc'):
        callback(null, '{ "found": true, }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(error) {
    assert.ok(error, 'threw error');
    assert.ok(/JSON Error/.test(error.message), 'threw correct error type');
  }

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
    rcStrictJson: true,
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
    rcStrictJson: true,
    sync: true,
  }).load;

  try {
    loadConfigSync(startDir);
  } catch (err) {
    doAsserts(err);
  }

  loadConfig(startDir)
    .catch(function(error) {
      doAsserts(error);
      teardown(assert);
    })
    .catch(function(err) {
      teardown(assert, err);
    });
});

test('find invalid package.json', function(assert) {
  setup();
  var startDir = absolutePath('a/b');
  function readFile(searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        callback(null, '{ "foo": "bar", }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(error) {
    assert.ok(error, 'threw error');
    assert.ok(/JSON Error/.test(error.message), 'threw correct error type');
  }

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
    sync: true,
  }).load;

  try {
    loadConfigSync(startDir);
  } catch (err) {
    doAsserts(err);
  }

  loadConfig(startDir)
    .catch(function(error) {
      doAsserts(error);
      teardown(assert);
    })
    .catch(function(err) {
      teardown(assert, err);
    });
});

test('find invalid JS in .config.js file', function(assert) {
  setup();
  var startDir = absolutePath('a/b');
  function readFile(searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
      case absolutePath('a/b/.foorc'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/foo.config.js'):
        callback(null, 'module.exports = { found: true: false,');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(error) {
    assert.ok(error, 'threw error');
    assert.equal(error.name, 'SyntaxError', 'threw correct error type');
  }

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
  }).load;
  var loadConfigSync = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
    sync: true,
  }).load;

  try {
    loadConfigSync(startDir);
  } catch (err) {
    doAsserts(err);
  }

  loadConfig(startDir)
    .catch(function(error) {
      doAsserts(error);
      teardown(assert);
    })
    .catch(function(err) {
      teardown(assert, err);
    });
});

test('with rcExtensions, find invalid JSON in .foorc.json', function(assert) {
  setup();
  var startDir = absolutePath('a/b/c/d/e/f');
  function readFile(searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/f/.foorc.json'):
        callback(null, '{ "found": true,, }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(error) {
    assert.ok(error, 'threw error');
    assert.ok(/JSON Error/.test(error.message), 'threw correct error type');
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
    loadConfigSync(startDir);
  } catch (err) {
    doAsserts(err);
  }

  loadConfig(startDir)
    .catch(function(error) {
      doAsserts(error);
      teardown(assert);
    })
    .catch(function(err) {
      teardown(assert, err);
    });
});

test('with rcExtensions, find invalid YAML in .foorc.yaml', function(assert) {
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
        callback(null, 'found: thing: true');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(error) {
    assert.ok(error, 'threw error');
    assert.equal(error.name, 'YAMLException', 'threw correct error type');
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
    loadConfigSync(startDir);
  } catch (err) {
    doAsserts(err);
  }

  loadConfig(startDir)
    .catch(function(error) {
      doAsserts(error);
      teardown(assert);
    })
    .catch(function(err) {
      teardown(assert, err);
    });
});

test('with rcExtensions, find invalid YAML in .foorc.yml', function(assert) {
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
        callback(null, 'found: thing: true');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(error) {
    assert.ok(error, 'threw error');
    assert.equal(error.name, 'YAMLException', 'threw correct error type');
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
    loadConfigSync(startDir);
  } catch (err) {
    doAsserts(err);
  }

  loadConfig(startDir)
    .catch(function(error) {
      doAsserts(error);
      teardown(assert);
    })
    .catch(function(err) {
      teardown(assert, err);
    });
});

test('with rcExtensions, find invalid JS in .foorc.js', function(assert) {
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
        callback(null, 'module.exports = found: true };');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  }
  readFileStub = sinon.stub(fs, 'readFile').callsFake(readFile);
  readFileSyncStub = makeReadFileSyncStub(readFile);

  function doAsserts(error) {
    assert.ok(error, 'threw error');
    assert.equal(error.name, 'SyntaxError', 'threw correct error type');
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
    loadConfigSync(startDir);
    assert.fail('should have errored');
  } catch (err) {
    doAsserts(err);
  }

  loadConfig(startDir)
    .then(function() {
      assert.fail('should have errored');
      teardown(assert);
    })
    .catch(function(error) {
      doAsserts(error);
      teardown(assert);
    });
});

test('Configuration file not exist', function(assert) {
  setup();
  var loadConfig = cosmiconfig('not_exist_rc_name').load;
  var loadConfigSync = cosmiconfig('not_exist_rc_name', { sync: true }).load;

  try {
    var result = loadConfigSync('.');
    assert.equal(result, null);

    loadConfig('.')
      .then(function(result) {
        assert.equal(result, null);
        teardown(assert);
      })
      .catch(function(err) {
        teardown(assert, err);
      });
  } catch (err) {
    teardown(assert, err);
  }
});
