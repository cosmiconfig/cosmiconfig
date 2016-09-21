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

test.serial('do not find file, and give up', (t) => {
  const startDir = absolutePath('a/b');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
  }).then((result) => {
    t.is(readFileStub.callCount, 9);
    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/package.json'),
      'first dir: a/b/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/.foorc'),
      'first dir: a/b/.foorc');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/foo.config.js'),
      'first dir: a/b/foo.config.js');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/package.json'),
      'second dir: a/package.json');
    t.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/.foorc'),
      'second dir: a/.foorc');
    t.is(_.get(readFileStub.getCall(5), 'args[0]'), absolutePath('a/foo.config.js'),
      'second dir: a/foo.config.js');
    t.is(_.get(readFileStub.getCall(6), 'args[0]'), absolutePath('/package.json'),
      'third and last dir: /package.json');
    t.is(_.get(readFileStub.getCall(7), 'args[0]'), absolutePath('/.foorc'),
      'third and last dir: /.foorc');
    t.is(_.get(readFileStub.getCall(8), 'args[0]'), absolutePath('/foo.config.js'),
      'third and last dir: /foo.config.js');
    t.is(result, null);
    readFileStub.restore();
  });
});

test.serial('stop at stopDir, and give up', (t) => {
  const startDir = absolutePath('a/b');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('a'),
  }).then((result) => {
    t.is(readFileStub.callCount, 6);
    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/package.json'),
      'first dir: a/b/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/.foorc'),
      'first dir: a/b/.foorc');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/foo.config.js'),
      'first dir: a/b/foo.config.js');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/package.json'),
      'second and stopDir: a/package.json');
    t.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/.foorc'),
      'second and stopDir: a/.foorc');
    t.is(_.get(readFileStub.getCall(5), 'args[0]'), absolutePath('a/foo.config.js'),
      'second and stopDir: a/foo.config.js');
    t.is(result, null);
    readFileStub.restore();
  });
});


test.serial('find invalid YAML in rc file', (t) => {
  const startDir = absolutePath('a/b');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/.foorc'):
        callback(null, 'found: true: broken');
        break;
      default:
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('a'),
  }).catch((error) => {
    t.truthy(error, 'threw error');
    t.is(error.name, 'YAMLException', 'threw correct error type');
    readFileStub.restore();
  });
});

test.serial('find invalid JSON in rc file with rcStrictJson', (t) => {
  const startDir = absolutePath('a/b');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/.foorc'):
        callback(null, '{ "found": true, }');
        break;
      default:
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('a'),
    rcStrictJson: true,
  }).catch((error) => {
    t.truthy(error, 'threw error');
    t.is(error.name, 'JSONError', 'threw correct error type');
    readFileStub.restore();
  });
});

test.serial('find invalid package.json', (t) => {
  const startDir = absolutePath('a/b');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        callback(null, '{ "foo": "bar", }');
        break;
      default:
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('a'),
  }).catch((error) => {
    t.truthy(error, 'threw error');
    t.is(error.name, 'JSONError', 'threw correct error type');
    readFileStub.restore();
  });
});

test.serial('find invalid JS in .config.js file', (t) => {
  const startDir = absolutePath('a/b');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
      case absolutePath('a/b/.foorc'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/foo.config.js'):
        callback(null, 'module.exports = { found: true: false,');
        break;
      default:
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('a'),
  }).catch((error) => {
    t.truthy(error, 'threw error');
    t.is(error.name, 'SyntaxError', 'threw correct error type');
    readFileStub.restore();
  });
});

// RC file with specified extension

test.serial('with rcExtensions, find invalid JSON in .foorc.json', (t) => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
        callback({ code: 'ENOENT' });
        break;
      case absolutePath('a/b/c/d/e/f/.foorc.json'):
        callback(null, '{ "found": true,, }');
        break;
      default:
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).catch((error) => {
    t.truthy(error, 'threw error');
    t.is(error.name, 'JSONError', 'threw correct error type');
    readFileStub.restore();
  });
});

test.serial('with rcExtensions, find invalid YAML in .foorc.yaml', (t) => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).catch((error) => {
    t.truthy(error, 'threw error');
    t.is(error.name, 'YAMLException', 'threw correct error type');
    readFileStub.restore();
  });
});

test.serial('with rcExtensions, find invalid YAML in .foorc.yml', (t) => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).catch((error) => {
    t.truthy(error, 'threw error');
    t.is(error.name, 'YAMLException', 'threw correct error type');
    readFileStub.restore();
  });
});

test.serial('with rcExtensions, find invalid JS in .foorc.js', (t) => {
  const startDir = absolutePath('a/b/c/d/e/f');
  const readFileStub = sinon.stub(fs, 'readFile', (searchPath, encoding, callback) => {
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
        callback(new Error(`irrelevant path ${searchPath}`));
    }
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).catch((error) => {
    t.truthy(error, 'threw error');
    t.is(error.name, 'SyntaxError', 'threw correct error type');
    readFileStub.restore();
  });
});
