var test = require('ava');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined file that does not exist', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('does/not/exist'),
  }).catch(function(error) {
    t.is(error.code, 'ENOENT', 'with expected format');
  });
});

test('defined JSON file with syntax error, without expected format', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.json'),
  }).catch(function(error) {
    t.truthy(/^Failed to parse/.test(error.message));
  });
});

test('defined JSON file with syntax error, with expected format', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.json'),
    format: 'json',
  }).catch(function(error) {
    t.is(error.name, 'JSONError');
  });
});

test('defined YAML file with syntax error, without expected format', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.yaml'),
  }).catch(function(error) {
    t.truthy(/^Failed to parse/.test(error.message));
  });
});

test('defined YAML file with syntax error, with expected format', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.yaml'),
    format: 'yaml',
  }).catch(function(error) {
    t.is(error.name, 'YAMLException');
  });
});

test('defined JS file with syntax error, without expected format', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.js'),
  }).catch(function(error) {
    t.truthy(/^Failed to parse/.test(error.message));
  });
});

test('defined JS file with syntax error, with expected format', function(t) {
  return cosmiconfig(null, {
    configPath: absolutePath('fixtures/foo-invalid.js'),
    format: 'js',
  }).catch(function(error) {
    t.truthy(!/^Failed to parse/.test(error.message));
  });
});
