'use strict';

var test = require('ava');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined JSON config path', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo.json')).then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.is(result.filepath, absolutePath('fixtures/foo.json'));
  });
});

test('defined YAML config path', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo.yaml')).then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.is(result.filepath, absolutePath('fixtures/foo.yaml'));
  });
});

test('defined JS config path', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo.js')).then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.is(result.filepath, absolutePath('fixtures/foo.js'));
  });
});

test('defined modulized JS config path', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo-module.js')).then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.is(result.filepath, absolutePath('fixtures/foo-module.js'));
  });
});
