'use strict';

var test = require('tape');
var path = require('path');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined JSON config path', function (assert) {
  var loadConfig = cosmiconfig().load;
  loadConfig(null, absolutePath('fixtures/foo.json')).then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.equal(result.filepath, absolutePath('fixtures/foo.json'));
    assert.end();
  }).catch(function (err) {
    assert.end(err);
  });
});

test('defined YAML config path', function (assert) {
  var loadConfig = cosmiconfig().load;
  loadConfig(null, absolutePath('fixtures/foo.yaml')).then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.equal(result.filepath, absolutePath('fixtures/foo.yaml'));
    assert.end();
  }).catch(function (err) {
    assert.end(err);
  });
});

test('defined JS config path', function (assert) {
  var loadConfig = cosmiconfig().load;
  loadConfig(null, absolutePath('fixtures/foo.js')).then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.equal(result.filepath, absolutePath('fixtures/foo.js'));
    assert.end();
  }).catch(function (err) {
    assert.end(err);
  });
});

test('defined modulized JS config path', function (assert) {
  var loadConfig = cosmiconfig().load;
  loadConfig(null, absolutePath('fixtures/foo-module.js')).then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.equal(result.filepath, absolutePath('fixtures/foo-module.js'));
    assert.end();
  }).catch(function (err) {
    assert.end(err);
  });
});
