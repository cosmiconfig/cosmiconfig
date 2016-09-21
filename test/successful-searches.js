var test = require('ava');
var sinon = require('sinon');
var path = require('path');
var fs = require('graceful-fs');
var _ = require('lodash');
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
    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked /a/b/c/d/e/f/.foorc');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked /a/b/c/d/e/f/foo.config.js');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/e/package.json'),
      'second dir: checked /a/b/c/d/e/package.json');
    t.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/b/c/d/e/.foorc'),
      'second dir: checked /a/b/c/d/e/.foorc');
    t.is(_.get(readFileStub.getCall(5), 'args[0]'), absolutePath('a/b/c/d/e/foo.config.js'),
      'second dir: checked /a/b/c/d/e/foo.config.js');
    t.is(_.get(readFileStub.getCall(6), 'args[0]'), absolutePath('a/b/c/d/package.json'),
      'third dir: checked /a/b/c/d/package.json');
    t.is(_.get(readFileStub.getCall(7), 'args[0]'), absolutePath('a/b/c/d/.foorc'),
      'third dir: checked /a/b/c/d/.foorc');
    t.deepEqual(result.config, {
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
    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked /a/b/c/d/e/f/.foorc');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked /a/b/c/d/e/f/foo.config.js');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/e/package.json'),
      'second dir: checked /a/b/c/d/e/package.json');
    t.deepEqual(result.config, {
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
    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked /a/b/c/d/e/f/.foorc');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked /a/b/c/d/e/f/foo.config.js');
    t.deepEqual(result.config, {
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
    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/.wowza'),
      'first dir: checked /a/b/c/d/e/f/.wowza');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/f/wowzaConfig.js'),
      'first dir: checked /a/b/c/d/e/f/wowzaConfig.js');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/e/package.json'),
      'first dir: checked /a/b/c/d/e/package.json');
    t.deepEqual(result.config, {
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
    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked /a/b/c/d/e/f/.foorc');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked /a/b/c/d/e/f/foo.config.js');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/.foorc'),
      'second dir: checked /a/b/c/d/e/.foorc');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/e/foo.config.js'),
      'second dir: checked /a/b/c/d/e/foo.config.js');
    t.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/b/c/d/.foorc'),
      'third dir: checked /a/b/c/d/.foorc');
    t.deepEqual(result.config, {
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
    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked /a/b/c/d/e/f/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/package.json'),
      'second dir: checked /a/b/c/d/e/package.json');
    t.deepEqual(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/e/package.json'));
    readFileStub.restore();
  });
});

// RC file with specified extension

test.serial('with rcExtensions, find .foorc.json in second searched dir', function(t) {
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).then(function(result) {
    t.is(readFileStub.callCount, 10);

    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked a/b/c/d/e/f/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked a/b/c/d/e/f/.foorc');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.json'),
      'first dir: checked a/b/c/d/e/f/.foorc.json');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.yaml'),
      'first dir: checked a/b/c/d/e/f/.foorc.yaml');
    t.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.yml'),
      'first dir: checked a/b/c/d/e/f/.foorc.yml');
    t.is(_.get(readFileStub.getCall(5), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.js'),
      'first dir: checked a/b/c/d/e/f/.foorc.js');
    t.is(_.get(readFileStub.getCall(6), 'args[0]'), absolutePath('a/b/c/d/e/f/foo.config.js'),
      'first dir: checked a/b/c/d/e/f/foo.config.js');
    t.is(_.get(readFileStub.getCall(7), 'args[0]'), absolutePath('a/b/c/d/e/package.json'),
      'first dir: checked a/b/c/d/e/package.json');
    t.is(_.get(readFileStub.getCall(8), 'args[0]'), absolutePath('a/b/c/d/e/.foorc'),
      'first dir: checked a/b/c/d/e/.foorc');
    t.is(_.get(readFileStub.getCall(9), 'args[0]'), absolutePath('a/b/c/d/e/.foorc.json'),
      'first dir: checked a/b/c/d/e/.foorc.json');
    t.deepEqual(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/e/.foorc.json'));
    readFileStub.restore();
  });
});

test.serial('with rcExtensions, find .foorc.yaml in first searched dir', function(t) {
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).then(function(result) {
    t.is(readFileStub.callCount, 4);

    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked a/b/c/d/e/f/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked a/b/c/d/e/f/.foorc');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.json'),
      'first dir: checked a/b/c/d/e/f/.foorc.json');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.yaml'),
      'first dir: checked a/b/c/d/e/f/.foorc.yaml');
    t.deepEqual(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/e/f/.foorc.yaml'));
    readFileStub.restore();
  });
});

test.serial('with rcExtensions, find .foorc.yml in first searched dir', function(t) {
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).then(function(result) {
    t.is(readFileStub.callCount, 5);

    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked a/b/c/d/e/f/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked a/b/c/d/e/f/.foorc');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.json'),
      'first dir: checked a/b/c/d/e/f/.foorc.json');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.yaml'),
      'first dir: checked a/b/c/d/e/f/.foorc.yaml');
    t.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.yml'),
      'first dir: checked a/b/c/d/e/f/.foorc.yml');
    t.deepEqual(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/e/f/.foorc.yml'));
    readFileStub.restore();
  });
});

test.serial('with rcExtensions, find .foorc.js in first searched dir', function(t) {
  var startDir = absolutePath('a/b/c/d/e/f');
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
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
  });

  return cosmiconfig('foo', {
    cwd: startDir,
    stopDir: absolutePath('.'),
    rcExtensions: true,
  }).then(function(result) {
    t.is(readFileStub.callCount, 6);

    t.is(_.get(readFileStub.getCall(0), 'args[0]'), absolutePath('a/b/c/d/e/f/package.json'),
      'first dir: checked a/b/c/d/e/f/package.json');
    t.is(_.get(readFileStub.getCall(1), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc'),
      'first dir: checked a/b/c/d/e/f/.foorc');
    t.is(_.get(readFileStub.getCall(2), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.json'),
      'first dir: checked a/b/c/d/e/f/.foorc.json');
    t.is(_.get(readFileStub.getCall(3), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.yaml'),
      'first dir: checked a/b/c/d/e/f/.foorc.yaml');
    t.is(_.get(readFileStub.getCall(4), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.yml'),
      'first dir: checked a/b/c/d/e/f/.foorc.yml');
    t.is(_.get(readFileStub.getCall(5), 'args[0]'), absolutePath('a/b/c/d/e/f/.foorc.js'),
      'first dir: checked a/b/c/d/e/f/.foorc.js');
    t.deepEqual(result.config, {
      found: true,
    });
    t.is(result.filepath, absolutePath('a/b/c/d/e/f/.foorc.js'));
    readFileStub.restore();
  });
});
