var test = require('tape');
var sinon = require('sinon');
var path = require('path');
var fs = require('graceful-fs');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('find rc file in third searched dir, with a package.json lacking prop', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  cosmiconfig('foo', { cwd: startDir, stopDir: absolutePath('.') })
    .then(function(result) {
      t.equal(readFileStub.callCount, 8);
      t.equal(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
        'first dir: checked /a/b/c/d/e/f/package.json');
      t.equal(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/.foorc'),
        'first dir: checked /a/b/c/d/e/f/.foorc');
      t.equal(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/f/foo.config.js'),
        'first dir: checked /a/b/c/d/e/f/foo.config.js');
      t.equal(readFileStub.getCall(3).args[0], absolutePath('a/b/c/d/e/package.json'),
        'second dir: checked /a/b/c/d/e/package.json');
      t.equal(readFileStub.getCall(4).args[0], absolutePath('a/b/c/d/e/.foorc'),
        'second dir: checked /a/b/c/d/e/.foorc');
      t.equal(readFileStub.getCall(5).args[0], absolutePath('a/b/c/d/e/foo.config.js'),
        'second dir: checked /a/b/c/d/e/foo.config.js');
      t.equal(readFileStub.getCall(6).args[0], absolutePath('a/b/c/d/package.json'),
        'third dir: checked /a/b/c/d/package.json');
      t.equal(readFileStub.getCall(7).args[0], absolutePath('a/b/c/d/.foorc'),
        'third dir: checked /a/b/c/d/.foorc');
      t.deepEqual(result.config, {
        found: true,
      });
      t.equal(result.filepath, absolutePath('a/b/c/d/.foorc'));
      readFileStub.restore();
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 11;

  t.plan(planned);
});

test('find package.json prop in second searched dir', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  cosmiconfig('foo', { cwd: startDir, stopDir: absolutePath('.') })
    .then(function(result) {
      t.equal(readFileStub.callCount, 4);
      t.equal(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
        'first dir: checked /a/b/c/d/e/f/package.json');
      t.equal(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/.foorc'),
        'first dir: checked /a/b/c/d/e/f/.foorc');
      t.equal(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/f/foo.config.js'),
        'first dir: checked /a/b/c/d/e/f/foo.config.js');
      t.equal(readFileStub.getCall(3).args[0], absolutePath('a/b/c/d/e/package.json'),
        'second dir: checked /a/b/c/d/e/package.json');
      t.deepEqual(result.config, {
        found: true,
      });
      t.equal(result.filepath, absolutePath('a/b/c/d/e/package.json'));
      readFileStub.restore();
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 7;

  t.plan(planned);
});

test('find JS file in first searched dir', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  cosmiconfig('foo', { cwd: startDir , stopDir: absolutePath('.')})
    .then(function(result) {
      t.equal(readFileStub.callCount, 3);
      t.equal(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
        'first dir: checked /a/b/c/d/e/f/package.json');
      t.equal(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/.foorc'),
        'first dir: checked /a/b/c/d/e/f/.foorc');
      t.equal(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/f/foo.config.js'),
        'first dir: checked /a/b/c/d/e/f/foo.config.js');
      t.deepEqual(result.config, {
        found: true,
      });
      t.equal(result.filepath, absolutePath('a/b/c/d/e/f/foo.config.js'));
      readFileStub.restore();
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 6;

  t.plan(planned);
});

test('find package.json in second directory searched, with alternate names', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  cosmiconfig('foo', {
    cwd: startDir,
    rc: '.wowza',
    js: 'wowzaConfig.js',
    packageProp: 'heeha',
    stopDir: absolutePath('.'),
  })
    .then(function(result) {
      t.equal(readFileStub.callCount, 4);
      t.equal(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
        'first dir: checked /a/b/c/d/e/f/package.json');
      t.equal(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/.wowza'),
        'first dir: checked /a/b/c/d/e/f/.wowza');
      t.equal(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/f/wowzaConfig.js'),
        'first dir: checked /a/b/c/d/e/f/wowzaConfig.js');
      t.equal(readFileStub.getCall(3).args[0], absolutePath('a/b/c/d/e/package.json'),
        'first dir: checked /a/b/c/d/e/package.json');
      t.deepEqual(result.config, {
        found: true,
      });
      t.equal(result.filepath, absolutePath('a/b/c/d/e/package.json'));
      readFileStub.restore();
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 7;

  t.plan(planned);
});

test('find rc file in third searched dir, skipping packageProp, with rcStrictJson', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    packageProp: false,
    rcStrictJson: true,
  })
    .then(function(result) {
      t.equal(readFileStub.callCount, 5);
      t.equal(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/.foorc'),
        'first dir: checked /a/b/c/d/e/f/.foorc');
      t.equal(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/foo.config.js'),
        'first dir: checked /a/b/c/d/e/f/foo.config.js');
      t.equal(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/.foorc'),
        'second dir: checked /a/b/c/d/e/.foorc');
      t.equal(readFileStub.getCall(3).args[0], absolutePath('a/b/c/d/e/foo.config.js'),
        'second dir: checked /a/b/c/d/e/foo.config.js');
      t.equal(readFileStub.getCall(4).args[0], absolutePath('a/b/c/d/.foorc'),
        'third dir: checked /a/b/c/d/.foorc');
      t.deepEqual(result.config, {
        found: true,
      });
      t.equal(result.filepath, absolutePath('a/b/c/d/.foorc'));
      readFileStub.restore();
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 8;

  t.plan(planned);
});

test('find package.json prop in second searched dir, skipping js and rc', function(t) {
  var planned = 0;
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    js: false,
    rc: false,
  })
    .then(function(result) {
      t.equal(readFileStub.callCount, 2);
      t.equal(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
        'first dir: checked /a/b/c/d/e/f/package.json');
      t.equal(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/package.json'),
        'second dir: checked /a/b/c/d/e/package.json');
      t.deepEqual(result.config, {
        found: true,
      });
      t.equal(result.filepath, absolutePath('a/b/c/d/e/package.json'));
      readFileStub.restore();
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 5;

  t.plan(planned);
});
