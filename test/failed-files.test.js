'use strict';

var test = require('ava');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined file that does not exist', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('does/not/exist'))
    .then(assert.fail)
    .catch(function (error) {
      assert.is(error.code, 'ENOENT', 'with expected format');
    });
});

test('defined JSON file with syntax error, without expected format', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.json'))
    .then(assert.fail)
    .catch(function (error) {
      assert.truthy(/^Failed to parse/.test(error.message));
    });
});

test('defined JSON file with syntax error, with expected format', function (assert) {
  var loadConfig = cosmiconfig(null, {
    format: 'json',
  }).load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.json'))
    .then(assert.fail)
    .catch(function (error) {
      assert.is(error.name, 'JSONError');
    });
});

test('defined YAML file with syntax error, without expected format', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.yaml'))
    .then(assert.fail)
    .catch(function (error) {
      assert.truthy(/^Failed to parse/.test(error.message));
    });
});

test('defined YAML file with syntax error, with expected format', function (assert) {
  var loadConfig = cosmiconfig(null, {
    format: 'yaml',
  }).load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.yaml'))
    .then(assert.fail)
    .catch(function (error) {
      assert.is(error.name, 'YAMLException');
    });
});

test('defined JS file with syntax error, without expected format', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.js'))
    .then(assert.fail)
    .catch(function (error) {
      assert.truthy(/^Failed to parse/.test(error.message));
    });
});

test('defined JS file with syntax error, with expected format', function (assert) {
  var loadConfig = cosmiconfig(null, {
    format: 'js',
  }).load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.js'))
    .then(assert.fail)
    .catch(function (error) {
      assert.truthy(!/^Failed to parse/.test(error.message));
    });
});
