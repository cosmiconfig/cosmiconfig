'use strict';

var test = require('tape');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined file that does not exist', function (assert) {
  var loadConfig = cosmiconfig().load;
  loadConfig(null, absolutePath('does/not/exist'))
    .then(function () {
      assert.fail('should have errored');
      assert.end();
    })
    .catch(function (error) {
      assert.equal(error.code, 'ENOENT', 'with expected format');
      assert.end();
    });
});

test('defined JSON file with syntax error, without expected format', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.json'))
    .then(function () {
      assert.fail('should have errored');
      assert.end();
    })
    .catch(function (error) {
      assert.ok(/^Failed to parse/.test(error.message));
      assert.end();
    });
});

test('defined JSON file with syntax error, with expected format', function (assert) {
  var loadConfig = cosmiconfig(null, {
    format: 'json',
  }).load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.json'))
    .then(function () {
      assert.fail('should have errored');
      assert.end();
    })
    .catch(function (error) {
      assert.ok(/JSON Error/.test(error.message), 'threw correct error type');
      assert.end();
    });
});

test('defined YAML file with syntax error, without expected format', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.yaml'))
    .then(function () {
      assert.fail('should have errored');
      assert.end();
    })
    .catch(function (error) {
      assert.ok(/^Failed to parse/.test(error.message));
      assert.end();
    });
});

test('defined YAML file with syntax error, with expected format', function (assert) {
  var loadConfig = cosmiconfig(null, {
    format: 'yaml',
  }).load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.yaml'))
    .then(function () {
      assert.fail('should have errored');
      assert.end();
    })
    .catch(function (error) {
      assert.equal(error.name, 'YAMLException');
      assert.end();
    });
});

test('defined JS file with syntax error, without expected format', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.js'))
    .then(function () {
      assert.fail('should have errored');
      assert.end();
    })
    .catch(function (error) {
      assert.ok(/^Failed to parse/.test(error.message));
      assert.end();
    });
});

test('defined JS file with syntax error, with expected format', function (assert) {
  var loadConfig = cosmiconfig(null, {
    format: 'js',
  }).load;
  return loadConfig(null, absolutePath('fixtures/foo-invalid.js'))
    .then(function () {
      assert.fail('should have errored');
      assert.end();
    })
    .catch(function (error) {
      assert.ok(!/^Failed to parse/.test(error.message));
      assert.end();
    });
});
