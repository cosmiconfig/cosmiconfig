var test = require('tape');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined JSON config path', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo.json'),
  })
    .then(function(result) {
      t.deepEqual(result.config, {
        foo: true,
      });
      t.equal(result.filepath, absolutePath('fixtures/foo.json'));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 2;

  t.plan(planned);
});

test('defined YAML config path', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo.yaml'),
  })
    .then(function(result) {
      t.deepEqual(result.config, {
        foo: true,
      });
      t.equal(result.filepath, absolutePath('fixtures/foo.yaml'));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 2;

  t.plan(planned);
});

test('defined JS config path', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo.js'),
  })
    .then(function(result) {
      t.deepEqual(result.config, {
        foo: true,
      });
      t.equal(result.filepath, absolutePath('fixtures/foo.js'));
    })
    .catch(function(err) {
      console.log(err.stack);
    });
  planned += 2;

  t.plan(planned);
});
