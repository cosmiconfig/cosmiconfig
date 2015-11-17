var test = require('ava');
var sinon = require('sinon');
var path = require('path');
var fs = require('graceful-fs');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test.serial('find rc file in third searched dir, with a package.json lacking prop', function(t) {
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

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.') ,
  }).then(function(result) {
    t.is(readFileStub.callCount, 8);
    t.is(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked /a/b/c/d/e/f/.foorc');
    t.is(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked /a/b/c/d/e/f/foo.config.js');
    t.is(readFileStub.getCall(3).args[0], absolutePath('a/b/c/d/e/package.json'),
      'second dir: checked /a/b/c/d/e/package.json');
    t.is(readFileStub.getCall(4).args[0], absolutePath('a/b/c/d/e/.foorc'),
      'second dir: checked /a/b/c/d/e/.foorc');
    t.is(readFileStub.getCall(5).args[0], absolutePath('a/b/c/d/e/foo.config.js'),
      'second dir: checked /a/b/c/d/e/foo.config.js');
    t.is(readFileStub.getCall(6).args[0], absolutePath('a/b/c/d/package.json'),
      'third dir: checked /a/b/c/d/package.json');
    t.is(readFileStub.getCall(7).args[0], absolutePath('a/b/c/d/.foorc'),
      'third dir: checked /a/b/c/d/.foorc');
    t.same(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/.foorc'));
    readFileStub.restore();
  });
});

test.serial('find package.json prop in second searched dir', function(t) {
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

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.') ,
  }).then(function(result) {
    t.is(readFileStub.callCount, 4);
    t.is(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked /a/b/c/d/e/f/.foorc');
    t.is(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked /a/b/c/d/e/f/foo.config.js');
    t.is(readFileStub.getCall(3).args[0], absolutePath('a/b/c/d/e/package.json'),
      'second dir: checked /a/b/c/d/e/package.json');
    t.same(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/e/package.json'));
    readFileStub.restore();
  });
});

test.serial('find JS file in first searched dir', function(t) {
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

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
  }).then(function(result) {
    t.is(readFileStub.callCount, 3);
    t.is(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked /a/b/c/d/e/f/.foorc');
    t.is(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked /a/b/c/d/e/f/foo.config.js');
    t.same(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/e/f/foo.config.js'));
    readFileStub.restore();
  });
});

test.serial('find package.json in second directory searched, with alternate names', function(t) {
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

  return cosmiconfig('foo', {
    cwd: startDir,
    rc: '.wowza',
    js: 'wowzaConfig.js',
    packageProp: 'heeha',
    stopDir: absolutePath('.'),
  }).then(function(result) {
    t.is(readFileStub.callCount, 4);
    t.is(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/.wowza'),
      'first dir: checked /a/b/c/d/e/f/.wowza');
    t.is(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/f/wowzaConfig.js'),
      'first dir: checked /a/b/c/d/e/f/wowzaConfig.js');
    t.is(readFileStub.getCall(3).args[0], absolutePath('a/b/c/d/e/package.json'),
      'first dir: checked /a/b/c/d/e/package.json');
    t.same(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/e/package.json'));
    readFileStub.restore();
  });
});

test.serial('find rc file in third searched dir, skipping packageProp, with rcStrictJson', function(t) {
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

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    packageProp: false,
    rcStrictJson: true,
  }).then(function(result) {
    t.is(readFileStub.callCount, 5);
    t.is(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked /a/b/c/d/e/f/.foorc');
    t.is(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked /a/b/c/d/e/f/foo.config.js');
    t.is(readFileStub.getCall(2).args[0], absolutePath('a/b/c/d/e/.foorc'),
      'second dir: checked /a/b/c/d/e/.foorc');
    t.is(readFileStub.getCall(3).args[0], absolutePath('a/b/c/d/e/foo.config.js'),
      'second dir: checked /a/b/c/d/e/foo.config.js');
    t.is(readFileStub.getCall(4).args[0], absolutePath('a/b/c/d/.foorc'),
      'third dir: checked /a/b/c/d/.foorc');
    t.same(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/.foorc'));
    readFileStub.restore();
  });
});

test.serial('find package.json prop in second searched dir, skipping js and rc', function(t) {
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

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    js: false,
    rc: false,
  }).then(function(result) {
    t.is(readFileStub.callCount, 2);
    t.is(readFileStub.getCall(0).args[0], absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(readFileStub.getCall(1).args[0], absolutePath('a/b/c/d/e/package.json'),
      'second dir: checked /a/b/c/d/e/package.json');
    t.same(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/e/package.json'));
    readFileStub.restore();
  });
});
