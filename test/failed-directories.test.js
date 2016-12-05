'use strict';

var test = require('ava');
var sinon = require('sinon');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var cosmiconfig = require('..');

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

test.serial('do not find file, and give up', function (assert) {
  var startDir = absolutePath('a/b');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
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
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
  }).load;

  return loadConfig(startDir).then(function (result) {
    assert.is(statStub.callCount, 1);
    assert.is(_.get(statStub.getCall(0), 'args[0]'), absolutePath('a/b'));

    assert.is(readFileStub.callCount, 9);
    assert.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/package.json'),
      'first dir: a/b/package.json');
    assert.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/.foorc'),
      'first dir: a/b/.foorc');
    assert.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/foo.config.js'),
      'first dir: a/b/foo.config.js');
    assert.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/package.json'),
      'second dir: a/package.json');
    assert.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/.foorc'),
      'second dir: a/.foorc');
    assert.is(_.get(readFileStub.getCall(5), 'args[0]'), absolutePath('a/foo.config.js'),
      'second dir: a/foo.config.js');
    assert.is(_.get(readFileStub.getCall(6), 'args[0]'), absolutePath('./package.json'),
      'third and last dir: /package.json');
    assert.is(_.get(readFileStub.getCall(7), 'args[0]'), absolutePath('./.foorc'),
      'third and last dir: /.foorc');
    assert.is(_.get(readFileStub.getCall(8), 'args[0]'), absolutePath('./foo.config.js'),
      'third and last dir: /foo.config.js');
    assert.is(result, null);
  });
});

test.serial('stop at stopDir, and give up', function (assert) {
  var startDir = absolutePath('a/b');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
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
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
  }).load;

  return loadConfig(startDir).then(function (result) {
    assert.is(readFileStub.callCount, 6);
    assert.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/package.json'),
      'first dir: a/b/package.json');
    assert.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/.foorc'),
      'first dir: a/b/.foorc');
    assert.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/foo.config.js'),
      'first dir: a/b/foo.config.js');
    assert.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/package.json'),
      'second and stopDir: a/package.json');
    assert.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/.foorc'),
      'second and stopDir: a/.foorc');
    assert.is(_.get(readFileStub.getCall(5), 'args[0]'), absolutePath('a/foo.config.js'),
      'second and stopDir: a/foo.config.js');
    assert.is(result, null);
  });
});

test.serial('find invalid YAML in rc file', function (assert) {
  var startDir = absolutePath('a/b');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
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
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
  }).load;

  return loadConfig(startDir).catch(function (error) {
    assert.truthy(error, 'threw error');
    assert.is(error.name, 'YAMLException', 'threw correct error type');
  });
});

test.serial('find invalid JSON in rc file with rcStrictJson', function (assert) {
  var startDir = absolutePath('a/b');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
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
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
    rcStrictJson: true,
  }).load;

  return loadConfig(startDir).catch(function (error) {
    assert.truthy(error, 'threw error');
    assert.is(error.name, 'JSONError', 'threw correct error type');
  });
});

test.serial('find invalid package.json', function (assert) {
  var startDir = absolutePath('a/b');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        callback(null, '{ "foo": "bar", }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
  }).load;

  return loadConfig(startDir).catch(function (error) {
    assert.truthy(error, 'threw error');
    assert.is(error.name, 'JSONError', 'threw correct error type');
  });
});

test.serial('find invalid JS in .config.js file', function (assert) {
  var startDir = absolutePath('a/b');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
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
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('a'),
  }).load;

  return loadConfig(startDir).catch(function (error) {
    assert.truthy(error, 'threw error');
    assert.is(error.name, 'SyntaxError', 'threw correct error type');
  });
});

test.serial('with rcExtensions, find invalid JSON in .foorc.json', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
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
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;

  return loadConfig(startDir).catch(function (error) {
    assert.truthy(error, 'threw error');
    assert.is(error.name, 'JSONError', 'threw correct error type');
  });
});

test.serial('with rcExtensions, find invalid YAML in .foorc.yaml', function (assert) {
  var startDir = absolutePath('a/b/c/d/e/f');
  readFileStub = sinon.stub(fs, 'readFile', function (searchPath, encoding, callback) {
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
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;

  return loadConfig(startDir).catch(function (error) {
    assert.truthy(error, 'threw error');
    assert.is(error.name, 'YAMLException', 'threw correct error type');
  });
});

test.serial('with rcExtensions, find invalid YAML in .foorc.yml', function (assert) {
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
        callback(null, 'found: thing: true');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;

  return loadConfig(startDir).catch(function (error) {
    assert.truthy(error, 'threw error');
    assert.is(error.name, 'YAMLException', 'threw correct error type');
  });
});

test.serial('with rcExtensions, find invalid JS in .foorc.js', function (assert) {
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
        callback(null, 'module.exports ==! { found: true };');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  var loadConfig = cosmiconfig('foo', {
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).load;

  return loadConfig(startDir).catch(function (error) {
    assert.truthy(error, 'threw error');
    assert.is(error.name, 'SyntaxError', 'threw correct error type');
  });
});

test.serial('Configuration file not exist', function (assert) {
  var loadConfig = cosmiconfig('not_exist_rc_name').load;
  return loadConfig('.').then(function (result) {
    assert.is(result, null);
  });
});
