'use strict';

var test = require('tape');
var cosmiconfig = require('..');
var util = require('./util');

var absolutePath = util.absolutePath;

function failAssert(assert) {
  assert.fail('should have errored');
  assert.end();
}

test('defined file that does not exist', function(assert) {
  var loadConfig = cosmiconfig().load;
  var loadConfigSync = cosmiconfig(null, { sync: true }).load;
  try {
    loadConfigSync(null, absolutePath('does/not/exist'));
    failAssert(assert);
  } catch (error) {
    assert.equal(error.code, 'ENOENT', 'with expected format');
  }
  return loadConfig(null, absolutePath('does/not/exist'))
    .then(failAssert.bind(null, assert))
    .catch(function(error) {
      assert.equal(error.code, 'ENOENT', 'with expected format');
      assert.end();
    });
});

test('defined JSON file with syntax error, without expected format', function(
  assert
) {
  var loadConfig = cosmiconfig().load;
  var loadConfigSync = cosmiconfig(null, { sync: true }).load;
  try {
    loadConfigSync(null, absolutePath('fixtures/foo-invalid.json'));
    failAssert(assert);
  } catch (error) {
    assert.ok(/^Failed to parse/.test(error.message));
  }
  return loadConfig(null, absolutePath('fixtures/foo-invalid.json'))
    .then(failAssert.bind(null, assert))
    .catch(function(error) {
      assert.ok(/^Failed to parse/.test(error.message));
      assert.end();
    });
});

test('defined JSON file with syntax error, with expected format', function(
  assert
) {
  var loadConfig = cosmiconfig(null, { format: 'json' }).load;
  var loadConfigSync = cosmiconfig(null, { format: 'json', sync: true }).load;
  try {
    loadConfigSync(null, absolutePath('fixtures/foo-invalid.json'));
    failAssert(assert);
  } catch (error) {
    assert.ok(/JSON Error/.test(error.message), 'threw correct error type');
  }
  return loadConfig(null, absolutePath('fixtures/foo-invalid.json'))
    .then(failAssert.bind(null, assert))
    .catch(function(error) {
      assert.ok(/JSON Error/.test(error.message), 'threw correct error type');
      assert.end();
    });
});

test('defined YAML file with syntax error, without expected format', function(
  assert
) {
  var loadConfig = cosmiconfig().load;
  var loadConfigSync = cosmiconfig(null, { sync: true }).load;
  try {
    loadConfigSync(null, absolutePath('fixtures/foo-invalid.yaml'));
    failAssert(assert);
  } catch (error) {
    assert.ok(/^Failed to parse/.test(error.message));
  }
  return loadConfig(null, absolutePath('fixtures/foo-invalid.yaml'))
    .then(failAssert.bind(null, assert))
    .catch(function(error) {
      assert.ok(/^Failed to parse/.test(error.message));
      assert.end();
    });
});

test('defined YAML file with syntax error, with expected format', function(
  assert
) {
  var loadConfig = cosmiconfig(null, { format: 'yaml' }).load;
  var loadConfigSync = cosmiconfig(null, { format: 'yaml', sync: true }).load;
  try {
    loadConfigSync(null, absolutePath('fixtures/foo-invalid.yaml'));
    failAssert(assert);
  } catch (error) {
    assert.equal(error.name, 'YAMLException');
  }
  return loadConfig(null, absolutePath('fixtures/foo-invalid.yaml'))
    .then(failAssert.bind(null, assert))
    .catch(function(error) {
      assert.equal(error.name, 'YAMLException');
      assert.end();
    });
});

test('defined JS file with syntax error, without expected format', function(
  assert
) {
  var loadConfig = cosmiconfig().load;
  var loadConfigSync = cosmiconfig(null, { sync: true }).load;
  try {
    loadConfigSync(null, absolutePath('fixtures/foo-invalid.js'));
    failAssert(assert);
  } catch (error) {
    assert.ok(/^Failed to parse/.test(error.message));
  }
  return loadConfig(null, absolutePath('fixtures/foo-invalid.js'))
    .then(failAssert.bind(null, assert))
    .catch(function(error) {
      assert.ok(/^Failed to parse/.test(error.message));
      assert.end();
    });
});

test('defined JS file with syntax error, with expected format', function(
  assert
) {
  var loadConfig = cosmiconfig(null, { format: 'js' }).load;
  var loadConfigSync = cosmiconfig(null, { format: 'js', sync: true }).load;
  try {
    loadConfigSync(null, absolutePath('fixtures/foo-invalid.js'));
    failAssert(assert);
  } catch (error) {
    assert.ok(!/^Failed to parse/.test(error.message));
  }
  return loadConfig(null, absolutePath('fixtures/foo-invalid.js'))
    .then(failAssert.bind(null, assert))
    .catch(function(error) {
      assert.ok(!/^Failed to parse/.test(error.message));
      assert.end();
    });
});
