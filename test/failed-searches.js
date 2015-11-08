var test = require('tape');
var sinon = require('sinon');
var fs = require('graceful-fs');
var configHunter = require('..');

test('do not find file, and give up', function(t) {
  var planned = 0;
  var startDir = '/a/b';
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
    switch (searchPath) {
      case '/a/b/package.json':
      case '/a/b/.foorc':
      case '/a/b/foo.config.js':
      case '/a/package.json':
      case '/a/.foorc':
      case '/a/foo.config.js':
      case '/package.json':
      case '/.foorc':
      case '/foo.config.js':
        callback(new Error());
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  configHunter('foo', { cwd: startDir })
    .then(function(result) {
      t.equal(readFileStub.callCount, 9);
      t.equal(readFileStub.getCall(0).args[0], '/a/b/package.json',
        'first dir: /a/b/package.json');
      t.equal(readFileStub.getCall(1).args[0], '/a/b/.foorc',
        'first dir: /a/b/.foorc');
      t.equal(readFileStub.getCall(2).args[0], '/a/b/foo.config.js',
        'first dir: /a/b/foo.config.js');
      t.equal(readFileStub.getCall(3).args[0], '/a/package.json',
        'second dir: /a/package.json');
      t.equal(readFileStub.getCall(4).args[0], '/a/.foorc',
        'second dir: /a/.foorc');
      t.equal(readFileStub.getCall(5).args[0], '/a/foo.config.js',
        'second dir: /a/foo.config.js');
      t.equal(readFileStub.getCall(6).args[0], '/package.json',
        'third and last dir: /package.json');
      t.equal(readFileStub.getCall(7).args[0], '/.foorc',
        'third and last dir: /.foorc');
      t.equal(readFileStub.getCall(8).args[0], '/foo.config.js',
        'third and last dir: /foo.config.js');
      t.equal(result, null);
      readFileStub.restore();
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 11;

  t.plan(planned);
});

test('stop at homedir, and give up', function(t) {
  var planned = 0;
  var startDir = '/a/b';
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
    switch (searchPath) {
      case '/a/b/package.json':
      case '/a/b/.foorc':
      case '/a/b/foo.config.js':
      case '/a/package.json':
      case '/a/.foorc':
      case '/a/foo.config.js':
      case '/package.json':
      case '/.foorc':
      case '/foo.config.js':
        callback(new Error());
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  configHunter('foo', { cwd: startDir, homedir: '/a' })
    .then(function(result) {
      t.equal(readFileStub.callCount, 6);
      t.equal(readFileStub.getCall(0).args[0], '/a/b/package.json',
        'first dir: /a/b/package.json');
      t.equal(readFileStub.getCall(1).args[0], '/a/b/.foorc',
        'first dir: /a/b/.foorc');
      t.equal(readFileStub.getCall(2).args[0], '/a/b/foo.config.js',
        'first dir: /a/b/foo.config.js');
      t.equal(readFileStub.getCall(3).args[0], '/a/package.json',
        'second and homedir: /a/package.json');
      t.equal(readFileStub.getCall(4).args[0], '/a/.foorc',
        'second and homedir: /a/.foorc');
      t.equal(readFileStub.getCall(5).args[0], '/a/foo.config.js',
        'second and homedir: /a/foo.config.js');
      t.equal(result, null);
      readFileStub.restore();
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 8;

  t.plan(planned);
});


test('find invalid YAML in rc file', function(t) {
  var planned = 0;
  var startDir = '/a/b';
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
    switch (searchPath) {
      case '/a/b/package.json':
        callback(new Error());
        break;
      case '/a/b/.foorc':
        callback(null, 'found: true: broken');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  configHunter('foo', { cwd: startDir, homedir: '/a' })
    .catch(function(error) {
      t.ok(error, 'threw error');
      t.equal(error.name, 'YAMLException', 'threw correct error type');
      readFileStub.restore();
    });

  planned += 2;

  t.plan(planned);
});

test('find invalid JSON in rc file', function(t) {
  var planned = 0;
  var startDir = '/a/b';
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
    switch (searchPath) {
      case '/a/b/package.json':
        callback(new Error());
        break;
      case '/a/b/.foorc':
        callback(null, '{ "found": true, }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  configHunter('foo', { cwd: startDir, homedir: '/a' })
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
  var startDir = '/a/b';
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
    switch (searchPath) {
      case '/a/b/package.json':
        callback(null, '{ "foo": "bar", }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  configHunter('foo', { cwd: startDir, homedir: '/a' })
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
  var startDir = '/a/b';
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
    switch (searchPath) {
      case '/a/b/package.json':
      case '/a/b/.foorc':
        callback(new Error());
        break;
      case '/a/b/foo.config.js':
        callback(null, 'module.exports = { found: true: false,');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  configHunter('foo', { cwd: startDir, homedir: '/a' })
    .catch(function(error) {
      t.ok(error, 'threw error');
      t.equal(error.name, 'SyntaxError', 'threw correct error type');
      readFileStub.restore();
    });

  planned += 2;

  t.plan(planned);
});
