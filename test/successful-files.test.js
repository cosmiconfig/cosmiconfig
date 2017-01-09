'use strict';

var test = require('tape');
var path = require('path');
var fs = require('fs');
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

test('.eslintrc', function (assert) {
  var loadConfig = cosmiconfig('eslint', {
  }).load;
  var rcFile = absolutePath('../.eslintrc');
  return loadConfig(require.resolve('../')).then(function (result) {
    var config = eval.call(null, '(' + fs.readFileSync(rcFile).toString() + ')');

    config.extends = config.extends.map(function (moduleId){
      return require.resolve(moduleId.replace(/^(?:eslint-config-)?/, 'eslint-config-'));
    });

    assert.deepEqual(result.config, config);
    assert.is(result.filepath, rcFile);
  });
});

test('eslint-config-davidtheclark-node', function (assert) {
  var loadConfig = cosmiconfig('eslint', {
  }).load;
  var rcFile = require.resolve('eslint-config-davidtheclark-node');
  return loadConfig(null, rcFile).then(function (result) {
    var config = require(rcFile);
    config.plugins = config.plugins.map(function (moduleId){
      return require.resolve(moduleId.replace(/^(?:eslint-plugin-)?/, 'eslint-plugin-'));
    });

    assert.deepEqual(result.config, config);
    // console.log(result.config.extends[0].plugins[0]);
    assert.is(result.filepath, rcFile);
  });
});
