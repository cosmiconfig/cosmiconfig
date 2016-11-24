'use strict';

var test = require('ava');
var path = require('path');
var fs = require('fs');
var assign = require('object-assign');
var cosmiconfig = require('..');

function absolutePath(str) {
  return path.join(__dirname, str);
}

test('defined JSON config path', function (assert) {
  var loadConfig = cosmiconfig().load;
  return loadConfig(null, absolutePath('fixtures/foo.json')).then(function (result) {
    assert.deepEqual(result.config, {
      extends: [
        {
          foo: true,
        },
      ],
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
  var loadConfig = cosmiconfig('stylelint', {
    extends: ['extends'],
  }).load;
  return loadConfig(null, absolutePath('fixtures/foo-module.js')).then(function (result) {
    assert.deepEqual(result.config, {
      foo: true,
    });
    assert.is(result.filepath, absolutePath('fixtures/foo-module.js'));
  });
});

test('eslint config file', function (assert) {
  var loadConfig = cosmiconfig('eslint', {
  }).load;
  var rcFile = absolutePath('../.eslintrc');
  return loadConfig(require.resolve('../')).then(function (result) {
    var config = eval.call(null, '(' + fs.readFileSync(rcFile).toString() + ')');

    config.extends = [assign({}, require('eslint-config-davidtheclark-node'), {
      plugins:[require('eslint-plugin-node')],
    })];

    assert.deepEqual(result.config, config);
    // console.log(result.config.extends[0].plugins[0]);
    assert.is(result.filepath, rcFile);
  });
});
