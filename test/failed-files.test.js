'use strict';

const test = require('ava');
const path = require('path');
const cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined file that does not exist', (assert) => {
  const loadConfig = cosmiconfig().load;
  return loadConfig(absolutePath('does/not/exist'))
    .then(assert.fail)
    .catch((error) => {
      assert.is(error.code, 'ENOENT', 'with expected format');
    });
});

test('defined JSON file with syntax error, without expected format', (assert) => {
  const loadConfig = cosmiconfig().load;
  return loadConfig(absolutePath('fixtures/foo-invalid.json'))
    .then(assert.fail)
    .catch((error) => {
      assert.truthy(/^Failed to parse/.test(error.message));
    });
});

test('defined JSON file with syntax error, with expected format', (assert) => {
  const loadConfig = cosmiconfig(null, {
    format: 'json',
  }).load;
  return loadConfig(absolutePath('fixtures/foo-invalid.json'))
    .then(assert.fail)
    .catch((error) => {
      assert.is(error.name, 'JSONError');
    });
});

test('defined YAML file with syntax error, without expected format', (assert) => {
  const loadConfig = cosmiconfig().load;
  return loadConfig(absolutePath('fixtures/foo-invalid.yaml'))
    .then(assert.fail)
    .catch((error) => {
      assert.truthy(/^Failed to parse/.test(error.message));
    });
});

test('defined YAML file with syntax error, with expected format', (assert) => {
  const loadConfig = cosmiconfig(null, {
    format: 'yaml',
  }).load;
  return loadConfig(absolutePath('fixtures/foo-invalid.yaml'))
    .then(assert.fail)
    .catch((error) => {
      assert.is(error.name, 'YAMLException');
    });
});

test('defined JS file with syntax error, without expected format', (assert) => {
  const loadConfig = cosmiconfig().load;
  return loadConfig(absolutePath('fixtures/foo-invalid.js'))
    .then(assert.fail)
    .catch((error) => {
      assert.truthy(/^Failed to parse/.test(error.message));
    });
});

test('defined JS file with syntax error, with expected format', (assert) => {
  const loadConfig = cosmiconfig(null, {
    format: 'js',
  }).load;
  return loadConfig(absolutePath('fixtures/foo-invalid.js'))
    .then(assert.fail)
    .catch((error) => {
      assert.truthy(!/^Failed to parse/.test(error.message));
    });
});
