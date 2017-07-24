'use strict';

var test = require('tape');
var cosmiconfig = require('..');
var util = require('./util');

var absolutePath = util.absolutePath;
var failAssert = util.failAssert;

function doAsserts(assert, result, filePath) {
  assert.deepEqual(result.config, {
    foo: true,
  });
  assert.equal(result.filepath, filePath);
}

function makeFileTest(file) {
  var filePath = absolutePath(file);
  return function fileTest(assert) {
    var loadConfig = cosmiconfig().load;
    var loadConfigSync = cosmiconfig(null, { sync: true }).load;

    try {
      var result = loadConfigSync(null, filePath);
      doAsserts(assert, result, filePath);
      loadConfig(null, filePath)
        .then(function(result) {
          doAsserts(assert, result, filePath);
          assert.end();
        })
        .catch(function(err) {
          assert.end(err);
        });
    } catch (err) {
      assert.end(err);
    }
  };
}

function transform(result) {
  result.config.foo = [result.config.foo];
  return result;
}

// eslint-disable-next-line no-unused-vars
function transformWithError(result) {
  throw new Error('These pretzels are making me thirsty!');
}

test('defined JSON config path', makeFileTest('fixtures/foo.json'));

test('defined YAML config path', makeFileTest('fixtures/foo.yaml'));

test('defined JS config path', makeFileTest('fixtures/foo.js'));

test(
  'defined modulized JS config path',
  makeFileTest('fixtures/foo-module.js')
);

test('transform sync', function(assert) {
  // for testing transform, it should be enough to check for any 1 file type
  var filePath = absolutePath('fixtures/foo.json');
  var loadConfigSync = cosmiconfig(null, {
    sync: true,
    transform: transform,
  }).load;

  try {
    var result = loadConfigSync(null, filePath);

    assert.deepEqual(
      result.config,
      { foo: [true] },
      'Result config should be transformed'
    );

    assert.end();
  } catch (err) {
    assert.end(err);
  }
});

test('transform async', function(assert) {
  // for testing transform, it should be enough to check for any 1 file type
  var filePath = absolutePath('fixtures/foo.json');
  var loadConfig = cosmiconfig(null, {
    transform: transform,
  }).load;

  loadConfig(null, filePath)
    .then(function(result) {
      assert.deepEqual(
        result.config,
        { foo: [true] },
        'Result config should be transformed'
      );

      assert.end();
    })
    .catch(function(err) {
      assert.end(err);
    });
});

test('transform errors not swallowed in sync', function(assert) {
  var filePath = absolutePath('fixtures/foo.json');
  var loadConfigSync = cosmiconfig(null, {
    sync: true,
    transform: transformWithError,
  }).load;

  try {
    loadConfigSync(null, filePath);

    failAssert(assert);
  } catch (err) {
    assert.equal('These pretzels are making me thirsty!', err.message);
    assert.end();
  }
});

test('transform errors not swallowed in async', function(assert) {
  var filePath = absolutePath('fixtures/foo.json');
  var loadConfig = cosmiconfig(null, { transform: transformWithError }).load;

  loadConfig(null, filePath)
    // eslint-disable-next-line no-unused-vars
    .then(function(result) {
      failAssert(assert);
    })
    .catch(function(err) {
      assert.equal('These pretzels are making me thirsty!', err.message);
      assert.end();
    });
});
