'use strict';

const test = require('ava');
const path = require('path');
const cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined JSON config path', (assert) => {
  const loadConfig = cosmiconfig().load;
  return loadConfig(absolutePath('fixtures/foo.json')).then((result) => {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.is(result.filepath, absolutePath('fixtures/foo.json'));
  });
});

test('defined YAML config path', (assert) => {
  const loadConfig = cosmiconfig().load;
  return loadConfig(absolutePath('fixtures/foo.yaml')).then((result) => {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.is(result.filepath, absolutePath('fixtures/foo.yaml'));
  });
});

test('defined JS config path', (assert) => {
  const loadConfig = cosmiconfig().load;
  return loadConfig(absolutePath('fixtures/foo.js')).then((result) => {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.is(result.filepath, absolutePath('fixtures/foo.js'));
  });
});

test('defined modulized JS config path', (assert) => {
  const loadConfig = cosmiconfig().load;
  return loadConfig(absolutePath('fixtures/foo-module.js')).then((result) => {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.is(result.filepath, absolutePath('fixtures/foo-module.js'));
  });
});
