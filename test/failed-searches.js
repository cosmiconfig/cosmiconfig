var test = require('tape');
var sinon = require('sinon');
var path = require('path');
var fs = require('graceful-fs');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('do not find file, and give up', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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

  cosmiconfig('foo', { cwd: startDir, stopDir: absolutePath('.') })
    .then(function(result) {
      t.equal(readFileStub.callCount, 9);
      t.equal(readFileStub.getCall(0).args[0], absolutePath('a/b/package.json'),
        'first dir: a/b/package.json');
      t.equal(readFileStub.getCall(1).args[0], absolutePath('a/b/.foorc'),
        'first dir: a/b/.foorc');
      t.equal(readFileStub.getCall(2).args[0], absolutePath('a/b/foo.config.js'),
        'first dir: a/b/foo.config.js');
      t.equal(readFileStub.getCall(3).args[0], absolutePath('a/package.json'),
        'second dir: a/package.json');
      t.equal(readFileStub.getCall(4).args[0], absolutePath('a/.foorc'),
        'second dir: a/.foorc');
      t.equal(readFileStub.getCall(5).args[0], absolutePath('a/foo.config.js'),
        'second dir: a/foo.config.js');
      t.equal(readFileStub.getCall(6).args[0], absolutePath('/package.json'),
        'third and last dir: /package.json');
      t.equal(readFileStub.getCall(7).args[0], absolutePath('/.foorc'),
        'third and last dir: /.foorc');
      t.equal(readFileStub.getCall(8).args[0], absolutePath('/foo.config.js'),
        'third and last dir: /foo.config.js');
      t.equal(result, null);
      readFileStub.restore();
    }).catch(function(err) {
      console.log(err.stack);
    });
  planned += 11;

  t.plan(planned);
});

test('stop at stopDir, and give up', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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

  cosmiconfig('foo', { cwd: startDir, stopDir: absolutePath('a') })
    .then(function(result) {
      t.equal(readFileStub.callCount, 6);
      t.equal(readFileStub.getCall(0).args[0], absolutePath('a/b/package.json'),
        'first dir: a/b/package.json');
      t.equal(readFileStub.getCall(1).args[0], absolutePath('a/b/.foorc'),
        'first dir: a/b/.foorc');
      t.equal(readFileStub.getCall(2).args[0], absolutePath('a/b/foo.config.js'),
        'first dir: a/b/foo.config.js');
      t.equal(readFileStub.getCall(3).args[0], absolutePath('a/package.json'),
        'second and stopDir: a/package.json');
      t.equal(readFileStub.getCall(4).args[0], absolutePath('a/.foorc'),
        'second and stopDir: a/.foorc');
      t.equal(readFileStub.getCall(5).args[0], absolutePath('a/foo.config.js'),
        'second and stopDir: a/foo.config.js');
      t.equal(result, null);
      readFileStub.restore();
    }).catch(function(err) {
      console.log(err.stack);
    });
  planned += 8;

  t.plan(planned);
});


test('find invalid YAML in rc file', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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

  cosmiconfig('foo', { cwd: startDir, stopDir: absolutePath('a') })
    .catch(function(error) {
      t.ok(error, 'threw error');
      t.equal(error.name, 'YAMLException', 'threw correct error type');
      readFileStub.restore();
    });

  planned += 2;

  t.plan(planned);
});

test('find invalid JSON in rc file with rcStrictJson', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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

  cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('a'),
    rcStrictJson: true,
  })
    .catch(function(error) {
      t.ok(error, 'threw error');
      t.equal(error.name, 'JSONError', 'threw correct error type');
      readFileStub.restore();
    });

  planned += 2;

  t.plan(planned);
});

test('find invalid package.json', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
    switch (searchPath) {
      case absolutePath('a/b/package.json'):
        callback(null, '{ "foo": "bar", }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  cosmiconfig('foo', { cwd: startDir, stopDir: absolutePath('a') })
    .catch(function(error) {
      t.ok(error, 'threw error');
      t.equal(error.name, 'JSONError', 'threw correct error type');
      readFileStub.restore();
    });

  planned += 2;

  t.plan(planned);
});

test('find invalid JS in .config.js file', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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

  cosmiconfig('foo', { cwd: startDir, stopDir: absolutePath('a') })
    .catch(function(error) {
      t.ok(error, 'threw error');
      t.equal(error.name, 'SyntaxError', 'threw correct error type');
      readFileStub.restore();
    });

  planned += 2;

  t.plan(planned);
});
