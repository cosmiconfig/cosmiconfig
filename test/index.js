var test = require('tape');
var sinon = require('sinon');
var fs = require('graceful-fs');
var configHunter = require('..');

test('find file in third dir in rc file, with a package.json lacking prop', function(t) {
  var planned = 0;
  var startDir = '/a/b/c/d/e/f';
  var readFileStub = sinon.stub(fs, 'readFile', function(searchPath, encoding, callback) {
    switch (searchPath) {
      case '/a/b/c/d/e/f/package.json':
      case '/a/b/c/d/e/f/.foorc':
      case '/a/b/c/d/e/f/foo.config.js':
      case '/a/b/c/d/e/package.json':
      case '/a/b/c/d/e/.foorc':
      case '/a/b/c/d/e/foo.config.js':
        callback(new Error());
        break;
      case '/a/b/c/d/package.json':
        callback(null, '{ "false": "hope" }');
        break;
      case '/a/b/c/d/.foorc':
        callback(null, '{ "found": true }');
        break;
      default:
        callback(new Error('irrelevant path ' + searchPath));
    }
  });

  configHunter('foo', { cwd: startDir })
    .then(function(result) {
      t.equal(readFileStub.callCount, 8);
      t.equal(readFileStub.getCall(0).args[0], '/a/b/c/d/e/f/package.json',
        'first dir: checked /a/b/c/d/e/f/package.json');
      t.equal(readFileStub.getCall(1).args[0], '/a/b/c/d/e/f/.foorc',
        'first dir: checked /a/b/c/d/e/f/.foorc');
      t.equal(readFileStub.getCall(2).args[0], '/a/b/c/d/e/f/foo.config.js',
        'first dir: checked /a/b/c/d/e/f/foo.config.js');
      t.equal(readFileStub.getCall(3).args[0], '/a/b/c/d/e/package.json',
        'second dir: checked /a/b/c/d/e/package.json');
      t.equal(readFileStub.getCall(4).args[0], '/a/b/c/d/e/.foorc',
        'second dir: checked /a/b/c/d/e/.foorc');
      t.equal(readFileStub.getCall(5).args[0], '/a/b/c/d/e/foo.config.js',
        'second dir: checked /a/b/c/d/e/foo.config.js');
      t.equal(readFileStub.getCall(6).args[0], '/a/b/c/d/package.json',
        'third dir: checked /a/b/c/d/package.json');
      t.equal(readFileStub.getCall(7).args[0], '/a/b/c/d/.foorc',
        'third dir: checked /a/b/c/d/.foorc');
      t.deepEqual(result.config, {
        found: true,
      });
      t.equal(result.filepath, '/a/b/c/d/.foorc');
      readFileStub.restore();
    })
    .catch(function(err) {
      /* eslint-disable no-console */
      console.log(err.stack);
      /* eslint-enable no-console */
    })
  planned += 11;

  t.plan(planned);
});
