var test = require('tape');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined file that does not exist', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    configPath: absolutePath('does/not/exist'),
  })
    .catch(function(error) {
      t.equal(error.code, 'ENOENT', 'with expected format');
    });
  planned += 1;

  t.plan(planned);
});

test('defined JSON file with syntax error', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.json'),
  })
    .catch(function(error) {
      t.ok(/^Failed to parse/.test(error.message), 'without expected format');
    });
  planned += 1;

  cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.json'),
    format: 'json',
  })
    .catch(function(error) {
      t.equal(error.name, 'JSONError', 'with expected format');
    });
  planned += 1;

  t.plan(planned);
});

test('defined YAML file with syntax error', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.yaml'),
  })
    .catch(function(error) {
      t.ok(/^Failed to parse/.test(error.message), 'without expected format');
    });
  planned += 1;

  cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.yaml'),
    format: 'yaml',
  })
    .catch(function(error) {
      t.equal(error.name, 'YAMLException', 'with expected format');
    });
  planned += 1;

  t.plan(planned);
});

test('defined JS file with syntax error', function(t) {
  var planned = 0;

  cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.js'),
  })
    .catch(function(error) {
      t.ok(/^Failed to parse/.test(error.message), 'without expected format');
    });
  planned += 1;

  cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.js'),
    format: 'js',
  })
    .catch(function(error) {
      t.ok(error);
      t.ok(!/^Failed to parse/.test(error.message));
    });
  planned += 2;

  t.plan(planned);
});
